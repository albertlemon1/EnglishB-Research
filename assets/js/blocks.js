// The six blocks of the atomic lesson matrix.
import { esc, fmt, icon, playBtn, avatar, regChip, regMeter, REG, ALERTS, fmtTime, waveBars, toast } from "./ui.js";
import { audio } from "./audio.js";
import { store } from "./store.js";
import { renderItem, mountItems, resultCard } from "./exercises.js";
import { runChecks, wordCount } from "./checks.js";
import { recControls, mountRecorders } from "./recorder.js";

export const BLOCKS = [
  { id: "lexical", name: "Input léxico", short: "Input", title: "Escenario vivo y registros reales" },
  { id: "discovery", name: "Descubrimiento guiado", short: "Descubre", title: "Descubre la regla tú mismo" },
  { id: "phonetics", name: "Glosario fonético dual", short: "Fonética", title: "IPA + Anclaje Fonético Hispanohablante" },
  { id: "consolidation", name: "Consolidación y L1", short: "Consolida", title: "Estructuras, matices y puntos ciegos" },
  { id: "practice", name: "Práctica", short: "Practica", title: "Practica con corrección inmediata" },
  { id: "task", name: "Tarea y autoevaluación", short: "Tarea", title: "Tarea comunicativa real" },
];

// ---------------------------------------------------------------- glossing
function glosser(lesson) {
  const bank = (lesson.lexical?.chunks || []).map((c) => {
    const key = c.en.toLowerCase().replace(/\(.*?\)/g, " ").replace(/\+.*$/, " ").replace(/^be\s+/, "")
      .replace(/\b(someone|something|a|an|the)\b/g, " ").replace(/[^a-z' ]/g, " ").trim().split(/\s+/).filter(Boolean);
    return { tokens: key, en: c.en, es: c.es };
  }).filter((c) => c.tokens.length);
  const ALIAS = { ran: "run", made: "make", came: "come", got: "get", kept: "keep", flew: "fly", "everything's": "everything" };
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
  return `<header class="block-head"><span class="eyebrow">Bloque ${i + 1} de 6 · ${esc(block.name)}</span><h2>${esc(block.title)}</h2>${intro ? `<p class="lead">${fmt(intro)}</p>` : ""}</header>`;
}

function exampleLine(ex, cast) {
  return `<div class="example">${playBtn(ex.audio, { size: "sm", label: `Escuchar a ${who(cast, ex.speaker).name}` })}<p>${fmt(ex.text)}</p></div>`;
}

// ---------------------------------------------------------------- 1 · lexical
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
    return `<div class="line reg-${p.register}" data-line="${esc(l.audio)}">${avatar(l.speaker, cast, "sm")}<div class="bubble"><b>${esc(p.name)}</b><p>${fmt(l.text, { gloss: g })}</p></div>${playBtn(l.audio, { size: "sm", label: `Escuchar a ${p.name}` })}</div>`;
  }).join("");
  const speakers = [...new Set(lx.dialogue.lines.map((l) => l.speaker))];

  const regs = lx.registers.map((r) => `
    <section class="reg-col reg-${r.level}">
      <header><h4><span class="dot"></span>${esc(REG[r.level].label)}</h4>${regMeter(r.level)}<p>${fmt(r.use)}</p></header>
      ${r.items.map((it) => `<div class="reg-item">${playBtn(it.audio, { size: "sm", label: `Escuchar a ${who(cast, it.speaker).name}` })}<div><p class="en">${fmt(it.text)}</p><small>${fmt(it.note || "")}</small><span class="who">${speakerLine(cast, it.speaker)}</span></div></div>`).join("")}
    </section>`).join("");

  const rq = lx.registerQuiz.map((q, i) => renderRegisterQ(q, i, `${lk}-rq`)).join("");

  const chunks = lx.chunks.map((c) => `<div class="chunk reg-${c.register}"><b><span class="dot"></span>${esc(c.en)}</b><span>${esc(c.es)}</span></div>`).join("");

  return `
    ${blockHead(0, BLOCKS[0], "El mismo mensaje cambia según con quién hablas. Escucha, fíjate en los bloques resaltados y toca uno para ver su significado.")}
    <article class="voice-note reg-${s.register}">
      <div class="voice-head">${avatar(sc.speaker, cast)}<div class="who"><b>${esc(sc.title)}</b><span>${esc(s.name)} → ${esc(sc.to)} · ${esc(s.accent)} · ${fmtTime(dur)}</span></div>${waveBars(sc.audio)}${playBtn(sc.audio, { size: "lg", solid: true, label: "Escuchar el mensaje" })}</div>
      <p class="context">${fmt(sc.context)}</p>
      <p class="voice-text">${fmt(sc.text, { gloss: g })}</p>
    </article>

    <section class="stack">
      <div class="section-head"><h3>Comprensión</h3><p>Tres preguntas rápidas sobre la conversación de abajo. Escúchala primero.</p></div>
      <div class="section-head"><h4 class="en">${esc(lx.dialogue.title)}</h4><p>${fmt(lx.dialogue.context)}</p></div>
      <div class="row"><button type="button" class="btn" data-seq="${esc(lx.dialogue.lines.map((l) => l.audio).join(","))}">${icon.headphones}<span>Escuchar la conversación</span></button><span class="small muted">${speakers.map((sp) => `${esc(who(cast, sp).name)} (${esc(who(cast, sp).accent)})`).join(" · ")}</span></div>
      <div class="dialogue narrow">${lines}</div>
      <div class="stack narrow">${comp}</div>
    </section>

    <section class="stack">
      <div class="section-head"><h3>Mapa de registros</h3><p>Cada columna tiene su propio grupo de voces: amistades para el casual, coordinación cotidiana para el neutro y voces británicas institucionales para el formal.</p></div>
      <div class="registers">${regs}</div>
    </section>

    <section class="stack">
      <div class="section-head"><h3>¿Qué registro es?</h3><p>Clasifica cada frase. La corrección es inmediata.</p></div>
      <div class="stack narrow">${rq}</div>
    </section>

    <section class="stack">
      <div class="section-head"><h3>Banco de chunks</h3><p>Apréndelos como bloques completos, no palabra por palabra. El color indica el registro.</p></div>
      <div class="chunks">${chunks}</div>
    </section>`;
}

