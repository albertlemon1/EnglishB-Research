// Page-level views. Each returns { title, html, mount? }.
import { esc, fmt, icon, playBtn, avatar, regMeter, REG, ALERTS, toast } from "./ui.js";
import { data, AVAILABLE } from "./data.js";
import { store } from "./store.js";
import { audio } from "./audio.js";
import { BLOCKS, RENDER, MOUNT, alertHTML } from "./blocks.js";
import { renderItem, mountItems, resultCard } from "./exercises.js";

const pad = (n) => String(n).padStart(2, "0");
const lessonKey = (mod, l) => `${mod}-${l}`;

function lessonProgress(mod, lessonId) {
  return store.blocksDone(lessonKey(mod, lessonId)) / BLOCKS.length;
}

function nextBlockRoute(mod, lessonId) {
  const lk = lessonKey(mod, lessonId);
  const b = BLOCKS.find((x) => !store.isBlockDone(lk, x.id)) || BLOCKS[0];
  return `${lk}-${b.id}`;
}

function crumbs(items) {
  return `<nav class="crumbs" aria-label="Ruta de navegación">${items.map((it, i) => (it.href ? `<a href="#${esc(it.href)}">${esc(it.label)}</a>` : `<span>${esc(it.label)}</span>`) + (i < items.length - 1 ? '<span aria-hidden="true">›</span>' : "")).join("")}</nav>`;
}

// The band: 270 hours as four proportional segments with one tick per module.
function bandHTML(course, { link = false } = {}) {
  const doneLessons = (sub) => (sub.id === "b1-1" ? countDoneLessons() : 0);
  const segs = course.sublevels.map((s, i) => {
    const total = s.modules.length * 5;
    const fill = Math.round((doneLessons(s) / total) * 100);
    const tag = link ? "button" : "div";
    const seg = `<${tag} ${link ? `type="button" data-scroll="${s.id}"` : ""} class="band-seg ${s.id === "b1-1" ? "is-current" : ""}" style="flex:${s.hours};--fill:${fill}%;--n:${s.modules.length}" aria-label="${esc(`${s.code} ${s.name}: ${s.hours} horas, ${s.modules.length} módulos`)}"><span class="fill"></span><span class="ticks"></span><b>${esc(s.code)}</b><span class="hrs tnum">${s.hours} h</span></${tag}>`;
    const gate = s.id === course.gate.after ? `<span class="band-gate" title="${esc(course.gate.title)}"><i></i></span>` : "";
    return seg + gate;
  }).join("");
  return `<div class="band"><div class="band-track">${segs}</div><div class="band-legend"><span>270 horas · 54 módulos · 270 lecciones</span><span>◆ ${esc(course.gate.title)} (hora 120)</span><span class="tnum">${countDoneLessons()} lecciones completadas</span></div></div>`;
}

function countDoneLessons() {
  return ["l01", "l02", "l03", "l04", "l05"].filter((l) => store.isBlockDone(lessonKey("m01", l), "task")).length;
}

