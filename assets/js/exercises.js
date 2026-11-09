// Interactive items with immediate feedback (B1 scaffolding: options + explanations).
// Types: choice, gap, order, fix, stress, dictation. Results persist per set (first attempt).
import { esc, fmt, playBtn, shuffle, icon } from "./ui.js";
import { store } from "./store.js";

const CONTRACTIONS = {
  "i'm": "i am", "you're": "you are", "we're": "we are", "they're": "they are", "it's": "it is",
  "that's": "that is", "there's": "there is", "he's": "he is", "she's": "she is", "what's": "what is",
  "everything's": "everything is", "i've": "i have", "we've": "we have", "you've": "you have",
  "they've": "they have", "i'll": "i will", "we'll": "we will", "you'll": "you will", "it'll": "it will",
  "they'll": "they will", "don't": "do not", "doesn't": "does not", "didn't": "did not", "can't": "cannot",
  "won't": "will not", "isn't": "is not", "aren't": "are not", "haven't": "have not", "hasn't": "has not",
  "wasn't": "was not", "weren't": "were not", "let's": "let us", "i'd": "i would", "we'd": "we would",
  // Same contractions typed without the apostrophe (common on phones), when unambiguous.
  dont: "do not", doesnt: "does not", didnt: "did not", cant: "cannot", isnt: "is not", arent: "are not",
  havent: "have not", hasnt: "has not", wasnt: "was not", werent: "were not", im: "i am", ive: "i have",
  youre: "you are", theyre: "they are", thats: "that is", whats: "what is", weve: "we have",
  theyve: "they have", youve: "you have", youll: "you will", itll: "it will", theyll: "they will",
};

export function words(s = "") {
  return s.toLowerCase().replace(/[’‘`]/g, "'").replace(/-/g, " ")
    .replace(/[^a-z0-9' ]+/g, " ").split(/\s+/).filter(Boolean)
    .flatMap((w) => (CONTRACTIONS[w] || w).split(" "))
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean);
}
export const norm = (s) => words(s).join(" ").replace(/\bcan not\b/g, "cannot");

const KIND = {
  semantic: "Significado",
  syntactic: "Forma",
  pragmatic: "Uso",
  comprehension: "Comprensión",
  choice: "Elige",
  gap: "Completa",
  order: "Ordena",
  fix: "Corrige",
  stress: "Acento",
  dictation: "Dictado",
  intonation: "Entonación",
};

const TONES = {
  rise: { sym: "↗", label: "Sube: pregunta de verdad (no está seguro)" },
  fall: { sym: "↘", label: "Baja: busca confirmación o acuerdo" },
};

const LETTERS = ["A", "B", "C", "D"];

function sentenceWithBlank(text, inner = '<span class="blank">_____</span>') {
  return fmt(text).replace(/_{3,}/g, inner);
}

function feedback(ok, explain, extra = "") {
  return `<div class="feedback ${ok ? "ok" : "bad"}" role="status"><span class="mk">${ok ? "Bien" : "Revisa"}</span><div>${extra}${fmt(explain || "")}</div></div>`;
}

function head(item, i, kindKey, numbered) {
  const label = KIND[kindKey] || KIND[item.type] || "";
  return `<div class="q-kind">${numbered ? `<span class="chip">${i + 1}</span>` : ""}<span class="eyebrow">${esc(label)}</span>${item.lesson ? `<span class="chip">Lección ${esc(item.lesson.slice(1))}</span>` : ""}</div>`;
}

export function renderItem(item, i, setKey, { numbered = true, kind } = {}) {
  const saved = store.result(setKey, i);
  const type = item.type || "choice";
  const kindKey = kind || item.kind || type;
  const base = `class="q" data-set="${esc(setKey)}" data-idx="${i}" data-type="${type}"${kind ? ` data-kind="${esc(kind)}"` : ""} data-numbered="${numbered ? 1 : 0}"`;
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
    const input = `<input class="gap-input ${cls}" type="text" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Respuesta" value="${val}" ${saved ? "disabled" : ""} id="gap-${esc(setKey)}-${i}">`;
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p><p class="q-sentence">${sentenceWithBlank(item.text, input)}</p>${saved ? "" : `<div class="row"><button type="button" class="btn small" data-check>Comprobar</button></div>`}<div class="fb">${saved ? feedback(saved.ok, item.explain, saved.ok ? "" : `Respuesta: <em class="en">${esc(item.accept[0])}</em>. `) : ""}</div></div>`;
  }

  if (type === "order") {
    const pool = shuffle(item.words, item.words.length * 31 + i);
    const done = saved ? `<p class="q-sentence">${esc(saved.v)}</p>` : "";
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p>${saved ? done : `<div class="order-target" data-target data-empty="Toca las palabras en orden"></div><div class="order-pool">${pool.map((w, k) => `<button type="button" class="word" data-word="${k}">${esc(w)}</button>`).join("")}</div><div class="row"><button type="button" class="btn small" data-check>Comprobar</button><button type="button" class="btn small ghost" data-reset-order>Reiniciar</button></div>`}<div class="fb">${saved ? feedback(saved.ok, item.explain, saved.ok ? "" : `Orden correcto: <em class="en">${esc(item.answer)}.</em> `) : ""}</div></div>`;
  }

  if (type === "fix") {
    const val = saved ? esc(saved.v) : "";
    const cls = saved ? (saved.ok ? "is-right" : "is-wrong") : "";
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p><p class="wrong-line">${esc(item.wrong)}</p><input class="text-input ${cls}" type="text" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Escribe la frase corregida" aria-label="Frase corregida" value="${val}" ${saved ? "disabled" : ""} id="fix-${esc(setKey)}-${i}">${saved ? "" : `<div class="row"><button type="button" class="btn small" data-check>Comprobar</button><button type="button" class="btn small ghost" data-copy-wrong>Copiar la frase</button></div>`}<div class="fb">${saved ? feedback(saved.ok, item.explain, saved.ok ? "" : `Corrección: <em class="en">${esc(item.accept[0])}</em> `) : ""}</div></div>`;
  }

  if (type === "stress") {
    const syl = item.syllables.map((s, k) => {
      let cls = "";
      if (saved) { if (k === item.answer) cls = "is-right"; else if (k === saved.v) cls = "is-wrong"; }
      return `<button type="button" class="syl ${cls}" data-syl="${k}" ${saved ? "disabled" : ""}>${esc(s)}</button>`;
    }).join("");
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p><div class="row">${playBtn(item.audioRef, { size: "sm", label: `Escuchar ${item.word}` })}<div class="syllables">${syl}</div></div><div class="fb">${saved ? feedback(saved.ok, item.explain) : ""}</div></div>`;
  }

  if (type === "intonation") {
    const opts = ["rise", "fall"].map((tone) => {
      let cls = "";
      if (saved) { if (tone === item.answer) cls = "is-right"; else if (tone === saved.v) cls = "is-wrong"; }
      return `<button type="button" class="opt ${cls}" data-tone="${tone}" ${saved ? "disabled" : ""}><span class="k">${TONES[tone].sym}</span><span>${TONES[tone].label}</span></button>`;
    }).join("");
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p><div class="row">${playBtn(item.audio, { label: "Escuchar la frase" })}<p class="q-sentence" style="flex:1;min-width:0">${fmt(item.text)}</p></div><div class="opts">${opts}</div><div class="fb">${saved ? feedback(saved.ok, item.explain) : ""}</div></div>`;
  }

  if (type === "dictation") {
    const val = saved ? esc(saved.v) : "";
    const cls = saved ? (saved.ok ? "is-right" : "is-wrong") : "";
    return `<div ${base}>${head(item, i, kindKey, numbered)}<p class="q-text">${fmt(prompt)}</p><div class="row">${playBtn(item.audio, { label: "Escuchar el dictado" })}<span class="small muted">Puedes escucharlo las veces que necesites.</span></div><input class="text-input ${cls}" type="text" autocomplete="off" autocapitalize="sentences" spellcheck="false" placeholder="Escribe aquí lo que oyes" aria-label="Dictado" value="${val}" ${saved ? "disabled" : ""} id="dict-${esc(setKey)}-${i}">${saved ? "" : `<div class="row"><button type="button" class="btn small" data-check>Comprobar</button></div>`}<div class="fb">${saved ? dictationFeedback(item, saved) : ""}</div></div>`;
  }
  return "";
}

function dictationFeedback(item, saved) {
  return `<div class="feedback ${saved.ok ? "ok" : "bad"}"><span class="mk">${saved.ok ? "Bien" : "Revisa"}</span><div><p class="diff">${diffHTML(item.text, saved.v)}</p><p>${saved.ok ? "" : `Texto: <em class="en">${esc(item.text)}</em><br>`}${fmt(item.explain || "")}</p></div></div>`;
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
    default: return false;
  }
}

