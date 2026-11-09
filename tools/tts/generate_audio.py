#!/usr/bin/env python3
"""Generate the course audio for one module with Kokoro (neural TTS, offline).

Every clip is declared in the module's JSON content:

* any object with an ``audio`` id, a ``speaker`` and a ``text`` (or ``tts``) field;
* every phonetics item, which yields four clips by convention:
  ``<lesson>-ph-<id>-us`` (coach, US), ``-slow`` (coach, slow), ``-uk`` (UK voice)
  and ``-ex`` (example sentence in context).

Voices come from ``content/cast.json`` (speaker -> Kokoro voice + accent).
Text is phonemized with misaki (US or GB) so that heteronyms and inline overrides
such as ``[progress](/pɹˈɑɡɹɛs/)`` are honoured.

Usage:
  python3 tools/tts/generate_audio.py --module content/b1-1/m01 --out audio/b1-1/m01 \
      --model kokoro-v1.0.onnx --voices voices-v1.0.bin [--force] [--only ID ...]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
import warnings
from pathlib import Path

import numpy as np

warnings.filterwarnings("ignore")

ROOT = Path(__file__).resolve().parents[2]
SAMPLE_RATE = 24000

# Speed per kind of clip. B1 learners get natural but unhurried speech.
SPEED = {
    "default": 0.95,
    "coach": 0.92,
    "slow": 0.72,
    "dictation": 0.9,
}
SENTENCE_PAUSE = 0.38  # seconds between sentences inside one clip
LEAD_SILENCE = 0.12
TAIL_SILENCE = 0.30
TARGET_RMS_DB = -20.0
PEAK_LIMIT_DB = -1.0


# ---------------------------------------------------------------- content walk

def clean_text(text: str) -> str:
    """Strip the course's inline markup ({{chunk}}, *em*, **strong**) for TTS."""
    text = text.replace("{{", "").replace("}}", "")
    text = re.sub(r"\*\*(.+?)\*\*", r"\1", text)
    text = re.sub(r"\*(.+?)\*", r"\1", text)
    text = text.replace("‘", "'").replace("’", "'").replace("“", '"').replace("”", '"')
    return re.sub(r"\s+", " ", text).strip()


def collect_clips(module_dir: Path) -> list[dict]:
    clips: list[dict] = []
    files = sorted(module_dir.glob("l*.json")) + [module_dir / "review.json"]
    for path in files:
        if not path.exists():
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        lesson_id = data.get("id")

        def walk(node, ctx: str):
            if isinstance(node, dict):
                if isinstance(node.get("audio"), str) and node.get("speaker") and (node.get("text") or node.get("tts")):
                    kind = "dictation" if node.get("type") == "dictation" else "default"
                    clips.append({
                        "id": node["audio"],
                        "speaker": node["speaker"],
                        "text": clean_text(node.get("tts") or node["text"]),
                        "display": clean_text(node.get("text") or node.get("tts")),
                        "kind": kind,
                        "source": f"{path.name}:{ctx}",
                    })
                for key, value in node.items():
                    walk(value, f"{ctx}.{key}" if ctx else key)
            elif isinstance(node, list):
                for i, value in enumerate(node):
                    walk(value, f"{ctx}[{i}]")

        walk(data, "")

        for item in (data.get("phonetics") or {}).get("items", []):
            base = f"{lesson_id}-ph-{item['id']}"
            say = item.get("say") or item["term"]
            clips.append({"id": f"{base}-us", "speaker": "coach", "text": item.get("ttsUs") or say,
                          "display": say, "kind": "coach", "source": f"{path.name}:phonetics.{item['id']}"})
            clips.append({"id": f"{base}-slow", "speaker": "coach", "text": item.get("ttsUs") or say,
                          "display": say, "kind": "slow", "source": f"{path.name}:phonetics.{item['id']}"})
            clips.append({"id": f"{base}-uk", "speaker": "emma",
                          "text": item.get("ttsUk") or item.get("sayUk") or say,
                          "display": item.get("sayUk") or say, "kind": "coach",
                          "source": f"{path.name}:phonetics.{item['id']}"})
            ex = item.get("example")
            if ex:
                clips.append({"id": f"{base}-ex", "speaker": ex["speaker"],
                              "text": clean_text(ex.get("tts") or ex["text"]),
                              "display": clean_text(ex["text"]), "kind": "default",
                              "source": f"{path.name}:phonetics.{item['id']}.example"})

    seen: dict[str, str] = {}
    for clip in clips:
        if clip["id"] in seen:
            raise SystemExit(f"Duplicate audio id {clip['id']} ({seen[clip['id']]} / {clip['source']})")
        seen[clip["id"]] = clip["source"]
    return clips