// ---------------------------------------------------------------- home
export async function home() {
  const [course, mod] = await Promise.all([data.course(), data.module("m01")]);
  const lessons = await data.allLessons("m01");
  const last = store.last;
  let cont;
  const lastMatch = last && /^m01-(l\d\d)-(\w+)$/.exec(last);
  if (lastMatch) {
    const l = lessons.find((x) => x.id === lastMatch[1]);
    const b = BLOCKS.find((x) => x.id === lastMatch[2]);
    cont = { route: last, lesson: l, block: b };
  } else {
    const l = lessons.find((x) => lessonProgress("m01", x.id) < 1) || lessons[0];
    const route = nextBlockRoute("m01", l.id);
    cont = { route, lesson: l, block: BLOCKS.find((b) => route.endsWith(b.id)) };
  }
  const p = lessonProgress("m01", cont.lesson.id);
  const pillarsKey = { lexical: "<mark>on track</mark>", discovery: "?", tblt: "→", afh: "/ə/" };
  const html = `
    <div class="wrap">
      <section class="hero">
        <span class="eyebrow">Inglés para hispanohablantes · MCER</span>
        <h1>Banda <span class="b">B</span> <span class="range">B1 → B2</span></h1>
        <p class="lead">Un sistema de autoaprendizaje de 270 horas para superar la meseta del nivel intermedio: chunks reales en tres registros, gramática que descubres tú y una pronunciación que anticipa los errores del español.</p>
        ${bandHTML(course)}
      </section>
      <div class="grid-2" style="margin-top:24px">
        <div class="stack-lg">
          <article class="continue">
            <span class="eyebrow">${last ? "Continúa donde lo dejaste" : "Empieza aquí"}</span>
            <h3 class="en">${esc(cont.lesson.title)}</h3>
            <p class="meta">B1.1 · Módulo 01 · Lección ${pad(cont.lesson.n)} · Bloque: ${esc(cont.block.name)}</p>
            <div class="bar" style="--w:${Math.round(p * 100)}%"><i></i></div>
            <a class="btn" href="#${esc(cont.route)}">${last ? "Continuar" : "Empezar la lección"}${icon.arrowR}</a>
          </article>
          <section class="stack">
            <div class="section-head"><span class="eyebrow">B1.1 · Módulo 01 · 5 horas</span><h3 class="en">${esc(mod.title)}</h3></div>
            <div class="lesson-list">${lessons.map((l) => lessonRow("m01", l)).join("")}${reviewRow()}</div>
            <a class="btn ghost" href="#m01">Ver el módulo completo${icon.arrowR}</a>
          </section>
        </div>
        <aside class="stack">
          <span class="eyebrow">Método</span>
          <div class="stack" style="gap:10px">${course.method.map((m) => `<div class="pillar"><span class="k" aria-hidden="true">${pillarsKey[m.id] || "·"}</span><h4>${esc(m.name)}</h4><p>${esc(m.text)}</p></div>`).join("")}</div>
          <a class="btn ghost" href="#metodo">Cómo funciona el curso${icon.arrowR}</a>
        </aside>
      </div>
    </div>`;
  return { title: "Banda B", html };
}

function lessonRow(mod, l) {
  const p = lessonProgress(mod, l.id);
  const done = store.isBlockDone(lessonKey(mod, l.id), "task");
  return `<a class="lesson-row ${done ? "done" : ""}" href="#${esc(lessonKey(mod, l.id))}"><span class="num">${done ? icon.check.replace("<svg", '<svg width="20" height="20"') : pad(l.n)}</span><span class="t"><strong>${esc(l.title)}</strong><span>${esc(l.titleEs)}</span></span><span class="ring" style="--v:${p.toFixed(3)}" aria-label="${Math.round(p * 100)}% completado"><span>${Math.round(p * 6)}/6</span></span></a>`;
}

function reviewRow() {
  const sc = store.score("m01-review");
  return `<a class="lesson-row" href="#m01-repaso"><span class="num">R</span><span class="t"><strong>Module 1 Review</strong><span>Repaso del módulo · 12 preguntas</span></span><span class="chip ${sc.answered ? "ok" : ""} tnum">${sc.answered ? `${sc.correct}/12` : "12"}</span></a>`;
}

