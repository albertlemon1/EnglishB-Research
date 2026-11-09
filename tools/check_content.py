#!/usr/bin/env python3
"""Validate course content: JSON syntax, speakers, practice answers and audio files.

Usage: python3 tools/check_content.py
Exit code 1 if anything is broken.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MODULES = {"m01": ("content/b1-1/m01", "audio/b1-1/m01")}
BLOCKS = ["lexical", "discovery", "phonetics", "consolidation", "practice", "task"]


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
        for m in s["modules"]:
            if len(m["lessons"]) != 5:
                problems.append(f"{m['id']}: {len(m['lessons'])} lessons")
            for d in m["domains"]:
                if d not in course["domains"]:
                    problems.append(f"{m['id']}: unknown domain {d}")

    for mod_id, (cdir, adir) in MODULES.items():
        cdir, adir = ROOT / cdir, ROOT / adir
        module = json.loads((cdir / "module.json").read_text(encoding="utf-8"))
        manifest = json.loads((adir / "manifest.json").read_text(encoding="utf-8"))["clips"]
        refs: set[str] = set()
        files = [cdir / f"{l}.json" for l in module["lessons"]] + [cdir / "review.json"]
        for path in files:
            data = json.loads(path.read_text(encoding="utf-8"))

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
                    for k, v in node.items():
                        walk(v, f"{where}.{k}")
                elif isinstance(node, list):
                    for i, v in enumerate(node):
                        walk(v, f"{where}[{i}]")

            walk(data, path.stem)
            for item in (data.get("phonetics") or {}).get("items", []):
                for suffix in ("us", "slow", "uk", "ex"):
                    refs.add(f"{data['id']}-ph-{item['id']}-{suffix}")
            items = (data.get("practice") or []) + (data.get("items") or [])
            items += (data.get("lexical") or {}).get("comprehension", []) + (data.get("discovery") or {}).get("questions", [])
            for i, it in enumerate(items):
                t = it.get("type", "choice")
                if t in ("choice", "stress"):
                    n = len(it.get("options") or it.get("syllables") or [])
                    if not 0 <= it["answer"] < n:
                        problems.append(f"{path.name}: item {i} answer out of range")
                if t in ("gap", "fix") and not it.get("accept"):
                    problems.append(f"{path.name}: item {i} without accepted answers")
                if t == "order" and " ".join(sorted(it["words"])) != " ".join(sorted(it["answer"].split())):
                    problems.append(f"{path.name}: order item {i} words do not match the answer")
                if t in ("gap", "choice") and it.get("text") and it["text"] != "___" and "___" not in it["text"]:
                    problems.append(f"{path.name}: item {i} has no ___ gap")
            if "task" in data:
                for c in data["task"]["chunks"]:
                    re.compile(c["re"])
            if "lexical" in data:
                for q in data["lexical"]["registerQuiz"]:
                    if q["answer"] not in ("casual", "neutral", "formal"):
                        problems.append(f"{path.name}: bad register answer {q['answer']}")

        for ref in sorted(refs):
            if not (adir / f"{ref}.mp3").exists():
                problems.append(f"{mod_id}: missing audio file {ref}.mp3")
            if ref not in manifest:
                problems.append(f"{mod_id}: {ref} not in manifest")
        orphans = sorted(set(manifest) - refs)
        for o in orphans:
            problems.append(f"{mod_id}: clip {o} is never used")
        print(f"{mod_id}: {len(files)} files, {len(refs)} audio references, {len(manifest)} clips")

    print(f"course: {len(course['sublevels'])} sublevels, {sum(len(s['modules']) for s in course['sublevels'])} modules, {total_lessons} lessons, {total_hours} h")
    for p in problems:
        print("✗", p)
    print("OK" if not problems else f"{len(problems)} problem(s)")
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
