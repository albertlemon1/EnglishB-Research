// Page-level views. Each returns { title, html, mount? }.
// Nothing here is tied to a particular module: every view reads the module's own
// metadata (sublevel, numbering, cast, review) through data.js.
import { esc, fmt, icon, playBtn, avatar, regMeter, REG, ALERTS, toast } from "./ui.js";
import { data } from "./data.js";
import { store } from "./store.js";
import { audio } from "./audio.js";
import { BLOCKS, RENDER, MOUNT, alertHTML } from "./blocks.js";
import { renderItem, mountItems, resultCard } from "./exercises.js";
import { t, setLang } from "./strings.js";

const pad = (n) => String(n).padStart(2, "0");
const lessonKey = (mod, l) => `${mod}-${l}`;

function lessonProgress(mod, lessonId) {
  return store.blocksDone(lessonKey(mod, lessonId)) / BLOCKS.length;
}

function lessonDone(mod, lessonId) {
  return store.isBlockDone(lessonKey(mod, lessonId), "task");
}

function nextBlockRoute(mod, lessonId) {
  const lk = lessonKey(mod, lessonId);
  const b = BLOCKS.find((x) => !store.isBlockDone(lk, x.id)) || BLOCKS[0];
  return `${lk}-${b.id}`;
}

function crumbs(items) {
  return `<nav class="crumbs" aria-label="Ruta de navegación">${items.map((it, i) => (it.href ? `<a href="#${esc(it.href)}">${esc(it.label)}</a>` : `<span>${esc(it.label)}</span>`) + (i < items.length - 1 ? '<span aria-hidden="true">›</span>' : "")).join("")}</nav>`;
}

// Completed lessons across every published module, in course order.
async function progressSummary() {
  const all = await data.modules();
  const modules = await Promise.all(Object.values(all).map(async (info) => {
    const mod = await data.module(info.id);
    const done = mod.lessons.filter((l) => lessonDone(info.id, l)).length;
    return { info, mod, done };
  }));
  modules.sort((a, b) => a.info.n - b.info.n);
  const bySublevel = {};
  let total = 0;
  for (const m of modules) {
    bySublevel[m.info.sublevel] = (bySublevel[m.info.sublevel] || 0) + m.done;
    total += m.done;
  }
  return { modules, bySublevel, total };
}

// The band: 270 hours as four proportional segments with one tick per module.
function bandHTML(course, summary, { link = false, current = null } = {}) {
  const segs = course.sublevels.map((s) => {
    const total = s.modules.reduce((n, m) => n + m.lessons.length, 0);
    const fill = Math.round(((summary.bySublevel[s.id] || 0) / total) * 100);
    const tag = link ? "button" : "div";
    const seg = `<${tag} ${link ? `type="button" data-scroll="${s.id}"` : ""} class="band-seg ${s.id === current ? "is-current" : ""}" style="flex:${s.hours};--fill:${fill}%;--n:${s.modules.length}" aria-label="${esc(`${s.code} ${s.name}: ${s.hours} horas, ${s.modules.length} módulos`)}"><span class="fill"></span><span class="ticks"></span><b>${esc(s.code)}</b><span class="hrs tnum">${s.hours} h</span></${tag}>`;
    const gate = s.id === course.gate.after ? `<span class="band-gate" title="${esc(course.gate.title)}"><i></i></span>` : "";
    return seg + gate;
  }).join("");
  const lessons = course.sublevels.reduce((n, s) => n + s.modules.reduce((k, m) => k + m.lessons.length, 0), 0);
  const modules = course.sublevels.reduce((n, s) => n + s.modules.length, 0);
  return `<div class="band"><div class="band-track">${segs}</div><div class="band-legend"><span>${course.totalHours} horas · ${modules} módulos · ${lessons} lecciones</span><span>◆ ${esc(course.gate.title)} (hora ${course.gate.lesson})</span><span class="tnum">${summary.total} lecciones completadas</span></div></div>`;
}