// ---------------------------------------------------------------- course map
export async function map() {
  const course = await data.course();
  let lessonStart = 0;
  const subs = course.sublevels.map((s) => {
    const first = lessonStart + 1;
    const mods = s.modules.map((m) => {
      const start = lessonStart;
      lessonStart += m.lessons.length;
      const available = m.status === "available" && AVAILABLE[m.id];
      return `
        <article class="mod ${available ? "available" : ""} ${m.gate ? "gate-mod" : ""}">
          <div class="mod-top"><span class="mod-n">M${pad(m.n)}</span>${available ? '<span class="chip ok">Disponible</span>' : m.gate ? '<span class="chip gate">Evaluación</span>' : '<span class="chip">En diseño</span>'}</div>
          <h4>${esc(m.title)}</h4>
          <div class="tags">${m.domains.map((d) => `<span class="chip" title="${esc(course.domains[d].es)}">${esc(course.domains[d].name)}</span>`).join("")}</div>
          <p class="focusline"><b>Gramática:</b> ${esc(m.grammar)}<br><b>AFH:</b> ${esc(m.afh)}</p>
          <details ${available ? "open" : ""}><summary>Lecciones ${start + 1}–${start + m.lessons.length}</summary><ol style="--start:${start}">${m.lessons.map((l) => `<li>${esc(l)}</li>`).join("")}</ol></details>
          ${available ? `<a class="btn small open" href="#${esc(m.id)}">Abrir el módulo${icon.arrowR}</a>` : ""}
        </article>`;
    }).join("");
    const gate = s.id === course.gate.after ? gateHTML(course.gate) : "";
    return `
      <section class="sub" id="sub-${s.id}">
        <div class="sub-head"><span class="sub-code">${esc(s.code)}</span><div class="sub-meta"><h3>${esc(s.name)} <span class="muted" style="font-weight:500">· ${esc(s.nameEs)}</span></h3><div class="row"><span class="chip tnum">${s.hours} horas</span><span class="chip tnum">${s.modules.length} módulos</span><span class="chip tnum">Lecciones ${first}–${lessonStart}</span><span class="chip accent wraps">Instrucciones: ${esc(s.instructions)}</span></div><p class="small muted">${esc(s.scaffolding)}</p></div></div>
        <div class="focus-grid"><div class="focus"><span class="eyebrow">Gramática (EGP)</span>${esc(s.focus.grammar)}</div><div class="focus"><span class="eyebrow">Léxico y pragmática (EVP)</span>${esc(s.focus.lexis)}</div><div class="focus"><span class="eyebrow">Foco fonético (AFH)</span>${esc(s.focus.afh)}</div></div>
        <div class="modules">${mods}</div>
      </section>
      ${gate}`;
  }).join('<hr class="divider">');
  const html = `
    <div class="wrap stack-lg" style="padding-top:28px">
      <header class="section-head"><span class="eyebrow">Estructura del curso</span><h1 style="font-size:var(--s-2xl)">La ruta de la Banda B</h1><p class="lead">Cuatro subniveles en espiral: las mismas estructuras y colocaciones vuelven en contextos cada vez más complejos. Cada lección dura una hora y sigue la misma matriz de seis bloques.</p></header>
      ${bandHTML(course, { link: true })}
      <div class="stack-lg">${subs}</div>
    </div>`;
  return { title: "La ruta · Banda B", html };
}

function gateHTML(g) {
  return `<section class="gate-card" id="sub-gate"><div class="row"><span class="chip gate">◆ Hora ${g.lesson}</span><span class="eyebrow">${esc(g.subtitle)}</span></div><h3>${esc(g.title)}</h3><p class="muted">${esc(g.format)}</p><div class="criteria">${g.criteria.map((c) => `<div><b>${esc(c.name)}</b>${esc(c.text)}</div>`).join("")}</div></section>`;
}

