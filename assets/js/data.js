// Content loading with an in-memory cache. All paths are relative to index.html.
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

// Modules with published content. The rest of the course exists as structure only.
export const AVAILABLE = { m01: { sublevel: "b1-1", dir: "content/b1-1/m01/", audio: "audio/b1-1/m01/" } };

export const data = {
  course: () => getJSON("content/course.json"),
  cast: () => getJSON("content/cast.json").then((c) => c.speakers),
  module: (id) => getJSON(`${AVAILABLE[id].dir}module.json`),
  lesson: (mod, id) => getJSON(`${AVAILABLE[mod].dir}${id}.json`),
  review: (mod) => getJSON(`${AVAILABLE[mod].dir}review.json`),
  manifest: (mod) => getJSON(`${AVAILABLE[mod].audio}manifest.json`).then((m) => m.clips).catch(() => ({})),
  async allLessons(mod) {
    const m = await data.module(mod);
    return Promise.all(m.lessons.map((l) => data.lesson(mod, l)));
  },
};

export function lessonNumber(sublevelIndex, moduleN, lessonIdx) {
  return (moduleN - 1) * 5 + lessonIdx + 1;
}