// Where the learner should go next: the last block they visited if that lesson
// isn't finished yet, otherwise the first unfinished lesson in course order.
async function nextStep(summary) {
  const all = await data.modules();
  const lm = store.last && /^(m\d\d)-(l\d{2,3})-(\w+)$/.exec(store.last);
  if (lm && all[lm[1]]) {
    const mod = await data.module(lm[1]);
    if (mod.lessons.includes(lm[2]) && !lessonDone(lm[1], lm[2])) {
      return { modId: lm[1], lessonId: lm[2], route: store.last, resume: true };
    }
  }
  for (const m of summary.modules) {
    const l = m.mod.lessons.find((x) => !lessonDone(m.info.id, x));
    if (l) return { modId: m.info.id, lessonId: l, route: nextBlockRoute(m.info.id, l), resume: false };
  }
  const lastMod = summary.modules[summary.modules.length - 1];
  const l = lastMod.mod.lessons[lastMod.mod.lessons.length - 1];
  return { modId: lastMod.info.id, lessonId: l, route: `${lastMod.info.id}-repaso`, resume: false, finished: true };
}

// ---------------------------------------------------------------- home
export async function home() {
  const [course, summary] = await Promise.all([data.course(), progressSummary()]);
  const step = await nextStep(summary);
  const all = await data.modules();
  const info = all[step.modId];
  const [mod, lessons, review] = await Promise.all([data.module(step.modId), data.allLessons(step.modId), data.review(step.modId).catch((err) => { if (err?.notFound) return null; throw err; })]);
  // In a draft module the next lesson may not be written yet: fall back to the first one that is.
  const lesson = lessons.find((x) => x && x.id === step.lessonId) || lessons.find(Boolean);
  const blockId = step.route.split("-").pop();
  const block = BLOCKS.find((b) => b.id === blockId);
  const p = lessonProgress(step.modId, lesson.id);
  const anyProgress = summary.total > 0 || Boolean(store.last);
  const eyebrow = step.finished ? "Has terminado los módulos publicados" : step.resume ? "Continúa donde lo dejaste" : anyProgress ? "Tu siguiente lección" : "Empieza aquí";
  const cta = step.finished ? "Repasar el módulo" : step.resume ? "Continuar" : p > 0 ? "Continuar la lección" : "Empezar la lección";
  const meta = step.finished
    ? `${info.code} · Módulo ${pad(info.n)} · Repaso del módulo`
    : `${info.code} · Módulo ${pad(info.n)} · Lección ${pad(lesson.n)} · Bloque: ${esc(block?.name || BLOCKS[0].name)}`;
  const pillarsKey = { lexical: "<mark>on track</mark>", discovery: "?", tblt: "→", afh: "/ə/" };
  const moduleList = summary.modules.length > 1 ? `
          <section class="stack">
            <div class="section-head"><span class="eyebrow">Módulos publicados</span><h3>Tus módulos</h3></div>
            <div class="lesson-list">${summary.modules.map((m) => moduleRow(m)).join("")}</div>
          </section>` : "";
  const html = `
    <div class="wrap">
      <section class="hero">
        <span class="eyebrow">Inglés para hispanohablantes · MCER</span>
        <h1>Banda <span class="b">B</span> <span class="range">B1 → B2</span></h1>
        <p class="lead">Un sistema de autoaprendizaje de 270 horas para superar la meseta del nivel intermedio: chunks reales en tres registros, gramática que descubres tú y una pronunciación que anticipa los errores del español.</p>
        ${bandHTML(course, summary, { current: info.sublevel })}
      </section>
      <div class="grid-2" style="margin-top:24px">
        <div class="stack-lg">
          <article class="continue">
            <span class="eyebrow">${eyebrow}</span>
            <h3 class="en">${esc(step.finished && review ? review.title : lesson.title)}</h3>
            <p class="meta">${meta}</p>
            <div class="bar" style="--w:${Math.round((step.finished ? 1 : p) * 100)}%"><i></i></div>
            <a class="btn" href="#${esc(step.route)}">${cta}${icon.arrowR}</a>
          </article>
          <section class="stack">
            <div class="section-head"><span class="eyebrow">${esc(info.code)} · Módulo ${pad(info.n)} · ${mod.hours} horas</span><h3 class="en">${esc(mod.title)}</h3></div>
            <div class="lesson-list">${lessons.map((l, i) => lessonRow(step.modId, l, i, info)).join("")}${reviewRow(step.modId, review)}</div>
            <a class="btn ghost" href="#${esc(step.modId)}">Ver el módulo completo${icon.arrowR}</a>
          </section>
          ${moduleList}
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

function lessonRow(mod, l, idx, meta) {
  // A draft module may list lessons that are not written yet.
  if (!l) return `<div class="lesson-row pending"><span class="num">${pad(meta.firstLesson + idx)}</span><span class="t"><strong class="muted">${esc(meta.meta.lessons[idx] || "")}</strong><span>Pendiente de redacción</span></span></div>`;
  const p = lessonProgress(mod, l.id);
  const done = lessonDone(mod, l.id);
  return `<a class="lesson-row ${done ? "done" : ""}" href="#${esc(lessonKey(mod, l.id))}"><span class="num">${done ? icon.check.replace("<svg", '<svg width="20" height="20"') : pad(l.n)}</span><span class="t"><strong>${esc(l.title)}</strong><span>${esc(l.titleEs)}</span></span><span class="ring" style="--v:${p.toFixed(3)}" aria-label="${Math.round(p * 100)}% completado"><span>${Math.round(p * 6)}/6</span></span></a>`;
}

function reviewRow(modId, review) {
  if (!review) return "";
  const set = `${modId}-review`;
  const total = review.items.length;
  const sc = store.score(set);
  return `<a class="lesson-row" href="#${esc(modId)}-repaso"><span class="num">R</span><span class="t"><strong>${esc(review.title)}</strong><span>${esc(review.titleEs)} · ${total} preguntas</span></span><span class="chip ${sc.answered ? "ok" : ""} tnum">${sc.answered ? `${sc.correct}/${total}` : total}</span></a>`;
}

function moduleRow(m) {
  const total = m.mod.lessons.length;
  const p = m.done / total;
  const done = m.done === total;
  return `<a class="lesson-row ${done ? "done" : ""}" href="#${esc(m.info.id)}"><span class="num">${done ? icon.check.replace("<svg", '<svg width="20" height="20"') : `M${pad(m.info.n)}`}</span><span class="t"><strong>${esc(m.mod.title)}</strong><span>${esc(m.info.code)} · ${esc(m.mod.titleEs)}</span></span><span class="ring" style="--v:${p.toFixed(3)}" aria-label="${m.done} de ${total} lecciones completadas"><span>${m.done}/${total}</span></span></a>`;
}

// ---------------------------------------------------------------- course map
export async function map() {
  const [course, summary, all] = await Promise.all([data.course(), progressSummary(), data.modules()]);
  let lessonStart = 0;
  const subs = course.sublevels.map((s) => {
    const first = lessonStart + 1;
    const mods = s.modules.map((m) => {
      const start = lessonStart;
      lessonStart += m.lessons.length;
      const available = Boolean(all[m.id]);
      const prog = summary.modules.find((x) => x.info.id === m.id);
      const chip = available
        ? `<span class="chip ok">${prog && prog.done ? `${prog.done}/${m.lessons.length} completadas` : "Disponible"}</span>`
        : m.gate ? '<span class="chip gate">Evaluación</span>' : '<span class="chip">En diseño</span>';
      return `
        <article class="mod ${available ? "available" : ""} ${m.gate ? "gate-mod" : ""}">
          <div class="mod-top"><span class="mod-n">M${pad(m.n)}</span>${chip}</div>
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
  const current = summary.modules.find((m) => m.done < m.mod.lessons.length)?.info.sublevel || summary.modules[0]?.info.sublevel;
  const html = `
    <div class="wrap stack-lg" style="padding-top:28px">
      <header class="section-head"><span class="eyebrow">Estructura del curso</span><h1 style="font-size:var(--s-2xl)">La ruta de la Banda B</h1><p class="lead">Cuatro subniveles en espiral: las mismas estructuras y colocaciones vuelven en contextos cada vez más complejos. Cada lección dura una hora y sigue la misma matriz de seis bloques.</p></header>
      ${bandHTML(course, summary, { link: true, current })}
      <div class="stack-lg">${subs}</div>
    </div>`;
  return { title: "La ruta · Banda B", html };
}