// ---------------------------------------------------------------- module
export async function moduleView(modId) {
  const [course, mod, cast, lessons] = await Promise.all([data.course(), data.module(modId), data.cast(), data.allLessons(modId)]);
  const sub = course.sublevels.find((s) => s.id === mod.sublevel);
  const sample = (spk) => Object.entries(window.__manifest || {}).find(([id, m]) => m.speaker === spk && !id.includes("-ph-"))?.[0];
  const people = mod.cast.map((id) => {
    const s = cast[id];
    return `<div class="person reg-${s.register}">${avatar(id, cast)}<div><b>${esc(s.name)} <span class="muted" style="font-weight:500">· ${esc(s.accent)}</span></b><span>${esc(s.role)} · ${esc(REG[s.register]?.short || "")}</span></div>${playBtn(sample(id), { size: "sm", label: `Escuchar la voz de ${s.name}` })}</div>`;
  }).join("");
  const cando = mod.canDo.map((c, i) => `<li class="${store.checked(`${modId}-cando`, i) ? "on" : ""}"><label style="cursor:pointer"><input type="checkbox" class="sr-only" data-cando="${i}" ${store.checked(`${modId}-cando`, i) ? "checked" : ""} id="cando-${i}">${esc(c)}</label></li>`).join("");
  const totalClips = Object.keys(window.__manifest || {}).length;
  const canCache = "serviceWorker" in navigator && navigator.serviceWorker.controller;
  const html = `
    <div class="wrap">
      <section class="module-hero">
        ${crumbs([{ label: "Ruta", href: "ruta" }, { label: sub.code }, { label: `Módulo ${pad(mod.n)}` }])}
        <span class="eyebrow">${esc(sub.code)} · ${esc(sub.name)} · Módulo ${pad(mod.n)} · ${mod.hours} horas</span>
        <h1 style="font-size:var(--s-2xl)">${esc(mod.title)}</h1>
        <p class="lead">${esc(mod.titleEs)}</p>
        <p class="prose muted">${esc(mod.intro)}</p>
        <div class="row">${mod.domains.map((d) => `<span class="chip">${esc(course.domains[d].name)}</span>`).join("")}</div>
      </section>
      <div class="grid-2" style="margin-top:20px">
        <section class="stack">
          <h3>Lecciones</h3>
          <div class="lesson-list">${lessons.map((l) => lessonRow(modId, l)).join("")}${reviewRow()}</div>
        </section>
        <aside class="stack">
          <div class="panel stack"><span class="eyebrow">Al terminar podrás… (toca para autoevaluarte)</span><ul class="cando">${cando}</ul></div>
          <div class="panel stack small"><div><span class="eyebrow">Gramática</span><p>${esc(mod.focus.grammar)}</p></div><div><span class="eyebrow">Léxico</span><p class="en">${esc(mod.focus.lexis)}</p></div><div><span class="eyebrow">Fonética (AFH)</span><p>${esc(mod.focus.afh)}</p></div></div>
        </aside>
      </div>
      <section class="stack" style="margin-top:32px">
        <div class="section-head"><h3>Las voces del módulo</h3><p>Ocho voces neuronales, cada una asignada a un registro y un contexto. Toca para escuchar una muestra.</p></div>
        <div class="cast">${people}</div>
      </section>
      ${canCache ? `<section class="panel offline" style="margin-top:24px" data-offline><div class="row" style="justify-content:space-between"><div><b>Usar sin conexión</b><p class="small muted">Guarda los ${totalClips} audios del módulo en este dispositivo.</p></div><button type="button" class="btn ghost small" data-cache-audio>${icon.download}<span>Descargar audios</span></button></div><div class="progress-line" hidden><i></i></div></section>` : ""}
    </div>`;
  return {
    title: `${mod.title} · Banda B`,
    html,
    mount(root) {
      root.addEventListener("change", (ev) => {
        const cb = ev.target.closest("[data-cando]");
        if (!cb) return;
        store.setChecked(`${modId}-cando`, Number(cb.dataset.cando), cb.checked);
        cb.closest("li").classList.toggle("on", cb.checked);
      });
      root.querySelector("[data-cache-audio]")?.addEventListener("click", async (ev) => {
        const btn = ev.currentTarget;
        btn.disabled = true;
        const bar = root.querySelector("[data-offline] .progress-line");
        bar.hidden = false;
        const ids = Object.keys(window.__manifest || {});
        let n = 0;
        for (let i = 0; i < ids.length; i += 6) {
          await Promise.all(ids.slice(i, i + 6).map((id) => fetch(audio.url(id)).then(() => { n++; }).catch(() => {})));
          bar.style.setProperty("--w", `${Math.round((n / ids.length) * 100)}%`);
        }
        btn.querySelector("span").textContent = n === ids.length ? "Audios guardados" : `${n}/${ids.length} guardados`;
        toast(n === ids.length ? "Módulo disponible sin conexión" : "Algunos audios no se pudieron guardar");
      });
    },
  };
}

