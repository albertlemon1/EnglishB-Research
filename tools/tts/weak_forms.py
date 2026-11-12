#!/usr/bin/env python3
"""Force the weak forms of function words in a module's TTS text (B2.1).

misaki reads most function words with their full vowel (can /kæn/, for /fɔɹ/,
but /bʌt/, could /kʊd/, at /æt/...). From Module 26 the course teaches those
weak forms, and a lesson must never be contradicted by its own audio, so this
script writes a ``tts`` field with inline misaki overrides for every clip of a
module: ``[can](/kən/)``. It is idempotent and only touches words that are not
already inside an override.

Rules (see docs/B2-1.md, Module 26):
* a word keeps its strong form at the end of a clause (before , . ; : ! ? or the
  end of the clip) and before an apostrophe (can't, wasn't);
* ``some`` is weak only before a noun (not before ``of``);
* ``had`` is weak only as an auxiliary (a past participle follows);
* ``her`` loses its /h/ after another word and keeps it at the start of a clause;
* ``for``, ``or`` and ``her`` are r-less in British voices unless a vowel follows;
* ``and`` is /ənd/, not /ən/: PocketSphinx hears /ən/ as *in* (measured).
* ``than`` and ``to`` are left to misaki, which already reduces them.

Phonetics items keep their hand-written ``ttsUs`` / ``ttsUk``; their examples
and variants are processed like any other clip.

Usage: python3 tools/tts/weak_forms.py content/b2-1/m26 [--check]
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(Path(__file__).resolve().parent))

OVERRIDE = re.compile(r"\[[^\]]+\]\(/[^)]*/\)")
WORD = re.compile(r"[A-Za-z]+(?:'[A-Za-z]+)?")
VOWEL_START = re.compile(r"^[aeiouAEIOU]")
PARTICIPLE = re.compile(
    r"^(\w+ed|been|known|done|made|told|thought|sent|had|seen|taken|given|heard|left|kept|paid|built|"
    r"brought|found|run|set|put|met|won|lost|spent|chosen|got|gotten|written|spoken|begun|gone)$", re.I)

# word -> (US, GB before consonant, GB before vowel)
WEAK = {
    "can": ("kən", "kən", "kən"),
    "was": ("wəz", "wəz", "wəz"),
    "some": ("səm", "səm", "səm"),
    "of": ("əv", "əv", "əv"),
    "for": ("fəɹ", "fə", "fəɹ"),
    "but": ("bət", "bət", "bət"),
    "and": ("ənd", "ənd", "ənd"),
    "could": ("kəd", "kəd", "kəd"),
    "would": ("wəd", "wəd", "wəd"),
    "should": ("ʃəd", "ʃəd", "ʃəd"),
    "or": ("əɹ", "ə", "əɹ"),
    "as": ("əz", "əz", "əz"),
    "at": ("ət", "ət", "ət"),
    "from": ("fɹəm", "fɹəm", "fɹəm"),
    "had": ("həd", "həd", "həd"),
}
HER_DROPPED = ("əɹ", "ə", "əɹ")
HER_INITIAL = ("həɹ", "hə", "həɹ")
STRANDING = set(",.;:!?)\"—–…")


def clean_text(text: str) -> str:
    from generate_audio import clean_text as gen_clean
    return gen_clean(text)


def weaken(text: str, british: bool) -> str:
    spans = [m.span() for m in OVERRIDE.finditer(text)]
    inside = lambda pos: any(a <= pos < b for a, b in spans)
    out, last = [], 0
    for m in WORD.finditer(text):
        word, start, end = m.group(0), m.start(), m.end()
        if inside(start):
            continue
        low = word.lower()
        if low not in WEAK and low != "her":
            continue
        rest = text[end:]
        nxt_char = rest[:1]
        if nxt_char in ("'", "’") or not rest.strip() or rest.lstrip()[:1] in STRANDING:
            continue  # strong: contraction or end of clause
        nxt = WORD.match(rest.lstrip())
        nxt_word = nxt.group(0) if nxt else ""
        before_vowel = bool(VOWEL_START.match(nxt_word))
        prev = text[:start].rstrip()
        clause_start = not prev or prev[-1] in ".,;:!?(\"—–"
        if low == "some" and (nxt_word.lower() == "of" or not nxt_word):
            continue
        if low == "had" and not PARTICIPLE.match(nxt_word):
            continue
        if low == "her":
            forms = HER_INITIAL if clause_start else HER_DROPPED
        else:
            forms = WEAK[low]
        phon = forms[0] if not british else (forms[2] if before_vowel else forms[1])
        out.append(text[last:start])
        out.append(f"[{word}](/{phon}/)")
        last = end
    out.append(text[last:])
    return "".join(out)


def process(module_dir: Path, check: bool) -> int:
    cast = json.loads((ROOT / "content/cast.json").read_text(encoding="utf-8"))["speakers"]
    changed_files = 0
    changes = 0
    for path in sorted(module_dir.glob("l*.json")) + [module_dir / "review.json"]:
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        dirty = False

        def walk(node):
            nonlocal dirty, changes
            if isinstance(node, dict):
                if node.get("speaker") in cast and (node.get("text") or node.get("tts")):
                    british = cast[node["speaker"]].get("lang") == "en-gb"
                    source = node.get("tts") or clean_text(node["text"])
                    new = weaken(source, british)
                    if new != (node.get("tts") or clean_text(node["text"])) or ("tts" in node and new != node["tts"]):
                        if new != node.get("tts"):
                            node["tts"] = new
                            dirty = True
                            changes += 1
                for value in node.values():
                    walk(value)
            elif isinstance(node, list):
                for value in node:
                    walk(value)

        walk(data)
        if dirty:
            changed_files += 1
            if not check:
                path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    verb = "would change" if check else "updated"
    print(f"{changes} clips {verb} in {changed_files} files")
    return 1 if (check and changes) else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("module_dir")
    ap.add_argument("--check", action="store_true", help="report without writing (exit 1 if something is missing)")
    args = ap.parse_args()
    sys.exit(process(Path(args.module_dir), args.check))