# ---------------------------------------------------------------- synthesis

class Synth:
    def __init__(self, model: Path, voices: Path):
        import espeakng_loader
        from phonemizer.backend.espeak.wrapper import EspeakWrapper

        EspeakWrapper.set_library(espeakng_loader.get_library_path())
        EspeakWrapper.set_data_path(espeakng_loader.get_data_path())
        from kokoro_onnx import Kokoro
        from misaki import en, espeak

        self.kokoro = Kokoro(str(model), str(voices))
        self.g2p = {
            "en-us": en.G2P(trf=False, british=False, fallback=espeak.EspeakFallback(british=False)),
            "en-gb": en.G2P(trf=False, british=True, fallback=espeak.EspeakFallback(british=True)),
        }

    @staticmethod
    def sentences(text: str) -> list[str]:
        # Split after . ! ? (keeping them) unless the next char is lowercase (e.g. "p.m. today").
        parts = re.split(r"(?<=[.!?])\s+(?=[A-Z0-9\"'(])", text)
        return [p.strip() for p in parts if p.strip()]

    def render(self, text: str, voice: str, lang: str, speed: float) -> np.ndarray:
        chunks = []
        pause = np.zeros(int(SENTENCE_PAUSE * SAMPLE_RATE), dtype=np.float32)
        for i, sentence in enumerate(self.sentences(text)):
            phonemes, _ = self.g2p[lang](sentence)
            audio, sr = self.kokoro.create(phonemes, voice=voice, speed=speed, is_phonemes=True)
            assert sr == SAMPLE_RATE
            if i:
                chunks.append(pause)
            chunks.append(audio.astype(np.float32))
        return np.concatenate(chunks)


def master(audio: np.ndarray) -> np.ndarray:
    """Even loudness across voices: RMS target + peak ceiling, plus breathing room."""
    rms = float(np.sqrt(np.mean(audio ** 2))) or 1e-9
    gain = 10 ** (TARGET_RMS_DB / 20) / rms
    peak = float(np.max(np.abs(audio))) * gain
    ceiling = 10 ** (PEAK_LIMIT_DB / 20)
    if peak > ceiling:
        gain *= ceiling / peak
    audio = audio * gain
    fade = int(0.01 * SAMPLE_RATE)
    if len(audio) > 2 * fade:
        audio[:fade] *= np.linspace(0, 1, fade)
        audio[-fade:] *= np.linspace(1, 0, fade)
    lead = np.zeros(int(LEAD_SILENCE * SAMPLE_RATE), dtype=np.float32)
    tail = np.zeros(int(TAIL_SILENCE * SAMPLE_RATE), dtype=np.float32)
    return np.concatenate([lead, audio, tail]).astype(np.float32)


def encode_mp3(audio: np.ndarray, dest: Path) -> None:
    import soundfile as sf

    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as tmp:
        wav = Path(tmp.name)
    try:
        sf.write(wav, audio, SAMPLE_RATE, subtype="PCM_16")
        subprocess.run([
            "ffmpeg", "-loglevel", "error", "-y", "-i", str(wav),
            "-ac", "1", "-ar", str(SAMPLE_RATE), "-codec:a", "libmp3lame", "-b:a", "64k",
            "-id3v2_version", "0", "-map_metadata", "-1", str(dest),
        ], check=True)
    finally:
        wav.unlink(missing_ok=True)