// ---------------------------------------------------------------- lesson (overview + blocks)
export async function lessonView(modId, lessonId, blockId) {
  const [mod, cast, lesson] = await Promise.all([data.module(modId), data.cast(), data.lesson(modId, lessonId)]);
  const lk = lessonKey(modId, lessonId);
  const idx = mod.lessons.indexOf(lessonId);
  const nextLesson = mod.lessons[idx + 1];
  const next = nextLesson ? { route: lessonKey(modId, nextLesson), label: `Lección ${pad(idx + 2)}` } : { route: `${modId}-repaso`, label: "Repaso del módulo" };

  const stepper = (active) => `<nav class="stepper" aria-label="Bloques de la lección" data-stepper><div class="wrap"><ol>${BLOCKS.map((b, i) => `<li><a href="#${lk}-${b.id}" class="${store.isBlockDone(lk, b.id) ? "done" : ""}" ${active === b.id ? 'aria-current="step"' : ""}><span class="n">${store.isBlockDone(lk, b.id) ? "✓" : i + 1}</span><span class="lbl">${esc(b.short)}</span></a></li>`).join("")}</ol></div></nav>`;

  const head = `
    <div class="wrap lesson-head">
      ${crumbs([{ label: "Ruta", href: "ruta" }, { label: "B1.1" }, { label: `Módulo ${pad(mod.n)}`, href: modId }, { label: `Lección ${pad(lesson.n)}`, href: blockId ? lk : null }])}
      <h1>${esc(lesson.title)}</h1>
      ${blockId ? "" : `<p class="es">${esc(lesson.titleEs)}</p>`}
    </div>`;

  if (!blockId) {
    const firstOpen = nextBlockRoute(modId, lessonId);
    const html = `
      ${head}
      ${stepper(null)}
      <div class="wrap block">
        <div class="row"><span class="chip">Lección ${pad(lesson.n)} de 270</span><span class="chip tnum">${lesson.minutes} min</span><span class="chip accent wraps">${esc(lesson.focus.grammar)}</span></div>
        <div class="objectives">
          <div class="panel stack"><span class="eyebrow">Objetivos · al terminar podrás</span><ul class="cando">${lesson.canDo.map((c) => `<li>${fmt(c)}</li>`).join("")}</ul></div>
          <div class="stack">
            <div class="warmup"><span class="eyebrow">Calentamiento</span><p>${fmt(lesson.warmup)}</p></div>
            <div class="panel tight stack small"><div><span class="eyebrow">Léxico</span><p class="en">${esc(lesson.focus.lexis)}</p></div><div><span class="eyebrow">Fonética</span><p>${esc(lesson.focus.afh)}</p></div></div>
          </div>
        </div>
        <section class="stack">
          <h3>Los seis bloques</h3>
          <div class="blocks-overview">${BLOCKS.map((b, i) => `<a class="bo ${store.isBlockDone(lk, b.id) ? "done" : ""}" href="#${lk}-${b.id}"><span class="eyebrow"><span>Bloque ${i + 1}</span>${store.isBlockDone(lk, b.id) ? "<span>✓</span>" : ""}</span><b>${esc(b.name)}</b><span>${esc(mod.blocks[i]?.text || "")}</span></a>`).join("")}</div>
        </section>
        <div class="row"><a class="btn" href="#${esc(firstOpen)}">${lessonProgress(modId, lessonId) > 0 ? "Continuar la lección" : "Empezar la lección"}${icon.arrowR}</a></div>
      </div>`;
    return { title: `${lesson.title} · Banda B`, html };
  }

  const bi = BLOCKS.findIndex((b) => b.id === blockId);
  const prev = bi > 0 ? { route: `${lk}-${BLOCKS[bi - 1].id}`, label: BLOCKS[bi - 1].short } : { route: lk, label: "Objetivos" };
  const after = bi < BLOCKS.length - 1 ? BLOCKS[bi + 1] : null;
  const ctx = { mod, lesson, cast, lk, next, modId };
  const html = `
    ${head}
    ${stepper(blockId)}
    <div class="wrap block" data-block="${blockId}">
      ${RENDER[blockId](ctx)}
      <nav class="block-nav" aria-label="Navegación entre bloques">
        <a class="btn ghost" href="#${esc(prev.route)}">${icon.arrowL}<span>${esc(prev.label)}</span></a>
        ${after ? `<a class="btn" href="#${lk}-${after.id}" data-complete-block="${blockId}"><span>Siguiente: ${esc(after.short)}</span>${icon.arrowR}</a>` : `<a class="btn ghost" href="#${esc(modId)}"><span>Volver al módulo</span></a>`}
      </nav>
    </div>`;
  return {
    title: `${BLOCKS[bi].name} · ${lesson.title}`,
    html,
    mount(root) {
      const rerenderStepper = () => {
        const old = root.querySelector("[data-stepper]");
        const tmp = document.createElement("div");
        tmp.innerHTML = stepper(blockId);
        old.replaceWith(tmp.firstElementChild);
      };
      MOUNT[blockId]?.(root, { ...ctx, rerenderStepper });
      root.querySelector("[data-complete-block]")?.addEventListener("click", () => store.markBlock(lk, blockId, true));
      store.setLast(`${lk}-${blockId}`);
      const cur = root.querySelector('.stepper [aria-current="step"]');
      cur?.scrollIntoView({ inline: "center", block: "nearest" });
    },
  };
}

