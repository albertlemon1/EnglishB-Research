// Content loading with an in-memory cache. All paths are relative to index.html.
// course.json is the single source of truth: a module is published when its entry
// says "status": "available", and its files live in content/<sublevel>/<module>/
// and audio/<sublevel>/<module>/. A module marked "draft" has its texts but no audio
// yet: it stays hidden unless the app is opened with ?borrador (to review it).
import { audio } from "./audio.js";

export const PREVIEW = new URLSearchParams(location.search).has("borrador");

const cache = new Map();

async function getJSON(path) {
  if (!cache.has(path)) {
    cache.set(path, fetch(path, { cache: "no-cache" }).then((r) => {
      if (!r.ok) throw new Error(`${path}: ${r.status}`);
      return r.json();
    }).catch((err) => { cache.delete(path); throw err; }));
  }
  return cache.get(path);
}

let registry = null; // { m01: { id, n, sublevel, code, dir, audio, firstLesson, meta } }

async function modules() {
  if (registry) return registry;
  const course = await getJSON("content/course.json");
  const out = {};
  let lesson = 0;
  for (const s of course.sublevels) {
    for (const m of s.modules) {
      const firstLesson = lesson + 1;
      lesson += m.lessons.length;
      if (m.status !== "available" && !(PREVIEW && m.status === "draft")) continue;
      out[m.id] = {
        id: m.id,
        n: m.n,
        sublevel: s.id,
        code: s.code,
        dir: `content/${s.id}/${m.id}/`,
        audio: `audio/${s.id}/${m.id}/`,
        firstLesson,
        draft: m.status === "draft",
        meta: m,
      };
    }
  }
  registry = out;
  return registry;
}

async function info(mod) {
  const all = await modules();
  if (!all[mod]) throw Object.assign(new Error(`Module ${mod} is not available`), { notFound: true });
  return all[mod];
}

export const data = {
  course: () => getJSON("content/course.json"),
  cast: () => getJSON("content/cast.json").then((c) => c.speakers),
  modules,
  info,
  async module(id) { return getJSON(`${(await info(id)).dir}module.json`); },
  async lesson(mod, id) {
    const m = await data.module(mod);
    if (!m.lessons.includes(id)) throw Object.assign(new Error(`${id} is not in ${mod}`), { notFound: true });
    return getJSON(`${(await info(mod)).dir}${id}.json`);
  },
  async review(mod) { return getJSON(`${(await info(mod)).dir}review.json`); },
  async allLessons(mod) {
    const m = await data.module(mod);
    return Promise.all(m.lessons.map((l) => data.lesson(mod, l)));
  },
  // Loads a module's audio manifest once and registers its clips with the player.
  async audio(mod) {
    const i = await info(mod);
    if (audio.isRegistered(mod)) return audio.clips(mod);
    // Drafts have no audio yet: skip the manifest instead of requesting a missing file.
    const clips = i.draft ? {} : await getJSON(`${i.audio}manifest.json`).then((m) => m.clips).catch(() => ({}));
    audio.register(mod, i.audio, clips);
    return clips;
  },
  // Every file a module needs offline (used by the "download for offline" button).
  async moduleFiles(mod) {
    const i = await info(mod);
    const m = await data.module(mod);
    return [
      `${i.dir}module.json`,
      ...m.lessons.map((l) => `${i.dir}${l}.json`),
      `${i.dir}review.json`,
      ...(i.draft ? [] : [`${i.audio}manifest.json`]),
    ];
  },
};