function gateHTML(g) {
  return `<section class="gate-card" id="sub-gate"><div class="row"><span class="chip gate">◆ Hora ${g.lesson}</span><span class="eyebrow">${esc(g.subtitle)}</span></div><h3>${esc(g.title)}</h3><p class="muted">${esc(g.format)}</p><div class="criteria">${g.criteria.map((c) => `<div><b>${esc(c.name)}</b>${esc(c.text)}</div>`).join("")}</div></section>`;
}

// ---------------------------------------------------------------- module
export async function moduleView(modId) {
  const [course, info, mod, cast, lessons, review, clips] = await Promise.all([data.course(), data.info(modId), data.module(modId), data.cast(), data.allLessons(modId), data.review(modId).catch((err) => { if (err?.notFound) return null; throw err; }), data.audio(modId)]);
  const sub = course.sublevels.find((s) => s.id === info.sublevel);
  const sample = (spk) => Object.entries(clips).find(([id, m]) => m.speaker === spk && !id.includes("-ph-"))?.[0];
  const people = mod.cast.map((id) => {
    const s = cast[id];
    return `<div class="person reg-${s.register}">${avatar(id, cast)}<div><b>${esc(s.name)} <span class="muted" style="font-weight:500">· ${esc(s.accent)}</span></b><span>${esc(s.role)} · ${esc(REG[s.register]?.short || "")}</span></div>${playBtn(sample(id), { size: "sm", label: `Escuchar la voz de ${s.name}` })}</div>`;
  }).join("");
  const cando = mod.canDo.map((c, i) => `<li class="${store.checked(`${modId}-cando`, i) ? "on" : ""}"><label style="cursor:pointer"><input type="checkbox" class="sr-only" data-cando="${i}" ${store.checked(`${modId}-cando`, i) ? "checked" : ""} id="cando-${i}">${esc(c)}</label></li>`).join("");
  const totalClips = Object.keys(clips).length;
  let swSupported = false;
  let canCache = false;
  try {
    swSupported = "serviceWorker" in navigator;
    canCache = Boolean(swSupported && navigator.serviceWorker.controller);
  } catch { swSupported = canCache = false; }
  const html = `
    <div class="wrap">
      <section class="module-hero">
        ${crumbs([{ label: "Ruta", href: "ruta" }, { label: sub.code }, { label: `Módulo ${pad(mod.n)}` }])}
        <span class="eyebrow">${esc(sub.code)} · ${esc(sub.name)} · Módulo ${pad(mod.n)} · ${mod.hours} horas</span>
        <h1 style="font-size:var(--s-2xl)">${esc(mod.title)}</h1>
        <p class="lead">${esc(mod.titleEs)}</p>
        <p class="prose muted">${esc(mod.intro)}</p>
        <div class="row">${mod.domains.map((d) => `<span class="chip">${esc(course.domains[d].name)}</span>`).join("")}${info.draft ? '<span class="chip">Borrador · audio pendiente</span>' : ""}</div>
      </section>
      <div class="grid-2" style="margin-top:20px">
        <section class="stack">
          <h3>Lecciones</h3>
          <div class="lesson-list">${lessons.map((l, i) => lessonRow(modId, l, i, info)).join("")}${reviewRow(modId, review)}</div>
        </section>
        <aside class="stack">
          <div class="panel stack"><span class="eyebrow">Al terminar podrás… (toca para autoevaluarte)</span><ul class="cando">${cando}</ul></div>
          <div class="panel stack small"><div><span class="eyebrow">Gramática</span><p>${esc(mod.focus.grammar)}</p></div><div><span class="eyebrow">Léxico</span><p class="en">${esc(mod.focus.lexis)}</p></div><div><span class="eyebrow">Fonética (AFH)</span><p>${esc(mod.focus.afh)}</p></div></div>
        </aside>
      </div>
      <section class="stack" style="margin-top:32px">
        <div class="section-head"><h3>Las voces del módulo</h3><p>${mod.cast.length} voces neuronales, cada una asignada a un registro y un contexto. Toca para escuchar una muestra.</p></div>
        <div class="cast">${people}</div>
      </section>
      <div data-offline-slot>${canCache ? offlinePanelHTML(totalClips) : ""}</div>
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
      wireOfflinePanel(root, modId);
      // The service worker often finishes installing and claiming this page a
      // beat after the first paint. Without this, a first-ever visit that lands
      // directly on a module page never shows the download button, even though
      // offline support is ready moments later.
      if (!canCache && swSupported) {
        const onControlled = () => {
          if (!document.body.contains(root) || root.querySelector("[data-cache-audio]")) return;
          const slot = root.querySelector("[data-offline-slot]");
          if (!slot) return;
          slot.innerHTML = offlinePanelHTML(totalClips);
          wireOfflinePanel(root, modId);
        };
        navigator.serviceWorker.addEventListener("controllerchange", onControlled, { once: true });
        navigator.serviceWorker.ready.then(() => { if (navigator.serviceWorker.controller) onControlled(); }).catch(() => {});
      }
    },
  };
}

function offlinePanelHTML(totalClips) {
  return `<section class="panel offline" style="margin-top:24px" data-offline><div class="row" style="justify-content:space-between"><div><b>Usar sin conexión</b><p class="small muted">Guarda las lecciones y los ${totalClips} audios del módulo en este dispositivo.</p></div><button type="button" class="btn ghost small" data-cache-audio>${icon.download}<span>Descargar audios</span></button></div><div class="progress-line" hidden><i></i></div></section>`;
}

// Fetching through the page lets the service worker store each response: the
// module's JSON files (network-first cache) and every clip (cache-first).
function wireOfflinePanel(root, modId) {
  root.querySelector("[data-cache-audio]")?.addEventListener("click", async (ev) => {
    const btn = ev.currentTarget;
    btn.disabled = true;
    const bar = root.querySelector("[data-offline] .progress-line");
    bar.hidden = false;
    const files = await data.moduleFiles(modId);
    const urls = [...files, ...Object.keys(audio.clips(modId)).map((id) => audio.url(id))];
    let n = 0;
    for (let i = 0; i < urls.length; i += 6) {
      await Promise.all(urls.slice(i, i + 6).map((u) => fetch(u).then((r) => { if (r.ok) n++; }).catch(() => {})));
      bar.style.setProperty("--w", `${Math.round((n / urls.length) * 100)}%`);
    }
    btn.querySelector("span").textContent = n === urls.length ? "Audios guardados" : `${n}/${urls.length} guardados`;
    toast(n === urls.length ? "Módulo disponible sin conexión" : "Algunos archivos no se pudieron guardar");
  });
}

// ---------------------------------------------------------------- lesson (overview + blocks)
export async function lessonView(modId, lessonId, blockId) {
  const [info, mod, cast, lesson] = await Promise.all([data.info(modId), data.module(modId), data.cast(), data.lesson(modId, lessonId), data.audio(modId)]);
  setLang(info.ui);
  const lk = lessonKey(modId, lessonId);
  const idx = mod.lessons.indexOf(lessonId);
  const nextLesson = mod.lessons[idx + 1];
  const next = nextLesson ? { route: lessonKey(modId, nextLesson), label: t("lesson.nextLesson", { n: pad(lesson.n + 1) }) } : { route: `${modId}-repaso`, label: t("lesson.review") };

  const stepper = (active) => `<nav class="stepper" aria-label="${esc(t("lesson.stepperLabel"))}" data-stepper><div class="wrap"><ol>${BLOCKS.map((b, i) => `<li><a href="#${lk}-${b.id}" class="${store.isBlockDone(lk, b.id) ? "done" : ""}" ${active === b.id ? 'aria-current="step"' : ""}><span class="n">${store.isBlockDone(lk, b.id) ? "✓" : i + 1}</span><span class="lbl">${esc(b.short)}</span></a></li>`).join("")}</ol></div></nav>`;

  const head = `
    <div class="wrap lesson-head">
      ${crumbs([{ label: t("lesson.route"), href: "ruta" }, { label: info.code }, { label: t("lesson.module", { n: pad(mod.n) }), href: modId }, { label: t("lesson.n", { n: pad(lesson.n) }), href: blockId ? lk : null }])}
      <h1>${esc(lesson.title)}</h1>
      ${blockId ? "" : `<p class="es">${esc(lesson.titleEs)}</p>`}
    </div>`;

  if (!blockId) {
    const firstOpen = nextBlockRoute(modId, lessonId);
    const html = `
      ${head}
      ${stepper(null)}
      <div class="wrap block">
        <div class="row"><span class="chip">${esc(t("lesson.ofCourse", { n: pad(lesson.n), total: 270 }))}</span><span class="chip tnum">${esc(t("lesson.min", { n: lesson.minutes }))}</span><span class="chip accent wraps">${esc(lesson.focus.grammar)}</span></div>
        <div class="objectives">
          <div class="panel stack"><span class="eyebrow">${esc(t("lesson.objectives"))}</span><ul class="cando">${lesson.canDo.map((c) => `<li>${fmt(c)}</li>`).join("")}</ul></div>
          <div class="stack">
            <div class="warmup"><span class="eyebrow">${esc(t("lesson.warmup"))}</span><p>${fmt(lesson.warmup)}</p></div>
            <div class="panel tight stack small"><div><span class="eyebrow">${esc(t("lesson.lexis"))}</span><p class="en">${esc(lesson.focus.lexis)}</p></div><div><span class="eyebrow">${esc(t("lesson.phon"))}</span><p>${esc(lesson.focus.afh)}</p></div></div>
          </div>
        </div>
        <section class="stack">
          <h3>${esc(t("lesson.blocks"))}</h3>
          <div class="blocks-overview">${BLOCKS.map((b, i) => `<a class="bo ${store.isBlockDone(lk, b.id) ? "done" : ""}" href="#${lk}-${b.id}"><span class="eyebrow"><span>${esc(t("lesson.block", { n: i + 1 }))}</span>${store.isBlockDone(lk, b.id) ? "<span>✓</span>" : ""}</span><b>${esc(b.name)}</b><span>${esc(mod.blocks[i]?.text || "")}</span></a>`).join("")}</div>
        </section>
        <div class="row"><a class="btn" href="#${esc(firstOpen)}">${esc(lessonProgress(modId, lessonId) > 0 ? t("lesson.continue") : t("lesson.start"))}${icon.arrowR}</a></div>
      </div>`;
    return { title: `${lesson.title} · Banda B`, html };
  }

  const bi = BLOCKS.findIndex((b) => b.id === blockId);
  const prev = bi > 0 ? { route: `${lk}-${BLOCKS[bi - 1].id}`, label: BLOCKS[bi - 1].short } : { route: lk, label: t("lesson.prevObjectives") };
  const after = bi < BLOCKS.length - 1 ? BLOCKS[bi + 1] : null;
  const ctx = { mod, lesson, cast, lk, next, modId };
  const html = `
    ${head}
    ${stepper(blockId)}
    <div class="wrap block" data-block="${blockId}">
      ${RENDER[blockId](ctx)}
      <nav class="block-nav" aria-label="${esc(t("lesson.blockNavLabel"))}">
        <a class="btn ghost" href="#${esc(prev.route)}">${icon.arrowL}<span>${esc(prev.label)}</span></a>
        ${after ? `<a class="btn" href="#${lk}-${after.id}" data-complete-block="${blockId}"><span>${esc(t("lesson.next", { name: after.short }))}</span>${icon.arrowR}</a>` : `<a class="btn ghost" href="#${esc(modId)}"><span>${esc(t("lesson.backToModule"))}</span></a>`}
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
  const [info, mod, review] = await Promise.all([data.info(modId), data.module(modId), data.review(modId), data.audio(modId)]);
  setLang(info.ui);
  const set = `${modId}-review`;
  const html = `
    <div class="wrap block">
      ${crumbs([{ label: t("lesson.route"), href: "ruta" }, { label: info.code }, { label: t("lesson.module", { n: pad(mod.n) }), href: modId }, { label: t("review.crumb") }])}
      <header class="block-head"><span class="eyebrow">${esc(t("review.eyebrow"))}</span><h1 style="font-size:var(--s-2xl)" class="en">${esc(review.title)}</h1><p class="lead">${esc(review.intro)}</p></header>
      <div data-score>${resultCard(set, review.items.length)}</div>
      <div class="practice narrow">${review.items.map((it, i) => renderItem(it, i, set)).join("")}</div>
      <div data-final></div>
      <nav class="block-nav"><a class="btn ghost" href="#${esc(modId)}">${icon.arrowL}<span>${esc(t("review.back"))}</span></a><a class="btn ghost" href="#ruta"><span>${esc(t("review.route"))}</span>${icon.arrowR}</a></nav>
    </div>`;
  return {
    title: `${t("review.title")} · ${mod.title}`,
    html,
    mount(root) {
      const total = review.items.length;
      const refresh = () => {
        const sc = store.score(set);
        root.querySelector("[data-score]").innerHTML = sc.answered < total ? resultCard(set, total) : "";
        root.querySelector("[data-final]").innerHTML = sc.answered >= total ? resultCard(set, total, { onRetryLabel: t("review.retry") }) : "";
      };
      mountItems(root, review.items, set, refresh);
      refresh();
    },
  };
}