// ---------------------------------------------------------------- review
export async function reviewView(modId) {
  const [mod, review] = await Promise.all([data.module(modId), data.review(modId)]);
  const set = `${modId}-review`;
  const html = `
    <div class="wrap block">
      ${crumbs([{ label: "Ruta", href: "ruta" }, { label: "B1.1" }, { label: `Módulo ${pad(mod.n)}`, href: modId }, { label: "Repaso" }])}
      <header class="block-head"><span class="eyebrow">Repaso del módulo</span><h1 style="font-size:var(--s-2xl)" class="en">${esc(review.title)}</h1><p class="lead">${esc(review.intro)}</p></header>
      <div data-score>${resultCard(set, review.items.length)}</div>
      <div class="practice narrow">${review.items.map((it, i) => renderItem(it, i, set)).join("")}</div>
      <div data-final></div>
      <nav class="block-nav"><a class="btn ghost" href="#${esc(modId)}">${icon.arrowL}<span>Volver al módulo</span></a><a class="btn ghost" href="#ruta"><span>Ver la ruta completa</span>${icon.arrowR}</a></nav>
    </div>`;
  return {
    title: `Repaso · ${mod.title}`,
    html,
    mount(root) {
      const total = review.items.length;
      const refresh = () => {
        const sc = store.score(set);
        root.querySelector("[data-score]").innerHTML = sc.answered < total ? resultCard(set, total) : "";
        root.querySelector("[data-final]").innerHTML = sc.answered >= total ? resultCard(set, total, { onRetryLabel: "Repetir el repaso" }) : "";
      };
      mountItems(root, review.items, set, refresh);
      refresh();
    },
  };
}

