// Interactive items with immediate feedback. Results persist per set (first attempt).
// B1 types: choice, gap, order, fix, stress, dictation, intonation.
// B2 types (scaffolding fading): open (the learner writes the rule and rates it
// against a model) and organizer (a half-completed table or time line).
import { esc, fmt, playBtn, shuffle, icon } from "./ui.js";
import { t } from "./strings.js";
import { store } from "./store.js";

const CONTRACTIONS = {
  "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "it's": "it is",
  "that's": "that is", "there's": "there is", "he's": "he is", "she's": "she is", "what's": "what is",
  "everything's": "everything is", "i've": "i have", "we've": "we have", "you've": "you have",
  "they've": "they have", "i'll": "i will", "we'll": "we will", "you'll": "you will", "it'll": "it will",
  "they'll": "they will", "don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "cannot",
  "won't": "will not", "isn't": "is not", "aren't": "are not", "haven't": "have not", "hasn't": "has not",
  "wasn't": "was not", "weren't": "were not", "let's": "let us", "i'd": "i would", "we'd": "we would",
  "would've": "would have", "could've": "could have", "should've": "should have", "must've": "must have", "might've": "might have",
  "hadn't": "had not", "wouldn't": "would not", "couldn't": "could not", "shouldn't": "should not",
  // Same contractions typed without the apostrophe (common on phones), when unambiguous.
  dont: "do not", doesnt: "does not", didnt: "did not", cant: "cannot", isnt: "is not", arent: "are not",
  havent: "have not", hasnt: "has not", wasnt: "was not", werent: "were not", im: "i am", ive: "i have",
  youre: "you are", theyre: "they are", thats: "that is", whats: "what is", weve: "we have",
  theyve: "they have", youve: "you have", youll: "you will", itll: "it will", theyll: "they will",
  hadnt: "had not", wouldnt: "would not", couldnt: "could not", shouldnt: "should not",
};

