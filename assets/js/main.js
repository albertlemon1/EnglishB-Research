// Boot, hash routing and app-wide controls (audio buttons, theme, speed, glosses).
import { icon, esc, toast } from "./ui.js";
import { audio } from "./audio.js";
import { store } from "./store.js";
import { data } from "./data.js";
import { home, map, moduleView, lessonView, reviewView, methodView } from "./views.js";

const app = document.getElementById("app");
const BLOCK_IDS = "lexical|discovery|phonetics|consolidation|practice|task";

function resolve(hash) {
  const h = hash.replace(/^#/, "");
  let m;
  if (!h || h === "inicio") return { nav: "inicio", load: () => home() };
  if (h === "ruta") return { nav: "ruta", load: () => map() };
  if (h === "metodo") return { nav: "metodo", load: () => methodView() };
  if ((m = /^(m01)$/.exec(h))) return { nav: "ruta", load: () => moduleView(m[1]) };
  if ((m = /^(m01)-repaso$/.exec(h))) return { nav: "ruta", load: () => reviewView(m[1]) };
  if ((m = new RegExp(`^(m01)-(l0[1-5])(?:-(${BLOCK_IDS}))?$`).exec(h))) return { nav: "ruta", load: () => lessonView(m[1], m[2], m[3]), lesson: true };
  return { nav: "", load: async () => ({ title: "Página no encontrada", html: `<div class="wrap block"><div class="error-box"><h3>No encontramos esa página</h3><p>El enlace puede estar incompleto. Vuelve al inicio para continuar.</p><a class="btn" href="#inicio">Ir al inicio</a></div></div>` }) };
}

let renderId = 0;
let lastRoute = null;
async function render() {
  const id = ++renderId;
  const route = resolve(location.hash);
  document.querySelectorAll("[data-nav]").forEach((a) => {
    if (a.dataset.nav === route.nav) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current");
  });
  closeGloss();
  let view;
  try {
    view = await route.load();
  } catch (err) {
    console.error(err);
    view = { title: "Error", html: `<div class="wrap block"><div class="error-box"><h3>No se pudo cargar el contenido</h3><p>Comprueba tu conexión y vuelve a intentarlo. Si abriste el archivo directamente desde el disco, sirve la carpeta con un servidor local (ver README).</p><button type="button" class="btn" onclick="location.reload()">Reintentar</button></div></div>` };
  }
  if (id !== renderId) return;
  const sameLesson = lastRoute && route.lesson && lastRoute.split("-").slice(0, 2).join("-") === location.hash.slice(1).split("-").slice(0, 2).join("-");
  const swap = () => {
    app.innerHTML = `<div class="view">${view.html}</div>`;
    view.mount?.(app.firstElementChild);
    document.title = view.title || "Banda B";
    if (sameLesson) {
      const head = app.querySelector(".lesson-head");
      const top = head ? head.getBoundingClientRect().bottom + scrollY - 64 : 0;
      if (scrollY > top) scrollTo({ top, behavior: "instant" });
    } else {
      scrollTo({ top: 0, behavior: "instant" });
    }
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (document.startViewTransition && !reduce) document.startViewTransition(swap); else swap();
  lastRoute = location.hash.slice(1);
  if (audio.playingId && !document.querySelector(`[data-play="${CSS.escape(audio.playingId)}"]`)) audio.stop();
}

// ---------------------------------------------------------------- theme + speed
const THEMES = ["system", "light", "dark"];
function applyTheme(t) {
  if (t === "system") document.documentElement.removeAttribute("data-theme");
  else document.documentElement.setAttribute("data-theme", t);
  const btn = document.querySelector("[data-theme-toggle]");
  if (btn) {
    btn.innerHTML = t === "dark" ? icon.moon : t === "light" ? icon.sun : icon.auto;
    btn.setAttribute("aria-label", `Tema: ${{ system: "automático", light: "claro", dark: "oscuro" }[t]}. Cambiar tema`);
  }
}
const SPEEDS = [1, 0.85, 0.7];
function applySpeed(s) {
  const btn = document.querySelector("[data-speed]");
  if (btn) {
    btn.textContent = `${String(s).replace(".", ",")}×`;
    btn.setAttribute("aria-label", `Velocidad de los audios: ${s}×. Cambiar velocidad`);
  }
}

// ---------------------------------------------------------------- gloss popover for chunks
let glossEl = null;
function closeGloss() { glossEl?.remove(); glossEl = null; }
function openGloss(mark) {
  closeGloss();
  glossEl = document.createElement("div");
  glossEl.className = "gloss";
  glossEl.setAttribute("role", "tooltip");
  glossEl.innerHTML = `<b>${esc(mark.dataset.glossEn)}</b>${esc(mark.dataset.gloss)}`;
  document.body.append(glossEl);
  const r = mark.getBoundingClientRect();
  const w = glossEl.offsetWidth;
  const left = Math.min(Math.max(16, r.left + scrollX + r.width / 2 - w / 2), scrollX + document.documentElement.clientWidth - w - 16);
  glossEl.style.left = `${left}px`;
  glossEl.style.top = `${r.bottom + scrollY + 8}px`;
}

// ---------------------------------------------------------------- global events
document.addEventListener("click", (ev) => {
  const play = ev.target.closest("[data-play]");
  if (play) { audio.toggle(play.dataset.play, play); return; }

  const seq = ev.target.closest("[data-seq]");
  if (seq) {
    const ids = seq.dataset.seq.split(",");
    const label = seq.querySelector("span");
    const started = audio.sequence(ids, {
      onStep: (id) => {
        document.querySelectorAll(".line.is-active").forEach((l) => l.classList.remove("is-active"));
        const line = document.querySelector(`[data-line="${CSS.escape(id)}"]`);
        line?.classList.add("is-active");
        line?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      },
      onEnd: () => {
        document.querySelectorAll(".line.is-active").forEach((l) => l.classList.remove("is-active"));
        if (label) label.textContent = "Escuchar la conversación";
      },
    });
    if (started && label) label.textContent = "Detener";
    return;
  }

  const mark = ev.target.closest("mark[data-gloss]");
  if (mark) { if (glossEl) closeGloss(); else openGloss(mark); return; }
  if (glossEl && !ev.target.closest(".gloss")) closeGloss();

  if (ev.target.closest("[data-theme-toggle]")) {
    const next = THEMES[(THEMES.indexOf(store.settings.theme) + 1) % THEMES.length];
    store.setSetting("theme", next);
    applyTheme(next);
    toast(`Tema ${{ system: "automático", light: "claro", dark: "oscuro" }[next]}`);
    return;
  }
  if (ev.target.closest("[data-speed]")) {
    const next = SPEEDS[(SPEEDS.indexOf(store.settings.speed) + 1) % SPEEDS.length] || 1;
    audio.setSpeed(next);
    applySpeed(next);
    toast(`Velocidad de audio ${String(next).replace(".", ",")}×`);
    return;
  }
  const sc = ev.target.closest("[data-scroll]");
  if (sc) { document.getElementById(`sub-${sc.dataset.scroll}`)?.scrollIntoView({ behavior: "smooth", block: "start" }); return; }

  const retry = ev.target.closest("[data-retry]");
  if (retry) { store.resetResults(retry.dataset.retry); render(); }
});
document.addEventListener("keydown", (ev) => {
  const mark = ev.target.closest?.("mark[data-gloss]");
  if (mark && (ev.key === "Enter" || ev.key === " ")) { ev.preventDefault(); openGloss(mark); }
  if (ev.key === "Escape") closeGloss();
});
addEventListener("resize", closeGloss);
addEventListener("hashchange", render);

// ---------------------------------------------------------------- boot
async function boot() {
  applyTheme(store.settings.theme || "system");
  applySpeed(store.settings.speed || 1);
  const clips = await data.manifest("m01");
  window.__manifest = clips;
  audio.setBase("audio/b1-1/m01/", clips);
  await render();
  if ("serviceWorker" in navigator && /^(https:|http:\/\/(localhost|127\.0\.0\.1))/.test(location.href)) {
    navigator.serviceWorker.register("sw.js").catch(() => { /* not available here (e.g. sandboxed preview) */ });
  }
}
boot();
