// The six blocks of the atomic lesson matrix.
// Every shell string goes through t() (strings.js): Spanish in B1, English in B2.
// The phonetics block and the self-check keep Spanish in every sublevel by design.
import { esc, fmt, icon, playBtn, avatar, regChip, regMeter, REG, ALERTS, fmtTime, waveBars, toast } from "./ui.js";
import { t } from "./strings.js";
import { audio } from "./audio.js";
import { store } from "./store.js";
import { renderItem, mountItems, resultCard } from "./exercises.js";
import { runChecks, wordCount } from "./checks.js";
import { recControls, mountRecorders } from "./recorder.js";

const block = (id) => ({ id, get name() { return t(`block.${id}.name`); }, get short() { return t(`block.${id}.short`); }, get title() { return t(`block.${id}.title`); } });
export const BLOCKS = ["lexical", "discovery", "phonetics", "consolidation", "practice", "task"].map(block);

// ---------------------------------------------------------------- glossing
// A chunk's gloss is its translation (B1, `es`) or its English definition (B2, `def`).
function glosser(lesson) {
  const bank = (lesson.lexical?.chunks || []).map((c) => {
    const key = c.en.toLowerCase().replace(/\(.*?\)/g, " ").replace(/\+.*$/, " ").replace(/^be\s+/, "")
      .replace(/\b(someone|something|somebody|a|an|the)\b/g, " ").replace(/[^a-z' ]/g, " ").trim().split(/\s+/).filter(Boolean);
    return { tokens: key, en: c.en, es: c.def || c.es || "" };
  }).filter((c) => c.tokens.length);
  const ALIAS = { ran: "run", made: "make", came: "come", got: "get", kept: "keep", flew: "fly", "everything's": "everything", fell: "fall", fallen: "fall" };
  const match = (t, m) => (t.length <= 2 ? t === m : t.length === 3 ? m.startsWith(t) : t.slice(0, 4) === m.slice(0, 4));
  return (markText) => {
    const toks = markText.toLowerCase().replace(/[^a-z' ]/g, " ").split(/\s+/).filter(Boolean).map((w) => ALIAS[w] || w);
    return bank.find((c) => c.tokens.every((t) => toks.some((m) => match(t, m)))) || null;
  };
}

const who = (cast, id) => cast[id] || { name: id, role: "", register: "model", accent: "" };

function speakerLine(cast, id) {
  const s = who(cast, id);
  return `${esc(s.name)} · ${esc(s.accent)}`;
}

function blockHead(i, block, intro) {
  return `<header class="block-head"><span class="eyebrow">${esc(t("block.of", { n: i + 1, total: BLOCKS.length, name: block.name }))}</span><h2>${esc(block.title)}</h2>${intro ? `<p class="lead">${fmt(intro)}</p>` : ""}</header>`;
}

function exampleLine(ex, cast) {
  return `<div class="example">${playBtn(ex.audio, { size: "sm", label: t("lex.listenTo", { name: who(cast, ex.speaker).name }) })}<p>${fmt(ex.text)}</p></div>`;
}

// ---------------------------------------------------------------- 1 · lexical
function chunkCard(c) {
  const def = c.def
    ? `<span class="def">${fmt(c.def)}</span>${c.example ? `<span class="ex en">${fmt(c.example)}</span>` : ""}${c.syn || c.ant ? `<span class="rel">${c.syn ? `<i>${esc(t("lex.syn"))}</i> ${esc(c.syn)}` : ""}${c.syn && c.ant ? " · " : ""}${c.ant ? `<i>${esc(t("lex.ant"))}</i> ${esc(c.ant)}` : ""}</span>` : ""}`
    : `<span>${esc(c.es || "")}</span>`;
  return `<div class="chunk reg-${c.register}"><b><span class="dot"></span>${esc(c.en)}</b>${def}</div>`;
}

function lexical(ctx) {
  const { lesson, cast, lk } = ctx;
  const lx = lesson.lexical;
  const g = glosser(lesson);
  const sc = lx.scenario;
  const s = who(cast, sc.speaker);
  const dur = audio.duration(sc.audio);

  const comp = lx.comprehension.map((q, i) => renderItem(q, i, `${lk}-comp`, { kind: "comprehension" })).join("");

  const lines = lx.dialogue.lines.map((l) => {
    const p = who(cast, l.speaker);
    return `<div class="line reg-${p.register}" data-line="${esc(l.audio)}">${avatar(l.speaker, cast, "sm")}<div class="bubble"><b>${esc(p.name)}</b><p>${fmt(l.text, { gloss: g })}</p></div>${playBtn(l.audio, { size: "sm", label: t("lex.listenTo", { name: p.name }) })}</div>`;
  }).join("");
  const speakers = [...new Set(lx.dialogue.lines.map((l) => l.speaker))];

  const regs = lx.registers.map((r) => `
    <section class="reg-col reg-${r.level}">
      <header><h4><span class="dot"></span>${esc(REG[r.level].label)}</h4>${regMeter(r.level)}<p>${fmt(r.use)}</p></header>
      ${r.items.map((it) => `<div class="reg-item">${playBtn(it.audio, { size: "sm", label: t("lex.listenTo", { name: who(cast, it.speaker).name }) })}<div><p class="en">${fmt(it.text)}</p><small>${fmt(it.note || "")}</small><span class="who">${speakerLine(cast, it.speaker)}</span></div></div>`).join("")}
    </section>`).join("");

  const rq = lx.registerQuiz.map((q, i) => renderRegisterQ(q, i, `${lk}-rq`)).join("");
  const chunks = lx.chunks.map(chunkCard).join("");

  return `
    ${blockHead(0, BLOCKS[0], t("lex.intro"))}
    <article class="voice-note reg-${s.register}">
      <div class="voice-head">${avatar(sc.speaker, cast)}<div class="who"><b>${esc(sc.title)}</b><span>${esc(s.name)} → ${esc(sc.to)} · ${esc(s.accent)} · ${fmtTime(dur)}</span></div>${waveBars(sc.audio)}${playBtn(sc.audio, { size: "lg", solid: true, label: t("lex.listenMsg") })}</div>
      <p class="context">${fmt(sc.context)}</p>
      <p class="voice-text">${fmt(sc.text, { gloss: g })}</p>
    </article>

    <section class="stack">
      <div class="section-head"><h3>${esc(t("lex.comprehension"))}</h3><p>${esc(t("lex.comprehensionText"))}</p></div>
      <div class="section-head"><h4 class="en">${esc(lx.dialogue.title)}</h4><p>${fmt(lx.dialogue.context)}</p></div>
      <div class="row"><button type="button" class="btn" data-seq="${esc(lx.dialogue.lines.map((l) => l.audio).join(","))}" data-seq-label="${esc(t("lex.listenDialogue"))}" data-seq-stop="${esc(t("lex.stop"))}">${icon.headphones}<span>${esc(t("lex.listenDialogue"))}</span></button><span class="small muted">${speakers.map((sp) => `${esc(who(cast, sp).name)} (${esc(who(cast, sp).accent)})`).join(" · ")}</span></div>
      <div class="dialogue narrow">${lines}</div>
      <div class="stack narrow">${comp}</div>
    </section>

    <section class="stack">
      <div class="section-head"><h3>${esc(t("lex.registers"))}</h3><p>${esc(t("lex.registersText"))}</p></div>
      <div class="registers">${regs}</div>
    </section>

    <section class="stack">
      <div class="section-head"><h3>${esc(t("lex.whichRegister"))}</h3><p>${esc(t("lex.whichRegisterText"))}</p></div>
      <div class="stack narrow">${rq}</div>
    </section>

    <section class="stack">
      <div class="section-head"><h3>${esc(t("lex.chunks"))}</h3><p>${esc(t("lex.chunksText"))}</p></div>
      <div class="chunks">${chunks}</div>
    </section>`;
}

function renderRegisterQ(q, i, setKey) {
  const saved = store.result(setKey, i);
  const btns = ["casual", "neutral", "formal"].map((lv) => {
    let cls = "";
    if (saved) { if (lv === q.answer) cls = "is-right"; else if (lv === saved.v) cls = "is-wrong"; }
    return `<button type="button" class="${cls}" data-reg="${lv}" ${saved ? "disabled" : ""}>${esc(REG[lv].short)}</button>`;
  }).join("");
  const fb = saved ? `<div class="feedback ${saved.ok ? "ok" : "bad"}"><span class="mk">${esc(saved.ok ? t("ex.ok") : t("ex.bad"))}</span><div>${saved.ok ? "" : t("lex.itIs", { reg: esc(REG[q.answer].short.toLowerCase()) })}${fmt(q.explain)}</div></div>` : "";
  return `<div class="rq" data-rq="${i}" data-set="${esc(setKey)}"><p class="en">${fmt(q.text)}</p><div class="seg" role="group" aria-label="${esc(t("lex.registerLabel"))}">${btns}</div>${fb}</div>`;
}

function mountLexical(root, ctx) {
  const { lesson, lk } = ctx;
  mountItems(root, lesson.lexical.comprehension, `${lk}-comp`);
  root.addEventListener("click", (ev) => {
    const b = ev.target.closest("[data-reg]");
    if (!b || b.disabled) return;
    const box = b.closest("[data-rq]");
    const i = Number(box.dataset.rq);
    const q = lesson.lexical.registerQuiz[i];
    store.setResult(`${lk}-rq`, i, { ok: b.dataset.reg === q.answer, v: b.dataset.reg });
    box.outerHTML = renderRegisterQ(q, i, `${lk}-rq`);
  });
}

// ---------------------------------------------------------------- 2 · discovery
function ruleCard(ctx) {
  const { lesson, lk } = ctx;
  const d = lesson.discovery;
  const answered = store.score(`${lk}-ccq`).answered;
  if (answered < d.questions.length) {
    return `<div class="rule locked" data-rule><span class="eyebrow">${esc(t("disc.rule"))}</span><p>${icon.lock.replace("<svg", '<svg width="18" height="18" style="vertical-align:-3px;margin-right:6px"')}${esc(t("disc.locked", { n: answered, total: d.questions.length }))}</p></div>`;
  }
  return `<div class="rule" data-rule><span class="eyebrow">${esc(t("disc.rule"))}</span><ul>${d.rule.points.map((p) => `<li>${fmt(p)}</li>`).join("")}</ul><div class="formulas">${d.rule.formulas.map((f) => `<span class="formula">${esc(f)}</span>`).join("")}</div>${d.rule.note ? `<p class="note">${fmt(d.rule.note)}</p>` : ""}</div>`;
}

function discovery(ctx) {
  const { lesson, cast, lk } = ctx;
  const d = lesson.discovery;
  const open = d.questions.some((q) => q.type === "open");
  const qs = d.questions.map((q, i) => renderItem(q, i, `${lk}-ccq`, { kind: q.kind })).join("");
  // B2: a half-completed organizer (table or time line) between the text and the questions.
  const org = d.organizer ? `<section class="stack"><div class="section-head"><h3>${esc(d.organizer.title || t("disc.organizer"))}</h3></div><div class="narrow">${renderItem(d.organizer, 0, `${lk}-org`, { numbered: false })}</div></section>` : "";
  return `
    ${blockHead(1, BLOCKS[1], d.intro)}
    <article class="analysis">
      <div class="voice-head">${avatar(d.speaker, cast)}<div class="who"><b>${esc(t("disc.analysis"))}</b><span>${speakerLine(cast, d.speaker)}</span></div>${playBtn(d.audio, { size: "lg", solid: true, label: t("disc.listenText") })}</div>
      <p class="voice-text">${fmt(d.text)}</p>
    </article>
    ${org}
    <section class="stack">
      <div class="section-head"><h3>${esc(t("disc.questions"))}</h3><p>${esc(t(open ? "disc.questionsOpenText" : "disc.questionsText"))}</p></div>
      <div class="ccq-list narrow">${qs}</div>
    </section>
    ${ruleCard(ctx)}`;
}

function mountDiscovery(root, ctx) {
  const d = ctx.lesson.discovery;
  if (d.organizer) mountItems(root, [d.organizer], `${ctx.lk}-org`);
  mountItems(root, d.questions, `${ctx.lk}-ccq`, () => {
    const card = root.querySelector("[data-rule]");
    if (card) card.outerHTML = ruleCard(ctx);
  });
}

// ---------------------------------------------------------------- 3 · phonetics
export function alertHTML(a) {
  const meta = ALERTS[a.type] || { sym: "!", label: a.type };
  return `<div class="alert al-${esc(a.type)}"><span class="sym" aria-hidden="true">${esc(meta.sym)}</span><div><b>${esc(meta.label)}</b>${fmt(a.text)}</div></div>`;
}

function phonetics(ctx) {
  const { lesson, cast, lk } = ctx;
  const ph = lesson.phonetics;
  const cards = ph.items.map((it) => {
    const base = `${lesson.id}-ph-${it.id}`;
    const ex = it.example;
    return `
      <article class="ph">
        <div class="ph-top"><div><p class="ph-term">${esc(it.term)}<small>${esc(it.pos)}</small></p><p class="ph-mean">${fmt(it.meaning)}</p></div>${playBtn(`${base}-us`, { size: "lg", solid: true, label: t("ph.listen", { term: it.term }) })}</div>
        <div class="ph-rows">
          <div class="ph-row"><span class="acc">US</span><span class="ipa">${esc(it.ipa.us)}</span><span class="btns">${playBtn(`${base}-us`, { size: "sm", label: t("ph.us") })}<span class="audio-pill">${playBtn(`${base}-slow`, { label: t("ph.slow") })}${esc(t("ph.slowLabel"))}</span></span></div>
          <div class="ph-row"><span class="acc">UK</span><span class="ipa">${esc(it.ipa.uk)}</span><span class="btns">${playBtn(`${base}-uk`, { size: "sm", label: t("ph.uk") })}</span></div>
        </div>
        <div class="afh"><span class="eyebrow">${esc(t("ph.afh"))}</span><span class="resp">/${esc(it.afh)}/</span></div>
        ${it.variants ? `<div class="ph-variants"><span class="eyebrow">${esc(t("ph.variants"))}</span>${it.variants.map((v) => `<div class="ph-variant">${playBtn(v.audio, { size: "sm", label: v.label })}<div><b>${esc(v.label)}</b><p class="en">${fmt(v.text)}</p></div></div>`).join("")}</div>` : ""}
        <div class="alerts">${it.alerts.map(alertHTML).join("")}</div>
        ${ex ? `<div class="ph-ex">${playBtn(`${base}-ex`, { size: "sm", label: t("ph.example", { name: who(cast, ex.speaker).name }) })}<p>${fmt(ex.text)}</p></div>` : ""}
        ${recControls(`${lk}-${it.id}`, t("ph.record"))}
      </article>`;
  }).join("");
  return `
    ${blockHead(2, BLOCKS[2], ph.intro)}
    <details class="panel tight">
      <summary class="eyebrow" style="cursor:pointer">${esc(t("ph.howTo"))}</summary>
      <div class="stack small" style="margin-top:10px">
        <p>${t("ph.howTo1")}</p>
        <p>${t("ph.howTo2")}</p>
      </div>
    </details>
    <div class="ph-grid">${cards}</div>`;
}

// ---------------------------------------------------------------- 4 · consolidation
function consolidation(ctx) {
  const { lesson, cast, lk } = ctx;
  const c = lesson.consolidation;
  const structs = c.structures.map((s, i) => `
    <article class="struct">
      <span class="eyebrow">${esc(t("cons.structure", { n: i + 1 }))}</span>
      <h4>${fmt(s.title)}</h4>
      <p class="formula-line">${esc(s.formula)}</p>
      <p class="muted">${fmt(s.usage)}</p>
      <div class="examples">${s.examples.map((e) => exampleLine(e, cast)).join("")}</div>
    </article>`).join("");
  const l1 = c.l1.map((it, i) => {
    const on = store.checked(`${lk}-l1`, i);
    return `
    <article class="l1">
      <label><input type="checkbox" data-l1="${i}" ${on ? "checked" : ""} id="l1-${esc(lk)}-${i}"><span><h4>${esc(it.title)}</h4></span></label>
      <p>${fmt(it.text)}</p>
      <div class="pair"><div class="no"><i>✕</i><span>${esc(it.wrong)}</span></div><div class="yes"><i>✓</i><span>${esc(it.right)}</span></div></div>
    </article>`;
  }).join("");
  return `
    ${blockHead(3, BLOCKS[3], t("cons.intro"))}
    <div class="structs">${structs}</div>
    <section class="stack">
      <div class="section-head"><h3>${esc(t("cons.l1"))}</h3><p>${esc(t("cons.l1Text"))}</p></div>
      <div class="l1-grid">${l1}</div>
    </section>`;
}

function mountConsolidation(root, ctx) {
  root.addEventListener("change", (ev) => {
    const cb = ev.target.closest("[data-l1]");
    if (cb) store.setChecked(`${ctx.lk}-l1`, Number(cb.dataset.l1), cb.checked);
  });
}

// ---------------------------------------------------------------- 5 · practice
function practiceIntro(items) {
  const names = [...new Set(items.map((it) => it.type || "choice"))].map((ty) => t(`pr.type.${ty}`)).filter((n) => !n.startsWith("pr.type."));
  const list = names.length > 1 ? `${names.slice(0, -1).join(", ")} ${t("pr.and")} ${names[names.length - 1]}` : names[0] || "";
  return `${list.charAt(0).toUpperCase()}${list.slice(1)}. ${t("pr.firstTry")}`;
}

function practice(ctx) {
  const { lesson, lk } = ctx;
  const items = lesson.practice.map((it, i) => renderItem(it, i, `${lk}-pr`)).join("");
  return `
    ${blockHead(4, BLOCKS[4], practiceIntro(lesson.practice))}
    <div class="ex-head"><span class="eyebrow">${esc(t("pr.count", { n: lesson.practice.length }))}</span><div data-score>${resultCard(`${lk}-pr`, lesson.practice.length)}</div></div>
    <div class="practice narrow">${items}</div>
    <div data-final></div>`;
}

function mountPractice(root, ctx) {
  const { lesson, lk } = ctx;
  const set = `${lk}-pr`;
  const total = lesson.practice.length;
  const refresh = () => {
    const sc = store.score(set);
    root.querySelector("[data-score]").innerHTML = sc.answered < total ? resultCard(set, total) : `<span class="chip ok">${sc.correct}/${total}</span>`;
    root.querySelector("[data-final]").innerHTML = sc.answered >= total ? resultCard(set, total, { onRetryLabel: t("pr.retry") }) : "";
  };
  mountItems(root, lesson.practice, set, refresh);
  refresh();
}

// ---------------------------------------------------------------- 6 · task
function dialogueLines(lines, cast) {
  return lines.map((l) => {
    const p = who(cast, l.speaker);
    return `<div class="line reg-${p.register}" data-line="${esc(l.audio)}">${avatar(l.speaker, cast, "sm")}<div class="bubble"><b>${esc(p.name)}</b><p>${fmt(l.text)}</p></div>${playBtn(l.audio, { size: "sm", label: t("lex.listenTo", { name: p.name }) })}</div>`;
  }).join("");
}

function modelHTML(task, cast) {
  return task.model.parts.map((p) => {
    const notes = p.notes ? `<ul class="notes">${p.notes.map((n) => `<li>${fmt(n)}</li>`).join("")}</ul>` : "";
    // A model can be a dialogue (several voices, one clip per line) instead of a single text.
    if (p.lines) {
      const ids = p.lines.map((l) => l.audio).join(",");
      const total = p.lines.reduce((n, l) => n + audio.duration(l.audio), 0);
      return `
      <article class="model-part">
        <div class="voice-head"><div class="who"><b>${esc(p.label)}</b><span>${[...new Set(p.lines.map((l) => who(cast, l.speaker).name))].join(" · ")} · ${fmtTime(total)}</span></div><button type="button" class="btn small" data-seq="${esc(ids)}" data-seq-label="${esc(t("task.listenDialogue"))}" data-seq-stop="${esc(t("lex.stop"))}">${icon.headphones}<span>${esc(t("task.listenDialogue"))}</span></button></div>
        <div class="dialogue">${dialogueLines(p.lines, cast)}</div>
        ${notes}
      </article>`;
    }
    const s = who(cast, p.speaker);
    return `
      <article class="model-part reg-${s.register}">
        <div class="voice-head">${avatar(p.speaker, cast)}<div class="who"><b>${esc(p.label)}</b><span>${speakerLine(cast, p.speaker)} · ${fmtTime(audio.duration(p.audio))}</span></div>${playBtn(p.audio, { size: "lg", solid: true, label: t("task.listenModel") })}</div>
        <p class="voice-text">${fmt(p.text)}</p>
        ${notes}
      </article>`;
  }).join("");
}

// Optional input for the task: a message the learner has to answer (e.g. a
// confusing voice note that calls for clarifying questions).
function taskInputHTML(input, cast) {
  if (!input) return "";
  const s = who(cast, input.speaker);
  return `<div class="task-input reg-${s.register}"><div class="voice-head">${avatar(input.speaker, cast, "sm")}<div class="who"><b>${esc(input.title)}</b><span>${speakerLine(cast, input.speaker)} · ${fmtTime(audio.duration(input.audio))}</span></div>${playBtn(input.audio, { solid: true, label: t("task.listenInput") })}</div><p class="en">${fmt(input.text)}</p></div>`;
}

function chunkChips(task, text) {
  return task.chunks.map((c) => {
    const on = new RegExp(c.re, "i").test(text);
    return `<span class="uc ${on ? "on" : ""}">${esc(c.label)}</span>`;
  }).join("");
}

// B1 tasks give sentence frames (tap to insert, with ___ to fill). B2 tasks give
// key words only: the learner builds the syntax. Both insert into the writer.
function scaffoldHTML(task, attr) {
  if (task.frames?.length) {
    return `<div class="stack" style="gap:8px"><span class="eyebrow">${esc(t("task.frames"))}</span><div class="frames">${task.frames.map((f) => `<button type="button" class="frame" ${attr}="${esc(f)}">${esc(f)}</button>`).join("")}</div></div>`;
  }
  if (task.keywords?.length) {
    return `<div class="stack" style="gap:8px"><span class="eyebrow">${esc(t("task.keywords"))}</span><div class="frames keywords">${task.keywords.map((k) => `<button type="button" class="frame kw" ${attr}="${esc(k)}">${esc(k)}</button>`).join("")}</div></div>`;
  }
  return "";
}

// B1: strings with a checkbox. B2: objects { area, text, reflect } rated Yes / Partly / Not yet.
const SC_LEVELS = ["yes", "partly", "no"];
function selfCheckHTML(task, lk, saved) {
  const meta = task.selfCheck.some((s) => typeof s === "object");
  const items = task.selfCheck.map((s, i) => {
    if (typeof s === "string") {
      return `<label><input type="checkbox" data-sc="${i}" id="sc-${esc(lk)}-${i}" ${store.checked(`${lk}-sc`, i) ? "checked" : ""}><span>${fmt(s)}</span></label>`;
    }
    const rating = store.task(lk).rating?.[i] || "";
    const seg = SC_LEVELS.map((lv) => `<button type="button" class="${rating === lv ? `is-${lv}` : ""}" data-sc-rate="${lv}">${esc(t(`task.sc.${lv}`))}</button>`).join("");
    const reflect = s.reflect ? `<input type="text" class="text-input reflect" data-reflect="${i}" placeholder="${esc(t("task.sc.reflect"))}" aria-label="${esc(t("task.sc.reflect"))}" value="${esc(saved.reflect?.[i] || "")}">` : "";
    return `<div class="sc-item area-${esc(s.area || "accuracy")}" data-sc-item="${i}"><span class="eyebrow">${esc(t(`task.area.${s.area || "accuracy"}`))}</span><p>${fmt(s.text)}</p><div class="seg" role="group" aria-label="${esc(t("task.selfcheck"))}">${seg}</div>${reflect}</div>`;
  }).join("");
  return `
    <section class="stack">
      <div class="section-head"><h3>${esc(t("task.selfcheck"))}</h3><p>${esc(t(meta ? "task.selfcheckMetaText" : "task.selfcheckText"))}</p></div>
      <div class="selfcheck ${meta ? "meta" : ""}">${items}</div>
    </section>`;
}

function taskBlock(ctx) {
  const { lesson, cast, lk, next } = ctx;
  const task = lesson.task;
  const saved = store.task(lk);
  const text = saved.text || "";
  const wc = wordCount(text);
  const done = store.isBlockDone(lk, "task");
  const formatLabel = t(`task.format.${task.format}`) || t("task.format.text");
  return `
    ${blockHead(5, BLOCKS[5], t("task.intro"))}
    <article class="task-brief narrow">
      <div class="row"><span class="chip accent">${esc(formatLabel)}</span><span class="chip">${esc(task.length)}</span></div>
      <h3>${esc(task.title)}</h3>
      <p>${fmt(task.scenario)}</p>
      ${taskInputHTML(task.input, cast)}
      <p class="en muted"><em>${esc(task.brief)}</em></p>
      <ol class="steps">${task.steps.map((s) => `<li>${fmt(s)}</li>`).join("")}</ol>
      ${scaffoldHTML(task, "data-frame")}
    </article>

    <section class="stack">
      <label for="task-${esc(lk)}" class="section-head"><h3>${esc(t("task.yourText"))}</h3><p>${esc(t("task.autosave"))}</p></label>
      <textarea class="writer" id="task-${esc(lk)}" data-writer spellcheck="false" placeholder="${esc(t("task.placeholder"))}">${esc(text)}</textarea>
      <div class="writer-bar"><span class="tnum" data-wc>${esc(t("task.words", { n: wc, goal: task.length }))}</span><span>${esc(t("task.chunksDetected"))}</span></div>
      <div class="used-chunks" data-chunks>${chunkChips(task, text)}</div>
      <div class="row">
        <button type="button" class="btn" data-review>${icon.sparkle}<span>${esc(t("task.review"))}</span></button>
        <button type="button" class="btn ghost" data-show-model>${icon.book}<span>${esc(t("task.showModel"))}</span></button>
      </div>
      ${task.format === "voice" ? recControls(`${lk}-task`, t("task.record")) : ""}
      <div class="hints" data-hints></div>
    </section>

    ${task.extra ? `
    <section class="stack">
      <label for="extra-${esc(lk)}" class="section-head"><h3>${esc(task.extra.title)}</h3><p>${fmt(task.extra.brief)}</p></label>
      ${scaffoldHTML(task.extra, "data-frame-extra")}
      <textarea class="writer short" id="extra-${esc(lk)}" data-extra spellcheck="false" placeholder="${esc(t("task.extraPlaceholder"))}">${esc(saved.extra || "")}</textarea>
    </section>` : ""}

    <section class="stack" data-model ${saved.model ? "" : "hidden"}>
      <div class="section-head"><h3>${esc(t("task.model"))}</h3><p>${esc(t("task.modelText"))}</p></div>
      <div class="model">${modelHTML(task, cast)}</div>
    </section>

    ${selfCheckHTML(task, lk, saved)}

    <div data-complete>${completeHTML(done, next)}</div>`;
}

function completeHTML(done, next) {
  if (done) {
    return `<div class="done-banner"><span class="mk">${icon.check}</span><div class="stack" style="gap:8px"><b>${esc(t("task.done"))}</b><div class="row">${next ? `<a class="btn" href="#${esc(next.route)}">${esc(next.label)}${icon.arrowR}</a>` : ""}<button type="button" class="btn ghost small" data-uncomplete>${esc(t("task.undo"))}</button></div></div></div>`;
  }
  return `<div class="row"><button type="button" class="btn" data-complete-btn>${icon.check}<span>${esc(t("task.complete"))}</span></button></div>`;
}

function mountTask(root, ctx) {
  const { lesson, lk, next, rerenderStepper } = ctx;
  const task = lesson.task;
  const writer = root.querySelector("[data-writer]");
  const extra = root.querySelector("[data-extra]");
  let timer;
  const update = () => {
    const text = writer.value;
    root.querySelector("[data-wc]").textContent = t("task.words", { n: wordCount(text), goal: task.length });
    root.querySelector("[data-chunks]").innerHTML = chunkChips(task, text);
    clearTimeout(timer);
    timer = setTimeout(() => store.setTask(lk, { text }), 250);
  };
  writer.addEventListener("input", update);
  extra?.addEventListener("input", () => store.setTask(lk, { extra: extra.value }));

  const insert = (area, frame) => {
    const start = area.selectionStart ?? area.value.length;
    const before = area.value.slice(0, start);
    const sep = before && !/\s$/.test(before) ? " " : "";
    area.value = before + sep + frame + area.value.slice(area.selectionEnd ?? start);
    const blank = area.value.indexOf("___", before.length);
    area.focus();
    if (blank >= 0) area.setSelectionRange(blank, blank + 3);
    area.dispatchEvent(new Event("input"));
  };

  root.addEventListener("click", (ev) => {
    const f = ev.target.closest("[data-frame]");
    if (f) return insert(writer, f.dataset.frame);
    const fe = ev.target.closest("[data-frame-extra]");
    if (fe && extra) return insert(extra, fe.dataset.frameExtra);
    const rate = ev.target.closest("[data-sc-rate]");
    if (rate) {
      const item = rate.closest("[data-sc-item]");
      const i = Number(item.dataset.scItem);
      const rating = { ...(store.task(lk).rating || {}), [i]: rate.dataset.scRate };
      store.setTask(lk, { rating });
      item.querySelectorAll("[data-sc-rate]").forEach((b) => { b.className = b === rate ? `is-${rate.dataset.scRate}` : ""; });
      return;
    }
    if (ev.target.closest("[data-review]")) {
      const text = writer.value.trim();
      const box = root.querySelector("[data-hints]");
      if (wordCount(text) < 8) {
        box.innerHTML = `<div class="feedback info"><span class="mk">i</span><div>${esc(t("task.tooShort"))}</div></div>`;
        return;
      }
      const hints = runChecks(text, task.checks);
      const wc = wordCount(text);
      const used = task.chunks.filter((c) => new RegExp(c.re, "i").test(text)).length;
      const lengthNote = wc < task.minWords ? `<div class="feedback info"><span class="mk">i</span><div>${esc(t("task.lengthNote", { n: wc, goal: task.length }))}</div></div>` : "";
      const enough = used >= Math.ceil(task.chunks.length / 2);
      const chunkNote = `<div class="feedback ${enough ? "ok" : "info"}"><span class="mk">${used}/${task.chunks.length}</span><div>${esc(t("task.chunksUsed"))} ${esc(t(enough ? "task.chunksGood" : "task.chunksMore"))}</div></div>`;
      const hintHTML = hints.length
        ? hints.map((h) => `<div class="feedback ${h.soft ? "info" : "bad"}"><span class="mk">${h.soft ? "?" : "!"}</span><div>${fmt(h.msg)}${h.sample ? `<br><span class="en muted">«${esc(h.sample)}»</span>` : ""}</div></div>`).join("")
        : `<div class="feedback ok"><span class="mk">✓</span><div>${esc(t("task.noHints"))}</div></div>`;
      box.innerHTML = chunkNote + hintHTML + lengthNote;
      return;
    }
    if (ev.target.closest("[data-show-model]")) {
      const sec = root.querySelector("[data-model]");
      sec.hidden = false;
      store.setTask(lk, { model: true });
      sec.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (ev.target.closest("[data-complete-btn]")) {
      store.markBlock(lk, "task", true);
      root.querySelector("[data-complete]").innerHTML = completeHTML(true, next);
      rerenderStepper?.();
      toast(t("task.doneToast"));
      return;
    }
    if (ev.target.closest("[data-uncomplete]")) {
      store.markBlock(lk, "task", false);
      root.querySelector("[data-complete]").innerHTML = completeHTML(false, next);
      rerenderStepper?.();
    }
  });
  root.addEventListener("change", (ev) => {
    const cb = ev.target.closest("[data-sc]");
    if (cb) store.setChecked(`${lk}-sc`, Number(cb.dataset.sc), cb.checked);
  });
  root.addEventListener("input", (ev) => {
    const r = ev.target.closest("[data-reflect]");
    if (r) store.setTask(lk, { reflect: { ...(store.task(lk).reflect || {}), [r.dataset.reflect]: r.value } });
  });
}

export const RENDER = { lexical, discovery, phonetics, consolidation, practice, task: taskBlock };
export const MOUNT = {
  lexical: mountLexical,
  discovery: mountDiscovery,
  phonetics: (root) => mountRecorders(root),
  consolidation: mountConsolidation,
  practice: mountPractice,
  task: (root, ctx) => { mountTask(root, ctx); mountRecorders(root); },
};