export function words(s = "") {
  return s.toLowerCase().replace(/[’‘`]/g, "'").replace(/-/g, " ")
    .replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean)
    .flatMap((w) => (CONTRACTIONS[w] || w).split(" "))
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}
export const norm = (s) => words(s).join(" ").replace(/\bcan not\b/g, "cannot");

const TONES = { rise: "↗", fall: "↘" };
const LETTERS = ["A", "B", "C", "D"];

function sentenceWithBlank(text, inner = '<span class="blank">_____</span>') {
  return fmt(text).replace(/_{3,}/g, inner);
}

function feedback(ok, explain, extra = "") {
  return `<div class="feedback ${ok ? "ok" : "bad"}" role="status"><span class="mk">${esc(ok ? t("ex.ok") : t("ex.bad"))}</span><div>${extra}${fmt(explain || "")}</div></div>`;
}

function head(item, i, kindKey, numbered) {
  const label = t(`ex.kind.${kindKey}`);
  return `<div class="q-kind">${numbered ? `<span class="chip">${i + 1}</span>` : ""}<span class="eyebrow">${esc(label.startsWith("ex.kind.") ? "" : label)}</span>${item.lesson ? `<span class="chip">${esc(t("ex.lesson", { n: item.lesson.slice(1) }))}</span>` : ""}</div>`;
}

const checkBtn = () => `<button type="button" class="btn small" data-check>${esc(t("ex.check"))}</button>`;

export function renderItem(item, i, setKey, { numbered = true, kind } = {}) {
  const saved = store.result(setKey, i);
  const type = item.type || "choice";
  const kindKey = kind || item.kind || type;
  const base = `class="q q-${type}" data-set="${esc(setKey)}" data-idx="${i}" data-type="${type}"${kind ? ` data-kind="${esc(kind)}"` : ""} data-numbered="${numbered ? 1 : 0}"`;
  const prompt = item.q || item.prompt;

  if (type === "choice") {
    const opts = item.options.map((o, k) => {
      let cls = "";
      if (saved) {
        if (k === item.answer) cls = "is-right";
        else if (k === saved.v) cls = "is-wrong";
      }
      return `<button type="button" class="opt ${cls}" data-opt="${k}" ${saved ? "disabled" : ""}><span class="k">${LETTERS[k]}</span><span>${fmt(o)}</span></button>`;
    }).join("");
    const sentence = item.text && item.text !== "___" ? `<p class="q-sentence">${sentenceWithBlank(item.text)}</p>` : "";
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p>${sentence}<div class="opts">${opts}</div><div class="fb">${saved ? feedback(saved.ok, item.explain) : ""}</div></div>`;
  }

  if (type === "gap") {
    const val = saved ? esc(saved.v) : "";
    const cls = saved ? (saved.ok ? "is-right" : "is-wrong") : "";
    const input = `<input class="gap-input ${cls}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="${esc(t("ex.answer"))}" value="${val}" ${saved ? "disabled" : ""} id="gap-${esc(setKey)}-${i}">`;
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p><p class="q-sentence">${sentenceWithBlank(item.text, input)}</p>${saved ? "" : `<div class="row">${checkBtn()}</div>`}<div class="fb">${saved ? feedback(saved.ok, item.explain, saved.ok ? "" : t("ex.answerIs", { a: esc(item.accept[0]) })) : ""}</div></div>`;
  }

  if (type === "order") {
    const pool = shuffle(item.words, item.words.length * 31 + i);
    const done = saved ? `<p class="q-sentence">${esc(saved.v)}</p>` : "";
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p>${saved ? done : `<div class="order-target" data-target data-empty="${esc(t("ex.orderEmpty"))}"></div><div class="order-pool">${pool.map((w, k) => `<button type="button" class="word" data-word="${k}">${esc(w)}</button>`).join("")}</div><div class="row">${checkBtn()}<button type="button" class="btn small ghost" data-reset-order>${esc(t("ex.reset"))}</button></div>`}<div class="fb">${saved ? feedback(saved.ok, item.explain, saved.ok ? "" : t("ex.orderIs", { a: esc(item.answer) })) : ""}</div></div>`;
  }

  if (type === "fix") {
    const val = saved ? esc(saved.v) : "";
    const cls = saved ? (saved.ok ? "is-right" : "is-wrong") : "";
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p><p class="wrong-line">${esc(item.wrong)}</p><input class="text-input ${cls}" type="text" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="${esc(t("ex.fixPlaceholder"))}" aria-label="${esc(t("ex.fixLabel"))}" value="${val}" ${saved ? "disabled" : ""} id="fix-${esc(setKey)}-${i}">${saved ? "" : `<div class="row">${checkBtn()}<button type="button" class="btn small ghost" data-copy-wrong>${esc(t("ex.copy"))}</button></div>`}<div class="fb">${saved ? feedback(saved.ok, item.explain, saved.ok ? "" : t("ex.fixIs", { a: esc(item.accept[0]) })) : ""}</div></div>`;
  }

  if (type === "stress") {
    const syl = item.syllables.map((s, k) => {
      let cls = "";
      if (saved) { if (k === item.answer) cls = "is-right"; else if (k === saved.v) cls = "is-wrong"; }
      return `<button type="button" class="syl ${cls}" data-syl="${k}" ${saved ? "disabled" : ""}>${esc(s)}</button>`;
    }).join("");
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p><div class="row">${playBtn(item.audioRef, { size: "sm", label: t("ex.listenWord", { w: item.word }) })}<div class="syllables">${syl}</div></div><div class="fb">${saved ? feedback(saved.ok, item.explain) : ""}</div></div>`;
  }

  if (type === "intonation") {
    const opts = ["rise", "fall"].map((tone) => {
      let cls = "";
      if (saved) { if (tone === item.answer) cls = "is-right"; else if (tone === saved.v) cls = "is-wrong"; }
      return `<button type="button" class="opt ${cls}" data-tone="${tone}" ${saved ? "disabled" : ""}><span class="k">${TONES[tone]}</span><span>${esc(t(`ex.${tone}`))}</span></button>`;
    }).join("");
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p><div class="row">${playBtn(item.audio, { label: t("ex.listenSentence") })}<p class="q-sentence" style="flex:1;min-width:0">${fmt(item.text)}</p></div><div class="opts">${opts}</div><div class="fb">${saved ? feedback(saved.ok, item.explain) : ""}</div></div>`;
  }

  if (type === "dictation") {
    const val = saved ? esc(saved.v) : "";
    const cls = saved ? (saved.ok ? "is-right" : "is-wrong") : "";
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p><div class="row">${playBtn(item.audio, { label: t("ex.listenDict") })}<span class="small muted">${esc(t("ex.dictHint"))}</span></div><input class="text-input ${cls}" type="text" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="${esc(t("ex.dictPlaceholder"))}" aria-label="${esc(t("ex.dictLabel"))}" value="${val}" ${saved ? "disabled" : ""} id="dict-${esc(setKey)}-${i}">${saved ? "" : `<div class="row">${checkBtn()}</div>`}<div class="fb">${saved ? dictationFeedback(item, saved) : ""}</div></div>`;
  }

  if (type === "open") return renderOpen(item, i, setKey, base, kindKey, numbered, saved);
  if (type === "organizer") return renderOrganizer(item, i, setKey, base, kindKey, numbered, saved);
  return "";
}

// ---------------------------------------------------------------- open answer (B2 discovery)
// Phases: write → compare (model shown, criteria rated) → saved. The automatic
// part is only a hint (which signal words appear); the verdict is the learner's.
const OPEN_LEVELS = ["yes", "partly", "no"];

function signalsHTML(item, text) {
  if (!item.signals?.length) return "";
  const chips = item.signals.map((s) => {
    const re = new RegExp(s.re || s, "i");
    const label = s.label || String(s.re || s).split("|")[0].replace(/\\b/g, "");
    return `<span class="uc ${re.test(text) ? "on" : ""}">${esc(label)}</span>`;
  }).join("");
  return `<div class="signals"><span class="eyebrow">${esc(t("open.signals"))}</span><div class="used-chunks">${chips}</div></div>`;
}

function renderOpen(item, i, setKey, base, kindKey, numbered, saved) {
  const prompt = item.q || item.prompt;
  const draft = saved ? saved.v : (store.task(`${setKey}-${i}`).text || "");
  const comparing = !saved && Boolean(store.task(`${setKey}-${i}`).compare);
  const ratings = saved ? saved.crit : (store.task(`${setKey}-${i}`).crit || {});
  const criteria = item.criteria.map((c, k) => {
    const r = ratings[k] || "";
    const seg = OPEN_LEVELS.map((lv) => `<button type="button" class="${r === lv ? `is-${lv}` : ""}" data-crit="${k}" data-level="${lv}" ${saved ? "disabled" : ""}>${esc(t(`open.${lv}`))}</button>`).join("");
    return `<div class="crit"><p>${fmt(c)}</p><div class="seg" role="group">${seg}</div></div>`;
  }).join("");
  const compareBlock = (comparing || saved) ? `
      <div class="open-compare">
        ${signalsHTML(item, draft)}
        <div class="model-rule"><span class="eyebrow">${esc(t("open.model"))}</span><p>${fmt(item.model)}</p></div>
        <div class="criteria"><span class="eyebrow">${esc(t("open.criteria"))}</span>${criteria}</div>
        ${saved ? "" : `<div class="row"><button type="button" class="btn small" data-open-save>${esc(t("open.done"))}</button></div>`}
      </div>` : "";
  const fb = saved ? `<div class="feedback ${saved.ok ? "ok" : "info"}" role="status"><span class="mk">${saved.ok ? "✓" : "→"}</span><div>${esc(saved.ok ? t("open.allMet") : t("open.someMet"))}</div></div>` : "";
  return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p>
    <textarea class="writer short open-writer" data-open-text rows="3" spellcheck="false" placeholder="${esc(t("open.placeholder"))}" ${saved || comparing ? "readonly" : ""} aria-label="${esc(t("open.yours"))}">${esc(draft)}</textarea>
    ${saved || comparing ? "" : `<div class="row"><button type="button" class="btn small" data-open-compare>${esc(t("open.compare"))}</button></div><div class="fb-soft" data-open-note></div>`}
    ${compareBlock}<div class="fb">${fb}</div></div>`;
}

// ---------------------------------------------------------------- organizer (table / time line)
function cellHTML(cell, k, saved) {
  if (typeof cell === "string") return `<span class="cell-text">${fmt(cell)}</span>`;
  const v = saved?.v?.[k] ?? "";
  const ok = saved ? norm(v) && cell.accept.some((a) => norm(a) === norm(v)) : null;
  const cls = saved ? (ok ? "is-right" : "is-wrong") : "";
  const input = `<input class="gap-input org-gap ${cls}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" data-gap="${k}" value="${esc(v)}" ${saved ? "disabled" : ""} placeholder="${esc(cell.hint || "…")}" aria-label="${esc(t("ex.answer"))}">`;
  return saved && !ok ? `${input}<span class="org-answer en">${esc(cell.accept[0])}</span>` : input;
}

function organizerCells(item) {
  if (item.kind === "timeline") return item.points.map((p) => (p.gap ? { gap: p.gap, accept: p.accept, hint: p.hint, when: p.when } : { text: p.text, when: p.when }));
  return item.rows.flat();
}

function renderOrganizer(item, i, setKey, base, kindKey, numbered, saved) {
  const prompt = item.q || item.prompt;
  let body;
  if (item.kind === "timeline") {
    let k = 0;
    body = `<ol class="timeline">${item.points.map((p) => {
      const idx = k++;
      const cell = p.gap ? { gap: p.gap, accept: p.accept, hint: p.hint } : p.text;
      return `<li class="${p.gap ? "has-gap" : ""}"><span class="when">${esc(p.when)}</span><div class="what">${cellHTML(cell, idx, saved)}</div></li>`;
    }).join("")}</ol>`;
  } else {
    let k = 0;
    const rows = item.rows.map((r) => `<tr>${r.map((c, ci) => `<td data-col="${esc(item.columns[ci])}">${cellHTML(c, k++, saved)}</td>`).join("")}</tr>`).join("");
    body = `<div class="org-table-wrap"><table class="org-table"><thead><tr>${item.columns.map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }
  const total = organizerCells(item).filter((c) => c.gap).length;
  const wrong = saved ? organizerCells(item).filter((c, k) => c.gap && !(norm(saved.v[k] || "") && c.accept.some((a) => norm(a) === norm(saved.v[k] || "")))).length : 0;
  const fb = saved ? feedback(saved.ok, item.explain, saved.ok ? `${esc(t("org.allRight"))} ` : `${esc(t("org.someWrong", { n: wrong, total }))} `) : "";
  return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p>${body}${saved ? "" : `<div class="row">${checkBtn()}</div>`}<div class="fb">${fb}</div></div>`;
}

function dictationFeedback(item, saved) {
  return `<div class="feedback ${saved.ok ? "ok" : "bad"}"><span class="mk">${esc(saved.ok ? t("ex.ok") : t("ex.bad"))}</span><div><p class="diff">${diffHTML(item.text, saved.v)}</p><p>${saved.ok ? "" : t("ex.textIs", { a: esc(item.text) })}${fmt(item.explain || "")}</p></div></div>`;
}

// Word-level comparison (LCS) between the script and what the learner typed.
export function diffHTML(expected, typed) {
  const exp = expected.split(/\s+/).filter(Boolean);
  const expN = exp.map((w) => norm(w));
  const got = words(typed);
  const expFlat = [];
  exp.forEach((w, k) => expN[k].split(" ").filter(Boolean).forEach((n, j, arr) => expFlat.push({ n, display: j === arr.length - 1 ? w : "", k })));
  const a = expFlat.map((x) => x.n);
  const b = got;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let x = a.length - 1; x >= 0; x--) for (let y = b.length - 1; y >= 0; y--) dp[x][y] = a[x] === b[y] ? dp[x + 1][y + 1] + 1 : Math.max(dp[x + 1][y], dp[x][y + 1]);
  const okSet = new Set();
  let x = 0, y = 0;
  while (x < a.length && y < b.length) {
    if (a[x] === b[y]) { okSet.add(x); x++; y++; } else if (dp[x + 1][y] >= dp[x][y + 1]) x++; else y++;
  }
  const byWord = new Map();
  expFlat.forEach((t, idx) => {
    const prev = byWord.get(t.k);
    const ok = okSet.has(idx);
    byWord.set(t.k, prev === undefined ? ok : prev && ok);
  });
  return exp.map((w, k) => `<span class="${byWord.get(k) ? "ok" : "miss"}">${esc(w)}</span>`).join(" ");
}

function grade(item, value) {
  switch (item.type || "choice") {
    case "choice": case "stress": return value === item.answer;
    case "gap": case "fix": return item.accept.some((a) => norm(a) === norm(value));
    case "order": return norm(value) === norm(item.answer);
    case "dictation": return norm(value) === norm(item.text);
    case "intonation": return value === item.answer;
    case "organizer": return organizerCells(item).every((c, k) => !c.gap || (norm(value[k] || "") && c.accept.some((a) => norm(a) === norm(value[k] || ""))));
    default: return false;
  }
}

// Wire every item inside `root` that belongs to `setKey`. `onChange` runs after each answer.
export function mountItems(root, items, setKey, onChange = () => {}) {
  const rerender = (box, item, i) => {
    const fresh = document.createElement("div");
    fresh.innerHTML = renderItem(item, i, setKey, { numbered: box.dataset.numbered === "1", kind: box.dataset.kind });
    const node = fresh.firstElementChild;
    box.replaceWith(node);
    return node;
  };
  const answer = (box, value, extra = {}) => {
    const i = Number(box.dataset.idx);
    const item = items[i];
    const ok = extra.ok ?? grade(item, value);
    store.setResult(setKey, i, { ok, v: value, ...extra });
    const node = rerender(box, item, i);
    node.querySelector(".fb")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    onChange(i, ok);
  };

  root.addEventListener("click", (ev) => {
    const box = ev.target.closest(`.q[data-set="${CSS.escape(setKey)}"]`);
    if (!box) return;
    const i = Number(box.dataset.idx);
    const item = items[i];
    const opt = ev.target.closest("[data-opt]");
    if (opt && !opt.disabled) return answer(box, Number(opt.dataset.opt));
    const tone = ev.target.closest("[data-tone]");
    if (tone && !tone.disabled) return answer(box, tone.dataset.tone);
    const syl = ev.target.closest("[data-syl]");
    if (syl && !syl.disabled) return answer(box, Number(syl.dataset.syl));
    const word = ev.target.closest("[data-word]");
    if (word) {
      const target = box.querySelector("[data-target]");
      if (word.parentElement === target) {
        box.querySelector(`.order-pool [data-word="${word.dataset.word}"]`)?.classList.remove("used");
        word.remove();
      } else if (!word.classList.contains("used")) {
        word.classList.add("used");
        const chip = word.cloneNode(true);
        chip.classList.remove("used");
        target.append(chip);
      }
      return;
    }
    if (ev.target.closest("[data-reset-order]")) {
      box.querySelector("[data-target]").innerHTML = "";
      box.querySelectorAll(".order-pool .word").forEach((w) => w.classList.remove("used"));
      return;
    }
    if (ev.target.closest("[data-copy-wrong]")) {
      const input = box.querySelector(".text-input");
      input.value = item.wrong;
      input.focus();
      return;
    }
    // open answer: compare, rate, save
    if (ev.target.closest("[data-open-compare]")) {
      const ta = box.querySelector("[data-open-text]");
      const text = ta.value.trim();
      const min = item.minWords || 6;
      if (words(text).length < min) {
        box.querySelector("[data-open-note]").innerHTML = `<div class="feedback info"><span class="mk">i</span><div>${esc(t("open.tooShort", { n: min }))}</div></div>`;
        ta.focus();
        return;
      }
      store.setTask(`${setKey}-${i}`, { text, compare: true });
      rerender(box, item, i).querySelector(".open-compare")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return;
    }
    const crit = ev.target.closest("[data-crit]");
    if (crit && !crit.disabled) {
      const k = Number(crit.dataset.crit);
      const sub = `${setKey}-${i}`;
      store.setTask(sub, { crit: { ...(store.task(sub).crit || {}), [k]: crit.dataset.level } });
      crit.parentElement.querySelectorAll("button").forEach((b) => { b.className = b === crit ? `is-${crit.dataset.level}` : ""; });
      return;
    }
    if (ev.target.closest("[data-open-save]")) {
      const sub = `${setKey}-${i}`;
      const st = store.task(sub);
      const crit = st.crit || {};
      if (item.criteria.some((_, k) => !crit[k])) {
        box.querySelector(".criteria")?.classList.add("shake");
        setTimeout(() => box.querySelector(".criteria")?.classList.remove("shake"), 500);
        return;
      }
      const ok = item.criteria.every((_, k) => crit[k] === "yes");
      return answer(box, st.text || "", { ok, crit });
    }
    if (ev.target.closest("[data-check]")) {
      if (item.type === "order") {
        const built = [...box.querySelectorAll("[data-target] .word")].map((w) => w.textContent).join(" ");
        if (!built) return;
        return answer(box, built);
      }
      if (item.type === "organizer") {
        const inputs = [...box.querySelectorAll("[data-gap]")];
        if (inputs.every((inp) => !inp.value.trim())) { inputs[0]?.focus(); return; }
        const value = {};
        inputs.forEach((inp) => { value[inp.dataset.gap] = inp.value.trim(); });
        return answer(box, value);
      }
      const input = box.querySelector("input");
      if (!input.value.trim()) { input.focus(); return; }
      return answer(box, input.value.trim());
    }
  });
  root.addEventListener("keydown", (ev) => {
    if (ev.key !== "Enter") return;
    const input = ev.target.closest(`.q[data-set="${CSS.escape(setKey)}"] input`);
    if (!input || !input.value.trim()) return;
    ev.preventDefault();
    const box = input.closest(".q");
    if (box.dataset.type === "organizer") { box.querySelector("[data-check]")?.click(); return; }
    answer(box, input.value.trim());
  });
  // Keep an open-answer draft while the learner writes it (before comparing).
  root.addEventListener("input", (ev) => {
    const ta = ev.target.closest(`.q[data-set="${CSS.escape(setKey)}"] [data-open-text]`);
    if (!ta || ta.readOnly) return;
    const box = ta.closest(".q");
    store.setTask(`${setKey}-${box.dataset.idx}`, { text: ta.value });
  });
}

export function resultCard(setKey, total, { onRetryLabel } = {}) {
  const { answered, correct } = store.score(setKey);
  if (answered < total) {
    return `<div class="scorebar tnum"><div class="progress-line" style="--w:${Math.round((answered / total) * 100)}%"><i></i></div><span>${esc(t("ex.answered", { n: answered, total }))}</span></div>`;
  }
  const pct = Math.round((correct / total) * 100);
  const msg = pct >= 85 ? t("ex.msgHigh") : pct >= 60 ? t("ex.msgMid") : t("ex.msgLow");
  return `<div class="result"><span class="eyebrow">${esc(t("ex.result"))}</span><span class="big">${correct}/${total}</span><p class="muted">${esc(msg)}</p><button type="button" class="btn small ghost" data-retry="${esc(setKey)}">${icon.replay}${esc(onRetryLabel || t("ex.retry"))}</button></div>`;
}
