#!/usr/bin/env python3
"""Validate course content: JSON syntax, speakers, practice answers and audio files.

Usage: python3 tools/check_content.py
Exit code 1 if anything is broken.

Sublevel-aware rules: a sublevel with "ui": "en" (B2) has withdrawn the Spanish
scaffolding, so its lessons must use open discovery questions, English chunk
definitions instead of translations, tasks with key words instead of sentence
frames, and a metacognitive self-check (see docs/B2-1.md).
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
BLOCKS = ["lexical", "discovery", "phonetics", "consolidation", "practice", "task"]
ITEM_TYPES = {"choice", "gap", "order", "fix", "stress", "dictation", "intonation", "open", "organizer"}
SC_AREAS = {"impact", "register", "accuracy", "l1", "strategy"}
SPANISH_MARKS = re.compile(r"[¿¡]|\b(Puedo|Escribe|Elige|Completa|Ordena|Corrige|Escucha|Lee|Explica)\b")


def published_modules(course: dict) -> dict[str, dict]:
    """Modules with content → {dir, audio, first, needs_audio, ui}.

    "available": content and audio are published. "draft": the texts are written but
    the audio is still pending, so the content is validated and the audio checks are
    skipped (the app hides drafts unless it is opened with ?borrador). A draft may
    still be missing lessons after the first one: they are reported as pending."""
    out, lesson = {}, 0
    for s in course["sublevels"]:
        for m in s["modules"]:
            first = lesson + 1
            lesson += len(m["lessons"])
            if m.get("status") in ("available", "draft"):
                out[m["id"]] = dict(dir=f"content/{s['id']}/{m['id']}", audio=f"audio/{s['id']}/{m['id']}", first=first,
                                    needs_audio=m["status"] == "available", ui=s.get("ui", "es"))
    return out


def check_item(it: dict, i: int, name: str, problems: list[str]) -> None:
    t = it.get("type", "choice")
    if t not in ITEM_TYPES:
        problems.append(f"{name}: item {i} has unknown type {t}")
        return
    if t == "intonation" and it.get("answer") not in ("rise", "fall"):
        problems.append(f"{name}: intonation item {i} answer must be rise or fall")
    if t in ("choice", "stress"):
        n = len(it.get("options") or it.get("syllables") or [])
        if not 0 <= it["answer"] < n:
            problems.append(f"{name}: item {i} answer out of range")
    if t in ("gap", "fix") and not it.get("accept"):
        problems.append(f"{name}: item {i} without accepted answers")
    if t == "order" and " ".join(sorted(it["words"])) != " ".join(sorted(it["answer"].split())):
        problems.append(f"{name}: order item {i} words do not match the answer")
    if t in ("gap", "choice") and it.get("text") and it["text"] != "___" and "___" not in it["text"]:
        problems.append(f"{name}: item {i} has no ___ gap")
    if t == "open":
        if not (it.get("q") or it.get("prompt")) or not it.get("model"):
            problems.append(f"{name}: open item {i} needs q and model")
        crit = it.get("criteria") or []
        if not 2 <= len(crit) <= 4:
            problems.append(f"{name}: open item {i} needs 2 to 4 criteria (has {len(crit)})")
        for s in it.get("signals") or []:
            try:
                re.compile(s["re"] if isinstance(s, dict) else s)
            except re.error as e:
                problems.append(f"{name}: open item {i} has a bad signal regex ({e})")
    if t == "organizer":
        kind = it.get("kind")
        gaps = 0
        if kind == "table":
            cols = it.get("columns") or []
            if not cols:
                problems.append(f"{name}: organizer {i} needs columns")
            for r, row in enumerate(it.get("rows") or []):
                if len(row) != len(cols):
                    problems.append(f"{name}: organizer {i} row {r} has {len(row)} cells for {len(cols)} columns")
                for c in row:
                    if isinstance(c, dict):
                        gaps += 1
                        if not c.get("accept") or not c.get("gap"):
                            problems.append(f"{name}: organizer {i} row {r} has a gap without gap/accept")
        elif kind == "timeline":
            for k, pt in enumerate(it.get("points") or []):
                if not pt.get("when"):
                    problems.append(f"{name}: organizer {i} point {k} needs 'when'")
                if "gap" in pt:
                    gaps += 1
                    if not pt.get("accept"):
                        problems.append(f"{name}: organizer {i} point {k} gap without accept")
                elif not pt.get("text"):
                    problems.append(f"{name}: organizer {i} point {k} needs text or gap")
        else:
            problems.append(f"{name}: organizer {i} kind must be table or timeline")
        if not gaps:
            problems.append(f"{name}: organizer {i} has no gaps")


def english_only(value, where: str, problems: list[str]) -> None:
    """B2 content: a crude guard against Spanish slipping into English-only fields."""
    if isinstance(value, str):
        if SPANISH_MARKS.search(value):
            problems.append(f"{where}: looks Spanish in an English-only field: {value[:60]!r}")
    elif isinstance(value, list):
        for i, v in enumerate(value):
            english_only(v, f"{where}[{i}]", problems)


def check_b2_lesson(data: dict, name: str, problems: list[str]) -> None:
    """Scaffolding-fading rules for a sublevel with "ui": "en"."""
    if "discovery" in data:
        qs = data["discovery"].get("questions", [])
        kinds = [q.get("kind") for q in qs]
        if sorted(kinds) != ["pragmatic", "semantic", "syntactic"]:
            problems.append(f"{name}: B2 discovery needs one semantic, one syntactic and one pragmatic question (has {kinds})")
        for i, q in enumerate(qs):
            if q.get("type") != "open":
                problems.append(f"{name}: B2 discovery question {i} must be type open (no multiple choice)")
    if "lexical" in data:
        for i, c in enumerate(data["lexical"].get("chunks", [])):
            if not c.get("def"):
                problems.append(f"{name}: chunk {i} ({c.get('en')}) needs an English definition (def)")
            if c.get("es"):
                problems.append(f"{name}: chunk {i} ({c.get('en')}) must not carry a Spanish translation (es) in B2")
    if "task" in data:
        task = data["task"]
        if task.get("frames"):
            problems.append(f"{name}: B2 tasks give key words, not sentence frames (frames)")
        if not task.get("keywords"):
            problems.append(f"{name}: B2 task needs keywords")
        if task.get("extra", {}).get("frames"):
            problems.append(f"{name}: B2 extra task must not have frames")
        for i, s in enumerate(task.get("selfCheck", [])):
            if not isinstance(s, dict):
                problems.append(f"{name}: B2 selfCheck item {i} must be an object with area and text")
            elif s.get("area") not in SC_AREAS or not s.get("text"):
                problems.append(f"{name}: B2 selfCheck item {i} needs area in {sorted(SC_AREAS)} and text")
        for field in ("scenario", "brief", "steps"):
            english_only(task.get(field), f"{name}:task.{field}", problems)
    for field in ("summary", "canDo", "warmup"):
        english_only(data.get(field), f"{name}:{field}", problems)
    if "intro" in data and name.startswith("module"):
        english_only(data.get("intro"), f"{name}:intro", problems)


def main() -> int:
    problems: list[str] = []
    course = json.loads((ROOT / "content/course.json").read_text(encoding="utf-8"))
    cast = json.loads((ROOT / "content/cast.json").read_text(encoding="utf-8"))["speakers"]

    total_hours = sum(s["hours"] for s in course["sublevels"])
    total_lessons = sum(len(m["lessons"]) for s in course["sublevels"] for m in s["modules"])
    if total_hours != course["totalHours"]:
        problems.append(f"course: hours add up to {total_hours}, expected {course['totalHours']}")
    if total_lessons != course["totalHours"]:
        problems.append(f"course: {total_lessons} lessons for {course['totalHours']} hours")
    for s in course["sublevels"]:
        if len(s["modules"]) * 5 != s["hours"]:
            problems.append(f"{s['code']}: {len(s['modules'])} modules × 5 h ≠ {s['hours']} h")
        if s.get("ui") not in (None, "es", "en"):
            problems.append(f"{s['code']}: ui must be es or en")
        for m in s["modules"]:
            if len(m["lessons"]) != 5:
                problems.append(f"{m['id']}: {len(m['lessons'])} lessons")
            for d in m["domains"]:
                if d not in course["domains"]:
                    problems.append(f"{m['id']}: unknown domain {d}")

    seen_clips: dict[str, str] = {}
    for mod_id, info in published_modules(course).items():
        cdir, adir = ROOT / info["dir"], ROOT / info["audio"]
        first_lesson, needs_audio, b2 = info["first"], info["needs_audio"], info["ui"] == "en"
        module = json.loads((cdir / "module.json").read_text(encoding="utf-8"))
        expected = [f"l{n:02d}" for n in range(first_lesson, first_lesson + len(module["lessons"]))]
        if module["lessons"] != expected:
            problems.append(f"{mod_id}: lesson ids {module['lessons']} should follow the course numbering {expected}")
        for spk in module.get("cast", []):
            if spk not in cast:
                problems.append(f"{mod_id}: cast member {spk} missing from cast.json")
        if b2:
            check_b2_lesson(module, "module.json", problems)
        manifest = json.loads((adir / "manifest.json").read_text(encoding="utf-8"))["clips"] if needs_audio else {}
        refs: set[str] = set()
        wanted = [cdir / f"{l}.json" for l in module["lessons"]] + [cdir / "review.json"]
        files = [f for f in wanted if f.exists()]
        pending = [f.name for f in wanted if not f.exists()]
        if pending and (needs_audio or not (cdir / f"{module['lessons'][0]}.json").exists()):
            problems.append(f"{mod_id}: missing files {pending}")
        for path in files:
            data = json.loads(path.read_text(encoding="utf-8"))
            if path.stem.startswith("l") and data.get("id") != path.stem:
                problems.append(f"{path.name}: id {data.get('id')} does not match the file name")
            if path.stem.startswith("l") and data.get("n") != int(path.stem[1:]):
                problems.append(f"{path.name}: n={data.get('n')} but the file is lesson {path.stem[1:]}")

            def walk(node, where):
                if isinstance(node, dict):
                    if isinstance(node.get("audio"), str):
                        refs.add(node["audio"])
                        if node.get("speaker") not in cast:
                            problems.append(f"{path.name}:{where}: unknown speaker {node.get('speaker')}")
                    if isinstance(node.get("audioRef"), str):
                        refs.add(node["audioRef"])
                    if "{{" in json.dumps(node.get("text", "")) and node.get("text", "").count("{{") != node.get("text", "").count("}}"):
                        problems.append(f"{path.name}:{where}: unbalanced {{{{ }}}}")
                    for field in ("text", "tts"):
                        val = node.get(field)
                        # "I {{'ve lived}}" renders as "I 've lived" and can split the contraction in TTS.
                        if isinstance(val, str) and re.search(r"\w\s+(\{\{)?'(ve|s|re|ll|d|m|t)\b", val):
                            problems.append(f"{path.name}:{where}.{field}: space before a contraction in {val[:50]!r}")
                    for k, v in node.items():
                        walk(v, f"{where}.{k}")
                elif isinstance(node, list):
                    for i, v in enumerate(node):
                        walk(v, f"{where}[{i}]")

            walk(data, path.stem)
            for item in (data.get("phonetics") or {}).get("items", []):
                for suffix in ("us", "slow", "uk", "ex"):
                    refs.add(f"{data['id']}-ph-{item['id']}-{suffix}")
            if path.stem.startswith("l") and len((data.get("phonetics") or {}).get("items", [])) < 4:
                problems.append(f"{path.name}: the phonetic glossary needs at least 4 items")
            items = (data.get("practice") or []) + (data.get("items") or [])
            disc = data.get("discovery") or {}
            items += (data.get("lexical") or {}).get("comprehension", []) + disc.get("questions", [])
            if disc.get("organizer"):
                items.append(disc["organizer"])
            for i, it in enumerate(items):
                check_item(it, i, path.name, problems)
            if "task" in data:
                for c in data["task"]["chunks"]:
                    re.compile(c["re"])
                if not data["task"].get("frames") and not data["task"].get("keywords"):
                    problems.append(f"{path.name}: task needs frames (B1) or keywords (B2)")
            if "lexical" in data:
                for q in data["lexical"]["registerQuiz"]:
                    if q["answer"] not in ("casual", "neutral", "formal"):
                        problems.append(f"{path.name}: bad register answer {q['answer']}")
            if b2 and path.stem.startswith("l"):
                check_b2_lesson(data, path.name, problems)

        for ref in sorted(refs) if needs_audio else []:
            if not (adir / f"{ref}.mp3").exists():
                problems.append(f"{mod_id}: missing audio file {ref}.mp3")
            if ref not in manifest:
                problems.append(f"{mod_id}: {ref} not in manifest")
        for ref in refs:
            if ref in seen_clips and seen_clips[ref] != mod_id:
                problems.append(f"audio id {ref} is used by both {seen_clips[ref]} and {mod_id}: ids must be unique across the course")
            seen_clips[ref] = mod_id
        if not needs_audio:
            for ref in refs:
                if not re.fullmatch(r"[a-z0-9-]+", ref):
                    problems.append(f"{mod_id}: audio id {ref!r} must use lowercase letters, digits and hyphens")
                if not (ref.startswith("l") or ref.startswith(f"{mod_id}-rv-")):
                    problems.append(f"{mod_id}: audio id {ref} needs a lesson prefix or {mod_id}-rv-")
        orphans = sorted(set(manifest) - refs)
        for o in orphans:
            problems.append(f"{mod_id}: clip {o} is never used")
        state = f"{len(manifest)} clips" if needs_audio else "draft (audio pending" + (f", {len(pending)} file(s) still to write" if pending else "") + ")"
        print(f"{mod_id}: {len(files)} files, {len(refs)} audio references, {state}")

    print(f"course: {len(course['sublevels'])} sublevels, {sum(len(s['modules']) for s in course['sublevels'])} modules, {total_lessons} lessons, {total_hours} h")
    for p in problems:
        print("✗", p)
    print("OK" if not problems else f"{len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
