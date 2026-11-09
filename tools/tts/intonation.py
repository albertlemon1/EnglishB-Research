"""Question-tag intonation control for generated clips (Praat PSOLA via parselmouth).

Why this exists: Kokoro does not reliably raise the pitch on a question tag that
ends in "?" — measured on six voices, most tags meant to rise actually fell. A
lesson that labels a clip "↗ rising" must not play a falling tag, so for clips
whose content declares a tone ("rise" or "fall") the tag's pitch contour is
imposed explicitly and then measured.

Strategy (hybrid, most natural first):
1. Synthesize the whole sentence. If the comma pause before the tag is clearly
   detectable (the longest silence in the final stretch, ≥ 60 ms, leaving a tag of
   plausible length), reshape only the tag in place.
2. Otherwise synthesize the main clause and the tag separately, join them with a
   100 ms pause, and reshape the tag, whose boundaries are then exact.
Either way the result is measured; a tag that doesn't move ≥ 3 semitones in the
intended direction raises an error instead of shipping.
"""
from __future__ import annotations

import re

import numpy as np
import parselmouth
from parselmouth.praat import call

FLOOR, CEIL = 70, 450
MIN_MOVE = 3.0       # semitones: smallest movement QA accepts
ACCEPT_SINGLE = 4.5  # semitones: the in-place reshape must move at least this much, else use the split method
OCTAVE_JUMP = 9.0    # semitones from the tag's median: farther points are pitch-tracking octave errors

TAG_RE = re.compile(
    r"^(?P<main>.+,)\s*(?P<tag>(?:\w+n't|is|are|am|was|were|do|does|did|have|has|had|can|could|will|would|should)"
    r"\s+(?:it|you|he|she|we|they|I|there)\s*[?.!])$",
    re.I,
)

# Contours in semitones relative to the speaker's median F0 in the main clause:
# (position within the tag's voiced span, semitones).
SHAPES = {
    "rise": [(0.0, -2.0), (0.45, -1.0), (1.0, +6.5)],   # low-rise: a genuine question
    "fall": [(0.0, +4.0), (0.35, +3.0), (1.0, -4.5)],   # high-fall: seeking agreement
}


def split_tag(sentence: str):
    m = TAG_RE.match(sentence.strip())
    return (m.group("main"), m.group("tag")) if m else None


def _pitch(a: np.ndarray, sr: int):
    snd = parselmouth.Sound(a.astype(np.float64), sampling_frequency=sr)
    p = snd.to_pitch(time_step=0.01, pitch_floor=FLOOR, pitch_ceiling=CEIL)
    return snd, p.selected_array["frequency"], p.xs()


def median_f0(a: np.ndarray, sr: int) -> float | None:
    _, f, _ = _pitch(a, sr)
    f = f[f > 0]
    return float(np.median(f)) if len(f) else None