// ---------------------------------------------------------------- method
export async function methodView() {
  const [course, mod] = await Promise.all([data.course(), data.module("m01")]);
  const legend = Object.entries(ALERTS).map(([type, a]) => alertHTML({ type, text: ALERT_TEXT[type] || "" })).join("");
  const html = `
    <div class="wrap stack-lg" style="padding-top:28px">
      <header class="section-head"><span class="eyebrow">Metodología</span><h1 style="font-size:var(--s-2xl)">Cómo funciona la Banda B</h1><p class="lead">Tres enfoques con respaldo empírico (Enfoque Léxico, Descubrimiento Guiado y TBLT) más una capa correctiva propia para hispanohablantes: el Anclaje Fonético Hispanohablante.</p></header>

      <section class="stack"><h3>Los cuatro pilares</h3><div class="pillars">${course.method.map((m, i) => `<div class="pillar"><span class="k" aria-hidden="true">${["<mark>on track</mark>", "?", "→", "/ə/"][i]}</span><h4>${esc(m.name)}</h4><p>${esc(m.text)}</p></div>`).join("")}</div></section>

      <section class="stack"><div class="section-head"><h3>La lección en seis bloques</h3><p>La matriz atómica de cuatro bloques del diseño curricular (input léxico, descubrimiento, fonética y tarea), con la consolidación y la práctica desplegadas como pasos propios.</p></div>
        <div class="matrix">${mod.blocks.map((b) => `<div class="cell"><span class="n">${b.n}</span><h4>${esc(b.name)}</h4><p>${esc(b.text)}</p></div>`).join("")}</div></section>

      <section class="stack"><div class="section-head"><h3>Tres registros, tres grupos de voces</h3><p>El error más frecuente del hispanohablante intermedio es de registro: demasiado informal en contextos profesionales, o al revés. Por eso cada mensaje se presenta en tres niveles, y cada nivel tiene sus propias voces.</p></div>
        <div class="grid-3">${["casual", "neutral", "formal"].map((lv) => `<div class="panel stack reg-${lv}"><div class="row" style="justify-content:space-between"><b style="color:var(--reg)">${REG[lv].label}</b>${regMeter(lv)}</div><p class="small muted">${REG_TEXT[lv]}</p></div>`).join("")}</div></section>

      <section class="stack"><div class="section-head"><h3>Alertas del AFH</h3><p>Cada término del glosario fonético lleva una o varias alertas que anticipan el error antes de que ocurra.</p></div><div class="legend">${legend}</div></section>

      <section class="stack"><div class="section-head"><h3>Desvanecimiento del andamiaje</h3><p>El apoyo es temporal. Al cruzar el umbral hacia B2.1 (hora 121), el sistema retira la muleta del español y las opciones múltiples.</p></div>
        <div class="fade-table-wrap"><table class="fade-table"><thead><tr><th>Dimensión</th><th>B1 (horas 1–120)</th><th>B2 (horas 121–270)</th></tr></thead><tbody>
          <tr><td>Idioma de las instrucciones</td><td>Híbrido español / inglés para reducir la carga cognitiva.</td><td>100 % en inglés. El español queda solo en el AFH y la autoevaluación.</td></tr>
          <tr><td>Descubrimiento guiado</td><td>Preguntas con opciones y corrección inmediata.</td><td>Preguntas abiertas y organizadores semicompletos: tú escribes la regla.</td></tr>
          <tr><td>Glosarios</td><td>Equivalentes en español.</td><td>Definiciones por contexto, sinónimos y diccionario monolingüe.</td></tr>
          <tr><td>Tareas</td><td>Plantillas de frases (sentence frames).</td><td>Palabras clave y un esquema general.</td></tr>
          <tr><td>Autoevaluación</td><td>Lista de control mecánica.</td><td>Calibración metacognitiva del impacto social de la lengua.</td></tr>
        </tbody></table></div></section>

      ${gateHTML(course.gate)}

      <section class="panel stack"><h3>Tu progreso</h3><p class="small muted">El progreso, tus textos y tus respuestas se guardan solo en este navegador. Nada se envía a ningún servidor.</p><div class="row" data-reset-zone><button type="button" class="btn ghost small" data-reset-ask>Borrar mi progreso</button></div></section>
    </div>`;
  return {
    title: "Método · Banda B",
    html,
    mount(root) {
      root.addEventListener("click", (ev) => {
        const zone = root.querySelector("[data-reset-zone]");
        if (ev.target.closest("[data-reset-ask]")) {
          zone.innerHTML = `<span class="small">¿Seguro? Se borrarán respuestas, textos y bloques completados.</span><button type="button" class="btn small" data-reset-yes>Sí, borrar</button><button type="button" class="btn ghost small" data-reset-no>Cancelar</button>`;
        } else if (ev.target.closest("[data-reset-yes]")) {
          store.reset();
          zone.innerHTML = `<span class="chip ok">Progreso borrado</span>`;
          toast("Progreso borrado");
        } else if (ev.target.closest("[data-reset-no]")) {
          zone.innerHTML = `<button type="button" class="btn ghost small" data-reset-ask>Borrar mi progreso</button>`;
        }
      });
    },
  };
}

const REG_TEXT = {
  casual: "Amistades, chats y mensajes de voz. Phrasal verbs, idioms y elipsis del sujeto. Voces: Maya y Leo (EE. UU.).",
  neutral: "Coordinación diaria con compañeros, profesores o familia. Correcto y claro en casi cualquier contexto. Voces: Alex, Sarah y Ryan (EE. UU.).",
  formal: "Correos institucionales, informes y atención al cliente. Pasivas, sin contracciones. Voces: Emma y George (Reino Unido).",
};

const ALERT_TEXT = {
  "s-cluster": "No añadas una /e/ de apoyo antes de s + consonante: *strategy*, no «estrategy».",
  stress: "Dónde cae la fuerza de la palabra. Suele ser distinta del cognado español.",
  vowel: "Vocales que no existen en español: largas, cortas, centrales y diptongos.",
  linking: "Une la consonante final con la vocal siguiente: *sorted‿out*.",
  consonant: "Consonantes difíciles: /v/ labiodental, /dʒ/, /ð/, /z/ sonora, /h/ aspirada.",
  ed: "El sufijo -ed suena /t/, /d/ o /ɪd/; solo añade sílaba tras t o d.",
  flap: "En EE. UU., la t entre vocales suena como la r suave de «pero».",
  weak: "Palabras funcionales que se reducen a schwa: *to* → /tə/.",
  silent: "Letras que se escriben pero no se pronuncian: la k de *knock*.",
  variant: "Diferencias entre la pronunciación estadounidense y la británica.",
  spelling: "Trampas ortográficas por influencia del español.",
};