// Wire every item inside `root` that belongs to `setKey`. `onChange` runs after each answer.
export function mountItems(root, items, setKey, onChange = () => {}) {
  const answer = (box, value) => {
    const i = Number(box.dataset.idx);
    const item = items[i];
    const ok = grade(item, value);
    store.setResult(setKey, i, { ok, v: value });
    const fresh = document.createElement("div");
    fresh.innerHTML = renderItem(item, i, setKey, { numbered: box.dataset.numbered === "1", kind: box.dataset.kind });
    const node = fresh.firstElementChild;
    box.replaceWith(node);
    node.querySelector(".fb")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    onChange(i, ok);
  };

  root.addEventListener("click", (ev) => {
    const box = ev.target.closest(`.q[data-set="${CSS.escape(setKey)}"]`);
    if (!box) return;
    const item = items[Number(box.dataset.idx)];
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
    if (ev.target.closest("[data-check]")) {
      if (item.type === "order") {
        const built = [...box.querySelectorAll("[data-target] .word")].map((w) => w.textContent).join(" ");
        if (!built) return;
        return answer(box, built);
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
    answer(input.closest(".q"), input.value.trim());
  });
}

export function resultCard(setKey, total, { onRetryLabel = "Repetir" } = {}) {
  const { answered, correct } = store.score(setKey);
  if (answered < total) {
    return `<div class="scorebar tnum"><div class="progress-line" style="--w:${Math.round((answered / total) * 100)}%"><i></i></div><span>${answered} de ${total} respondidas</span></div>`;
  }
  const pct = Math.round((correct / total) * 100);
  const msg = pct >= 85 ? "Excelente. Dominas los rasgos de esta lección." : pct >= 60 ? "Buen trabajo. Repasa las explicaciones de los fallos." : "Vuelve al bloque de consolidación y repite la práctica.";
  return `<div class="result"><span class="eyebrow">Resultado</span><span class="big">${correct}/${total}</span><p class="muted">${msg}</p><button type="button" class="btn small ghost" data-retry="${esc(setKey)}">${icon.replay}${onRetryLabel}</button></div>`;
}