function renderRegisterQ(q, i, setKey) {
  const saved = store.result(setKey, i);
  const btns = ["casual", "neutral", "formal"].map((lv) => {
    let cls = "";
    if (saved) { if (lv === q.answer) cls = "is-right"; else if (lv === saved.v) cls = "is-wrong"; }
    return `<button type="button" class="${cls}" data-reg="${lv}" ${saved ? "disabled" : ""}>${REG[lv].short}</button>`;
  }).join("");
  const fb = saved ? `<div class="feedback ${saved.ok ? "ok" : "bad"}"><span class="mk">${saved.ok ? "Bien" : "Revisa"}</span><div>${saved.ok ? "" : `Es <b>${REG[q.answer].short.toLowerCase()}</b>. `}${fmt(q.explain)}</div></div>` : "";
  return `<div class="rq" data-rq="${i}" data-set="${esc(setKey)}"><p class="en">${fmt(q.text)}</p><div class="seg" role="group" aria-label="Registro">${btns}</div>${fb}</div>`;
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
    return `<div class="rule locked" data-rule><span class="eyebrow">La regla que descubriste</span><p>${icon.lock.replace("<svg", '<svg width="18" height="18" style="vertical-align:-3px;margin-right:6px"')}Responde las ${d.questions.length} preguntas para ver la regla (${answered}/${d.questions.length}).</p></div>`;
  }
  return `<div class="rule" data-rule><span class="eyebrow">La regla que descubriste</span><ul>${d.rule.points.map((p) => `<li>${fmt(p)}</li>`).join("")}</ul><div class="formulas">${d.rule.formulas.map((f) => `<span class="formula">${esc(f)}</span>`).join("")}</div>${d.rule.note ? `<p class="note">${fmt(d.rule.note)}</p>` : ""}</div>`;
}

