// One audio element for the whole app: tapping a new clip stops the previous one.
import { store } from "./store.js";

const el = new Audio();
el.preload = "auto";
let current = null; // { id, btn }
let queue = null; // { ids, index, onStep, onEnd }
// Clip ids are unique across the whole course (they carry the global lesson
// number, e.g. l06-scn, or a module prefix for reviews), so one index serves
// every module that has been loaded.
const index = new Map(); // id -> { base, meta }
const byModule = new Map(); // module id -> clips object

export const audio = {
  register(mod, base, clips = {}) {
    byModule.set(mod, clips);
    for (const [id, meta] of Object.entries(clips)) index.set(id, { base, meta });
  },
  isRegistered(mod) { return byModule.has(mod); },
  clips(mod) { return byModule.get(mod) || {}; },
  url(id) { const e = index.get(id); return e ? `${e.base}${id}.mp3` : ""; },
  duration(id) { return index.get(id)?.meta.duration || 0; },
  has(id) { return index.has(id); },
  meta(id) { return index.get(id)?.meta; },

  toggle(id, btn) {
    if (current && current.id === id && !el.paused) { el.pause(); return; }
    if (current && current.id === id && el.paused && el.currentTime > 0 && el.currentTime < el.duration) {
      el.play().catch(() => {});
      return;
    }
    queue = null;
    start(id, btn);
  },

  sequence(ids, { onStep, onEnd } = {}) {
    if (queue && !el.paused) { this.stop(); return false; }
    queue = { ids, index: 0, onStep, onEnd };
    step();
    return true;
  },

  stop() {
    el.pause();
    const q = queue;
    queue = null;
    finish();
    q?.onEnd?.();
  },

  get playingId() { return current && !el.paused ? current.id : null; },

  setSpeed(rate) {
    store.setSetting("speed", rate);
    el.playbackRate = rate;
  },
};

function step() {
  if (!queue) return;
  const { ids, index } = queue;
  if (index >= ids.length) {
    const q = queue;
    queue = null;
    q.onEnd?.();
    return;
  }
  const id = ids[index];
  queue.onStep?.(id, index);
  const btn = document.querySelector(`[data-play="${CSS.escape(id)}"]`);
  start(id, btn);
}

function start(id, btn) {
  finish();
  current = { id, btn };
  el.src = audio.url(id);
  el.playbackRate = store.settings.speed || 1;
  el.preservesPitch = true;
  btn?.classList.add("is-loading");
  el.play().catch(() => {
    btn?.classList.remove("is-loading");
    finish();
  });
}

function finish() {
  document.querySelectorAll(".play.is-playing, .play.is-loading").forEach((b) => {
    b.classList.remove("is-playing", "is-loading");
    b.style.setProperty("--p", 0);
  });
  document.querySelectorAll(".wave.on").forEach((w) => {
    w.classList.remove("on");
    w.querySelectorAll("i.lit").forEach((i) => i.classList.remove("lit"));
  });
}

function buttonsFor(id) {
  return document.querySelectorAll(`[data-play="${CSS.escape(id)}"]`);
}

el.addEventListener("playing", () => {
  if (!current) return;
  buttonsFor(current.id).forEach((b) => { b.classList.remove("is-loading"); b.classList.add("is-playing"); });
  document.querySelectorAll(`[data-wave="${CSS.escape(current.id)}"]`).forEach((w) => w.classList.add("on"));
});
el.addEventListener("pause", () => {
  if (!current) return;
  buttonsFor(current.id).forEach((b) => b.classList.remove("is-playing"));
});
el.addEventListener("timeupdate", () => {
  if (!current || !el.duration) return;
  const p = el.currentTime / el.duration;
  buttonsFor(current.id).forEach((b) => b.style.setProperty("--p", p.toFixed(3)));
  document.querySelectorAll(`[data-wave="${CSS.escape(current.id)}"]`).forEach((w) => {
    const bars = w.children;
    const lit = Math.round(p * bars.length);
    for (let i = 0; i < bars.length; i++) bars[i].classList.toggle("lit", i < lit);
  });
});
el.addEventListener("ended", () => {
  finish();
  current = null;
  if (queue) {
    queue.index += 1;
    setTimeout(step, 260);
  }
});
el.addEventListener("error", () => {
  finish();
  current = null;
  if (queue) { queue.index += 1; step(); }
});