// ---------------------------------------------------------------- method
export async function methodView() {
  const [course, cast, all] = await Promise.all([data.course(), data.cast(), data.modules()]);
  const mod = await data.module(Object.keys(all)[0]);
  const legend = Object.entries(ALERTS).map(([type, a]) => alertHTML({ type, text: ALERT_TEXT[type] || "" })).join("");
  const voices = (lv) => Object.values(cast).filter((s) => s.register === lv).map((s) => `${s.name} (${s.accent})`).join(", ");
  const html = `
    <div class="wrap stack-lg" style="padding-top:28px">
      <header class="section-head"><span class="eyebrow">Metodología</span><h1 style="font-size:var(--s-2xl)">Cómo funciona la Banda B</h1><p class="lead">Tres enfoques con respaldo empírico (Enfoque Léxico, Descubrimiento Guiado y TBLT) más una capa correctiva propia para hispanohablantes: el Anclaje Fonético Hispanohablante.</p></header>

      <section class="stack"><h3>Los cuatro pilares</h3><div class="pillars">${course.method.map((m, i) => `<div class="pillar"><span class="k" aria-hidden="true">${["<mark>on track</mark>", "?", "→", "/ə/"][i]}</span><h4>${esc(m.name)}</h4><p>${esc(m.text)}</p></div>`).join("")}</div></section>

      <section class="stack"><div class="section-head"><h3>La lección en seis bloques</h3><p>La matriz atómica de cuatro bloques del diseño curricular (input léxico, descubrimiento, fonética y tarea), con la consolidación y la práctica desplegadas como pasos propios.</p></div>
        <div class="matrix">${mod.blocks.map((b) => `<div class="cell"><span class="n">${b.n}</span><h4>${esc(b.name)}</h4><p>${esc(b.text)}</p></div>`).join("")}</div></section>

      <section class="stack"><div class="section-head"><h3>Tres registros, tres grupos de voces</h3><p>El error más frecuente del hispanohablante intermedio es de registro: demasiado informal en contextos profesionales, o al revés. Por eso cada mensaje se presenta en tres niveles, y cada nivel tiene sus propias voces.</p></div>
        <div class="grid-3">${["casual", "neutral", "formal"].map((lv) => `<div class="panel stack reg-${lv}"><div class="row" style="justify-content:space-between"><b style="color:var(--reg)">${REG[lv].label}</b>${regMeter(lv)}</div><p class="small muted">${REG_TEXT[lv]} Voces: ${esc(voices(lv))}.</p></div>`).join("")}</div></section>

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
  casual: "Amistades, chats y mensajes de voz. Phrasal verbs, idioms y elipsis del sujeto.",
  neutral: "Coordinación diaria con compañeros, profesores o familia. Correcto y claro en casi cualquier contexto.",
  formal: "Correos institucionales, informes y atención al cliente. Pasivas, sin contracciones.",
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
  silent: "Letras que se escriben pero no se pronuncian: la k de *knock*, la h de *honest*.",
  intonation: "La melodía cambia el mensaje: ↗ al final pregunta de verdad; ↘ busca acuerdo o confirma.",
  variant: "Diferencias entre la pronunciación estadounidense y la británica.",
  spelling: "Trampas ortográficas por influencia del español.",
};