function discovery(ctx) {
  const { lesson, cast, lk } = ctx;
  const d = lesson.discovery;
  const qs = d.questions.map((q, i) => renderItem(q, i, `${lk}-ccq`, { kind: q.kind })).join("");
  return `
    ${blockHead(1, BLOCKS[1], d.intro)}
    <article class="analysis">
      <div class="voice-head">${avatar(d.speaker, cast)}<div class="who"><b>Texto de análisis</b><span>${speakerLine(cast, d.speaker)}</span></div>${playBtn(d.audio, { size: "lg", solid: true, label: "Escuchar el texto" })}</div>
      <p class="voice-text">${fmt(d.text)}</p>
    </article>
    <section class="stack">
      <div class="section-head"><h3>Preguntas de descubrimiento</h3><p>Significado → forma → uso. Elige una opción: recibirás la explicación al instante.</p></div>
      <div class="ccq-list narrow">${qs}</div>
    </section>
    ${ruleCard(ctx)}`;
}

function mountDiscovery(root, ctx) {
  mountItems(root, ctx.lesson.discovery.questions, `${ctx.lk}-ccq`, () => {
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
        <div class="ph-top"><div><p class="ph-term">${esc(it.term)}<small>${esc(it.pos)}</small></p><p class="ph-mean">${esc(it.meaning)}</p></div>${playBtn(`${base}-us`, { size: "lg", solid: true, label: `Escuchar ${it.term}` })}</div>
        <div class="ph-rows">
          <div class="ph-row"><span class="acc">US</span><span class="ipa">${esc(it.ipa.us)}</span><span class="btns">${playBtn(`${base}-us`, { size: "sm", label: "Modelo estadounidense" })}<span class="audio-pill">${playBtn(`${base}-slow`, { label: "Modelo lento" })}Lento</span></span></div>
          <div class="ph-row"><span class="acc">UK</span><span class="ipa">${esc(it.ipa.uk)}</span><span class="btns">${playBtn(`${base}-uk`, { size: "sm", label: "Modelo británico" })}</span></div>
        </div>
        <div class="afh"><span class="eyebrow">AFH · cómo sonarlo</span><span class="resp">/${esc(it.afh)}/</span></div>
        <div class="alerts">${it.alerts.map(alertHTML).join("")}</div>
        ${ex ? `<div class="ph-ex">${playBtn(`${base}-ex`, { size: "sm", label: `Ejemplo con ${who(cast, ex.speaker).name}` })}<p>${fmt(ex.text)}</p></div>` : ""}
        ${recControls(`${lk}-${it.id}`, "Grabar y comparar")}
      </article>`;
  }).join("");
  return `
    ${blockHead(2, BLOCKS[2], ph.intro)}
    <details class="panel tight">
      <summary class="eyebrow" style="cursor:pointer">Cómo leer el AFH</summary>
      <div class="stack small" style="margin-top:10px">
        <p>El Anclaje Fonético Hispanohablante reescribe la palabra con letras del español para que la pronuncies bien desde el primer intento. La IPA es la referencia exacta; el AFH es tu atajo.</p>
        <p><b>MAYÚSCULAS</b> = sílaba tónica · <b>dy</b> = /dʒ/ (la y enfática de «¡yo!») · <b>sh</b> = /ʃ/ · <b>dh</b> = /ð/ (la d suave de «nada») · <b>z</b> = /z/ sonora (zumbido) · <b>h</b> = aspiración suave, nunca jota · <b>a</b> en sílaba átona = schwa /ə/, una vocal relajada · <b>r</b> entre vocales en «sor-ri» = flap T americana.</p>
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
      <span class="eyebrow">Estructura ${i + 1}</span>
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
    ${blockHead(3, BLOCKS[3], "Desglose mecánico de cada estructura, con matices de uso y ejemplos en contexto. Después, revisa los puntos ciegos del hispanohablante.")}
    <div class="structs">${structs}</div>
    <section class="stack">
      <div class="section-head"><h3>Matriz de interferencia L1</h3><p>Marca cada punto cuando lo tengas claro. Volverás a esta lista en la autoevaluación de la tarea.</p></div>
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
function practice(ctx) {
  const { lesson, lk } = ctx;
  const items = lesson.practice.map((it, i) => renderItem(it, i, `${lk}-pr`)).join("");
  return `
    ${blockHead(4, BLOCKS[4], "Elección, huecos, orden, corrección de errores típicos, acento y dictado. Cuenta tu primer intento.")}
    <div class="ex-head"><span class="eyebrow">${lesson.practice.length} ejercicios</span><div data-score>${resultCard(`${lk}-pr`, lesson.practice.length)}</div></div>
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
    root.querySelector("[data-final]").innerHTML = sc.answered >= total ? resultCard(set, total, { onRetryLabel: "Repetir la práctica" }) : "";
  };
  mountItems(root, lesson.practice, set, refresh);
  refresh();
}

// ---------------------------------------------------------------- 6 · task
function modelHTML(task, cast) {
  return task.model.parts.map((p) => {
    const s = who(cast, p.speaker);
    return `
      <article class="model-part reg-${s.register}">
        <div class="voice-head">${avatar(p.speaker, cast)}<div class="who"><b>${esc(p.label)}</b><span>${speakerLine(cast, p.speaker)} · ${fmtTime(audio.duration(p.audio))}</span></div>${playBtn(p.audio, { size: "lg", solid: true, label: "Escuchar el modelo" })}</div>
        <p class="voice-text">${fmt(p.text)}</p>
        ${p.notes ? `<ul class="notes">${p.notes.map((n) => `<li>${fmt(n)}</li>`).join("")}</ul>` : ""}
      </article>`;
  }).join("");
}

function chunkChips(task, text) {
  return task.chunks.map((c) => {
    const on = new RegExp(c.re, "i").test(text);
    return `<span class="uc ${on ? "on" : ""}">${esc(c.label)}</span>`;
  }).join("");
}

function taskBlock(ctx) {
  const { lesson, cast, lk, next } = ctx;
  const t = lesson.task;
  const saved = store.task(lk);
  const text = saved.text || "";
  const wc = wordCount(text);
  const done = store.isBlockDone(lk, "task");
  const formatLabel = { voice: "Mensaje (escrito o de voz)", text: "Texto", email: "Correo / mensaje" }[t.format] || "Texto";
  return `
    ${blockHead(5, BLOCKS[5], "Usa lo que has aprendido para cumplir un objetivo real. Luego compara con el modelo comentado y revisa tu texto con la matriz L1.")}
    <article class="task-brief narrow">
      <div class="row"><span class="chip accent">${esc(formatLabel)}</span><span class="chip">${esc(t.length)}</span></div>
      <h3>${esc(t.title)}</h3>
      <p>${fmt(t.scenario)}</p>
      <p class="en muted"><em>${esc(t.brief)}</em></p>
      <ol class="steps">${t.steps.map((s) => `<li>${fmt(s)}</li>`).join("")}</ol>
      <div class="stack" style="gap:8px"><span class="eyebrow">Plantillas de frases · toca una para insertarla</span><div class="frames">${t.frames.map((f) => `<button type="button" class="frame" data-frame="${esc(f)}">${esc(f)}</button>`).join("")}</div></div>
    </article>

    <section class="stack">
      <label for="task-${esc(lk)}" class="section-head"><h3>Tu texto</h3><p>Se guarda automáticamente en este navegador.</p></label>
      <textarea class="writer" id="task-${esc(lk)}" data-writer spellcheck="false" placeholder="Escribe aquí en inglés…">${esc(text)}</textarea>
      <div class="writer-bar"><span class="tnum" data-wc>${wc} palabras · objetivo ${esc(t.length)}</span><span>Chunks detectados</span></div>
      <div class="used-chunks" data-chunks>${chunkChips(t, text)}</div>
      <div class="row">
        <button type="button" class="btn" data-review>${icon.sparkle}<span>Revisar mi texto</span></button>
        <button type="button" class="btn ghost" data-show-model>${icon.book}<span>Ver modelo comentado</span></button>
      </div>
      ${t.format === "voice" ? recControls(`${lk}-task`, "Grabar mi mensaje de voz") : ""}
      <div class="hints" data-hints></div>
    </section>

    ${t.extra ? `
    <section class="stack">
      <label for="extra-${esc(lk)}" class="section-head"><h3>${esc(t.extra.title)}</h3><p>${fmt(t.extra.brief)}</p></label>
      <div class="frames">${t.extra.frames.map((f) => `<button type="button" class="frame" data-frame-extra="${esc(f)}">${esc(f)}</button>`).join("")}</div>
      <textarea class="writer short" id="extra-${esc(lk)}" data-extra spellcheck="false" placeholder="Your formal sentence…">${esc(saved.extra || "")}</textarea>
    </section>` : ""}

    <section class="stack" data-model ${saved.model ? "" : "hidden"}>
      <div class="section-head"><h3>Modelo comentado</h3><p>Escucha y compara: ¿qué chunks usó el modelo que tú no usaste?</p></div>
      <div class="model">${modelHTML(t, cast)}</div>
    </section>

    <section class="stack">
      <div class="section-head"><h3>Autoevaluación</h3><p>Repasa tu texto punto por punto antes de darlo por terminado.</p></div>
      <div class="selfcheck">${t.selfCheck.map((s, i) => `<label><input type="checkbox" data-sc="${i}" id="sc-${esc(lk)}-${i}" ${store.checked(`${lk}-sc`, i) ? "checked" : ""}><span>${fmt(s)}</span></label>`).join("")}</div>
    </section>

    <div data-complete>${completeHTML(done, next)}</div>`;
}

function completeHTML(done, next) {
  if (done) {
    return `<div class="done-banner"><span class="mk">${icon.check}</span><div class="stack" style="gap:8px"><b>Lección completada</b><div class="row">${next ? `<a class="btn" href="#${esc(next.route)}">${esc(next.label)}${icon.arrowR}</a>` : ""}<button type="button" class="btn ghost small" data-uncomplete>Marcar como pendiente</button></div></div></div>`;
  }
  return `<div class="row"><button type="button" class="btn" data-complete-btn>${icon.check}<span>Marcar la lección como completada</span></button></div>`;
}

function mountTask(root, ctx) {
  const { lesson, lk, next, rerenderStepper } = ctx;
  const t = lesson.task;
  const writer = root.querySelector("[data-writer]");
  const extra = root.querySelector("[data-extra]");
  let timer;
  const update = () => {
    const text = writer.value;
    root.querySelector("[data-wc]").textContent = `${wordCount(text)} palabras · objetivo ${t.length}`;
    root.querySelector("[data-chunks]").innerHTML = chunkChips(t, text);
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
    if (ev.target.closest("[data-review]")) {
      const text = writer.value.trim();
      const box = root.querySelector("[data-hints]");
      if (wordCount(text) < 8) {
        box.innerHTML = `<div class="feedback info"><span class="mk">i</span><div>Escribe primero tu texto (al menos un par de frases) y vuelve a revisarlo.</div></div>`;
        return;
      }
      const hints = runChecks(text, t.checks);
      const wc = wordCount(text);
      const used = t.chunks.filter((c) => new RegExp(c.re, "i").test(text)).length;
      const lengthNote = wc < t.minWords ? `<div class="feedback info"><span class="mk">i</span><div>Tu texto tiene ${wc} palabras; el objetivo es ${esc(t.length)}. Añade un detalle más.</div></div>` : "";
      const chunkNote = `<div class="feedback ${used >= Math.ceil(t.chunks.length / 2) ? "ok" : "info"}"><span class="mk">${used}/${t.chunks.length}</span><div>Chunks de la lección usados. ${used >= Math.ceil(t.chunks.length / 2) ? "Buen despliegue de vocabulario." : "Intenta incorporar alguno más de la lista de arriba."}</div></div>`;
      const hintHTML = hints.length
        ? hints.map((h) => `<div class="feedback ${h.soft ? "info" : "bad"}"><span class="mk">${h.soft ? "?" : "!"}</span><div>${fmt(h.msg)}${h.sample ? `<br><span class="en muted">«${esc(h.sample)}»</span>` : ""}</div></div>`).join("")
        : `<div class="feedback ok"><span class="mk">✓</span><div>No se detectaron los errores típicos de interferencia que revisa esta lección. Repásalo igualmente con la autoevaluación.</div></div>`;
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
      toast("Lección completada");
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