def slope(a: np.ndarray, sr: int, start: float = 0.0, end: float | None = None) -> float | None:
    """Pitch movement (semitones) across the voiced frames in [start, end]."""
    _, f, t = _pitch(a, sr)
    m = (f > 0) & (t >= start)
    if end is not None:
        m &= t <= end
    if m.sum() < 4:
        return None
    seg = 12 * np.log2(f[m] / 100.0)
    # Drop octave errors (halved/doubled F0 on a creaky final consonant); they
    # are not melody and would exaggerate or invert the measured movement.
    seg = seg[np.abs(seg - np.median(seg)) <= OCTAVE_JUMP]
    if len(seg) < 4:
        return None
    n = max(2, len(seg) // 3)
    return float(np.median(seg[-n:]) - np.median(seg[:n]))


def find_tag_start(a: np.ndarray, sr: int, window: float = 1.6) -> float | None:
    """End of the comma pause before the tag, or None when no clear pause exists.

    Uses the *longest* silence in the final stretch: stop closures inside the tag
    (the /t/ of "isn't", the /d/ of "didn't") are shorter than a comma pause.
    """
    hop = int(0.01 * sr)
    rms = np.array([np.sqrt(np.mean(a[i:i + hop] ** 2)) for i in range(0, len(a) - hop, hop)])
    if not len(rms):
        return None
    thr = rms.max() * 10 ** (-30 / 20)
    voiced = np.where(rms > thr)[0]
    if not len(voiced):
        return None
    first, last = voiced[0], voiced[-1]
    lo = max(first + 5, last - int(window / 0.01))
    best_len, best_end, run = 0, None, 0
    for i in range(lo, last + 1):
        if rms[i] <= thr:
            run += 1
        else:
            if run > best_len:
                best_len, best_end = run, i
            run = 0
    if best_end is None or best_len < 6:
        return None
    t0 = best_end * hop / sr
    tag_len = last * hop / sr - t0
    return t0 if 0.25 <= tag_len <= 0.9 else None


def _reshape(a: np.ndarray, sr: int, tone: str, ref: float, start: float) -> np.ndarray | None:
    snd, f, t = _pitch(a, sr)
    vt = t[(f > 0) & (t >= start)]
    if len(vt) < 3:
        return None
    vs, ve = float(vt[0]), float(vt[-1])
    manip = call(snd, "To Manipulation", 0.01, FLOOR, CEIL)
    pt = call(manip, "Extract pitch tier")
    call(pt, "Remove points between", start, snd.duration)
    for frac, st in SHAPES[tone]:
        call(pt, "Add point", vs + frac * (ve - vs), ref * 2 ** (st / 12))
    call([pt, manip], "Replace pitch tier")
    return call(manip, "Get resynthesis (overlap-add)").values[0].astype(np.float32)


def _ok(tone: str, s: float | None) -> bool:
    return s is not None and (s >= MIN_MOVE if tone == "rise" else s <= -MIN_MOVE)


def render_tagged(sentence: str, tone: str, synth, sr: int) -> tuple[np.ndarray, dict]:
    """Return (audio, info) with the tag shaped to `tone`.

    `synth(text) -> np.ndarray` renders one piece of text with the clip's voice.
    info = {"start": tag start (s, within this audio), "end": ..., "slope": st, "method": ...}
    """
    if tone not in SHAPES:
        raise ValueError(f"tone must be 'rise' or 'fall', got {tone!r}")
    parts = split_tag(sentence)
    if not parts:
        raise ValueError(f"no question tag found in {sentence!r}")
    main, tag = parts

    # 1) single pass, reshape in place
    whole = synth(sentence)
    t0 = find_tag_start(whole, sr)
    ref = None
    if t0 is not None:
        ref = median_f0(whole[: int(t0 * sr)], sr)
        if ref:
            shaped = _reshape(whole, sr, tone, ref, t0)
            if shaped is not None:
                s = slope(shaped, sr, t0)
                if _ok(tone, s) and abs(s) >= ACCEPT_SINGLE:
                    return shaped, {"start": round(t0, 3), "end": round(len(shaped) / sr, 3), "slope": round(s, 1), "method": "single"}

    # 2) main clause and tag synthesized separately; the tag's boundaries are exact
    a_main = synth(main)
    a_tag = synth(tag.rstrip(".!?") + "?")
    ref = median_f0(a_main, sr) or median_f0(a_tag, sr)
    shaped_tag = _reshape(a_tag, sr, tone, ref, 0.0)
    if shaped_tag is None:
        raise RuntimeError(f"could not reshape the tag in {sentence!r}")
    pause = np.zeros(int(0.10 * sr), dtype=np.float32)
    out = np.concatenate([a_main.astype(np.float32), pause, shaped_tag])
    start = (len(a_main) + len(pause)) / sr
    s = slope(out, sr, start)
    if not _ok(tone, s):
        raise RuntimeError(f"tag in {sentence!r} moved {s} st, expected {tone}")
    return out, {"start": round(start, 3), "end": round(len(out) / sr, 3), "slope": round(s, 1), "method": "split"}
