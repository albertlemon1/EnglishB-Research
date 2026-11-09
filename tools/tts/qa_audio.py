#!/usr/bin/env python3
"""Rough intelligibility check for generated clips with an offline recognizer.

Transcribes every clip in a manifest with PocketSphinx (US acoustic model) and
reports the word error rate against the scripted text. PocketSphinx is weak on
British voices and isolated words, so treat the numbers as a smoke test: a clip
with a very high WER deserves a listen, not an automatic rejection.

Usage: python3 tools/tts/qa_audio.py audio/b1-1/m01 [--threshold 0.5]
"""
from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
from pathlib import Path


def words(text: str) -> list[str]:
    text = text.lower().replace("’", "'")
    text = re.sub(r"[^a-z0-9' ]+", " ", text.replace("-", " "))
    return text.split()


def wer(ref: list[str], hyp: list[str]) -> float:
    if not ref:
        return 0.0
    d = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, 1):
        prev, d[0] = d[0], i
        for j, h in enumerate(hyp, 1):
            cur = min(d[j] + 1, d[j - 1] + 1, prev + (r != h))
            prev, d[j] = d[j], cur
    return d[len(hyp)] / len(ref)


def main() -> int:
    from pocketsphinx import Decoder

    ap = argparse.ArgumentParser()
    ap.add_argument("audio_dir")
    ap.add_argument("--threshold", type=float, default=0.5)
    args = ap.parse_args()
    folder = Path(args.audio_dir)
    clips = json.loads((folder / "manifest.json").read_text(encoding="utf-8"))["clips"]
    decoder = Decoder(samprate=16000)
    rows = []
    for cid, meta in clips.items():
        raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", str(folder / meta["file"]),
                              "-f", "s16le", "-ac", "1", "-ar", "16000", "-"],
                             check=True, capture_output=True).stdout
        decoder.start_utt()
        decoder.process_raw(raw, full_utt=True)
        decoder.end_utt()
        hyp = decoder.hyp().hypstr if decoder.hyp() else ""
        rows.append((wer(words(meta["text"]), words(hyp)), cid, meta, hyp))
    rows.sort(key=lambda r: -r[0])
    flagged = [r for r in rows if r[0] > args.threshold and len(words(r[2]["text"])) > 3]
    for score, cid, meta, hyp in flagged:
        print(f"{score:4.2f} {cid:30s} [{meta['voice']}]\n     ref: {meta['text']}\n     hyp: {hyp}")
    sentences = [r for r in rows if len(words(r[2]["text"])) > 3]
    mean = sum(r[0] for r in sentences) / max(1, len(sentences))
    by_voice: dict[str, list[float]] = {}
    for score, _, meta, _ in sentences:
        by_voice.setdefault(meta["voice"], []).append(score)
    print(f"\n{len(rows)} clips · {len(sentences)} sentences · mean WER {mean:.2f} · flagged {len(flagged)}")
    for voice, scores in sorted(by_voice.items()):
        print(f"  {voice:11s} n={len(scores):3d}  mean WER {sum(scores) / len(scores):.2f}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
