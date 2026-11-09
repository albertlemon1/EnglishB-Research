// Per-learner progress and settings, kept in this browser only.
// Every storage access is guarded: private windows or blocked storage must not break the app.
const KEY = "bandb:v1";

const empty = () => ({ blocks: {}, results: {}, tasks: {}, checks: {}, cando: {}, last: null, settings: { speed: 1, theme: "system" } });

let state = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return empty();
    const data = JSON.parse(raw);
    return { ...empty(), ...data, settings: { ...empty().settings, ...(data.settings || {}) } };
  } catch {
    return empty();
  }
}

let saveTimer = null;
function write() {
  saveTimer = null;
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* storage unavailable */ }
}
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(write, 120);
}
// Writes are batched, so flush any pending one when the page is hidden or
// unloaded: otherwise completing a lesson and immediately reloading or closing
// the tab could lose that last change.
function flush() { if (saveTimer !== null) { clearTimeout(saveTimer); write(); } }
addEventListener("pagehide", flush);
addEventListener("beforeunload", flush);
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "hidden") flush(); });

export const store = {
  get settings() { return state.settings; },
  setSetting(key, value) { state.settings[key] = value; save(); },

  isBlockDone(lessonKey, block) { return Boolean(state.blocks[lessonKey]?.[block]); },
  markBlock(lessonKey, block, done = true) {
    state.blocks[lessonKey] = { ...(state.blocks[lessonKey] || {}), [block]: done };
    save();
  },
  blocksDone(lessonKey) { return Object.values(state.blocks[lessonKey] || {}).filter(Boolean).length; },

  result(setKey, index) { return state.results[setKey]?.[index]; },
  setResult(setKey, index, value) {
    const set = state.results[setKey] || {};
    if (set[index] === undefined) set[index] = value; // first attempt counts
    state.results[setKey] = set;
    save();
  },
  resetResults(setKey) { delete state.results[setKey]; save(); },
  score(setKey) {
    const set = state.results[setKey] || {};
    const values = Object.values(set);
    return { answered: values.length, correct: values.filter((v) => v && v.ok).length };
  },

  task(lessonKey) { return state.tasks[lessonKey] || {}; },
  setTask(lessonKey, patch) { state.tasks[lessonKey] = { ...(state.tasks[lessonKey] || {}), ...patch }; save(); },

  checked(key, i) { return Boolean(state.checks[key]?.[i]); },
  setChecked(key, i, value) { state.checks[key] = { ...(state.checks[key] || {}), [i]: value }; save(); },

  setLast(route) { state.last = route; save(); },
  get last() { return state.last; },

  reset() { state = empty(); save(); },
};