def clip_hash(clip: dict, voice: str, speed: float) -> str:
    key = json.dumps([clip["text"], voice, speed, SENTENCE_PAUSE, TARGET_RMS_DB], ensure_ascii=False)
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:12]


# ---------------------------------------------------------------- main

def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--module", default="content/b1-1/m01")
    ap.add_argument("--out", default="audio/b1-1/m01")
    ap.add_argument("--cast", default="content/cast.json")
    ap.add_argument("--model", default=os.environ.get("KOKORO_MODEL", "kokoro-v1.0.onnx"))
    ap.add_argument("--voices", default=os.environ.get("KOKORO_VOICES", "voices-v1.0.bin"))
    ap.add_argument("--force", action="store_true", help="regenerate every clip")
    ap.add_argument("--only", nargs="*", help="regenerate only these clip ids")
    ap.add_argument("--list", action="store_true", help="list clips and exit")
    args = ap.parse_args()

    module_dir = (ROOT / args.module).resolve()
    out_dir = (ROOT / args.out).resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    cast = json.loads((ROOT / args.cast).read_text(encoding="utf-8"))["speakers"]

    clips = collect_clips(module_dir)
    for clip in clips:
        if clip["speaker"] not in cast:
            raise SystemExit(f"Unknown speaker '{clip['speaker']}' in {clip['source']}")
    if args.list:
        for clip in clips:
            print(f"{clip['id']:32s} {clip['speaker']:7s} {clip['text']}")
        print(f"{len(clips)} clips")
        return 0

    manifest_path = out_dir / "manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    manifest = manifest.get("clips", {})

    synth = None
    done = skipped = 0
    for clip in clips:
        spk = cast[clip["speaker"]]
        speed = SPEED.get(clip["kind"], SPEED["default"])
        if clip["kind"] == "default" and clip["speaker"] == "coach":
            speed = SPEED["coach"]
        h = clip_hash(clip, spk["voice"], speed)
        dest = out_dir / f"{clip['id']}.mp3"
        wanted = args.force or (args.only and clip["id"] in args.only)
        if not wanted and dest.exists() and manifest.get(clip["id"], {}).get("hash") == h:
            skipped += 1
            continue
        if args.only and clip["id"] not in args.only:
            skipped += 1
            continue
        if synth is None:
            synth = Synth(Path(args.model), Path(args.voices))
        audio = master(synth.render(clip["text"], spk["voice"], spk["lang"], speed))
        encode_mp3(audio, dest)
        manifest[clip["id"]] = {
            "file": dest.name,
            "duration": round(len(audio) / SAMPLE_RATE, 2),
            "speaker": clip["speaker"],
            "voice": spk["voice"],
            "speed": speed,
            "text": clip["display"],
            "hash": h,
        }
        done += 1
        print(f"✓ {clip['id']:32s} {spk['voice']:10s} {manifest[clip['id']]['duration']:5.2f}s  {clip['display'][:60]}")

    valid = {c["id"] for c in clips}
    for stale in sorted(set(manifest) - valid):
        (out_dir / f"{stale}.mp3").unlink(missing_ok=True)
        del manifest[stale]
        print(f"✗ removed stale clip {stale}")

    ordered = {cid: manifest[cid] for cid in sorted(manifest)}
    manifest_path.write_text(json.dumps({
        "engine": "Kokoro-82M v1.0 (ONNX) + misaki G2P",
        "sampleRate": SAMPLE_RATE,
        "format": "mp3 64 kbps mono",
        "count": len(ordered),
        "clips": ordered,
    }, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"\n{done} generated, {skipped} up to date, {len(ordered)} in manifest → {manifest_path.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
