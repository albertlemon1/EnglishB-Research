// Shared rendering helpers: escaping, inline markup, icons, small components.

export const esc = (s = "") => String(s)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

// Course markup: {{chunk}} → highlighter, **strong**, *English in Spanish text*.
export function fmt(text = "", { gloss = null } = {}) {
  let html = esc(text);
  html = html.replace(/\{\{(.+?)\}\}/g, (_, inner) => {
    const g = gloss ? gloss(inner) : null;
    return g ? `<mark class="hl" tabindex="0" data-gloss="${esc(g.es)}" data-gloss-en="${esc(g.en)}">${inner}</mark>` : `<mark class="hl">${inner}</mark>`;
  });
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  html = html.replace(/\*(.+?)\*/g, '<em class="en">$1</em>');
  return html;
}

export const plain = (text = "") => text.replace(/\{\{|\}\}/g, "").replace(/\*\*?/g, "");

const svg = (body, extra = "") => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${body}</svg>`;
export const icon = {
  play: `<svg class="i-play" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M8 5.5v13a1 1 0 0 0 1.5.86l10.4-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z"/></svg>`,
  pause: `<svg class="i-pause" viewBox="0 0 24 24" aria-hidden="true"><rect fill="currentColor" x="6.5" y="5" width="4" height="14" rx="1.2"/><rect fill="currentColor" x="13.5" y="5" width="4" height="14" rx="1.2"/></svg>`,
  check: svg('<path d="M5 12.5l4.2 4.2L19 7"/>'),
  arrowR: svg('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  arrowL: svg('<path d="M19 12H5M11 6l-6 6 6 6"/>'),
  home: svg('<path d="M4 11l8-6 8 6v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z"/>'),
  route: svg('<circle cx="6" cy="6" r="2.4"/><circle cx="18" cy="18" r="2.4"/><path d="M8.4 6H15a3 3 0 0 1 0 6H9a3 3 0 0 0 0 6h6.6"/>'),
  book: svg('<path d="M4 5.5A1.5 1.5 0 0 1 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5A1.5 1.5 0 0 0 18.5 4H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5z"/>'),
  sun: svg('<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4L6 18M18 6l1.4-1.4"/>'),
  moon: svg('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
  auto: svg('<circle cx="12" cy="12" r="8"/><path d="M12 4v16" /><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>'),
  mic: svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/>'),
  stop: svg('<rect x="6.5" y="6.5" width="11" height="11" rx="2" fill="currentColor"/>'),
  replay: svg('<path d="M4 12a8 8 0 1 0 2.4-5.7M4 4v4.5h4.5"/>'),
  headphones: svg('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3.5" y="14" width="4.5" height="6" rx="1.5"/><rect x="16" y="14" width="4.5" height="6" rx="1.5"/>'),
  download: svg('<path d="M12 4v11M7 10.5l5 5 5-5M5 20h14"/>'),
  lock: svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
  sparkle: svg('<path d="M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z"/>'),
};

export const REG = {
  casual: { label: "Casual / social", short: "Casual", level: 1 },
  neutral: { label: "Neutro / estándar", short: "Neutro", level: 2 },
  formal: { label: "Formal / escrito", short: "Formal", level: 3 },
  model: { label: "Modelo", short: "Modelo", level: 0 },
};

export const ALERTS = {
  "s-cluster": { sym: "s+", label: "S-cluster / epéntesis" },
  stress: { sym: "ˈ", label: "Word stress" },
  vowel: { sym: "iː", label: "Vocal" },
  linking: { sym: "‿", label: "Linking" },
  consonant: { sym: "v", label: "Consonante" },
  ed: { sym: "-ed", label: "Sufijo -ed" },
  flap: { sym: "ɾ", label: "Flap T (US)" },
  weak: { sym: "ə", label: "Forma débil" },
  silent: { sym: "k̸", label: "Letra muda" },
  variant: { sym: "UK", label: "Variante" },
  spelling: { sym: "Aa", label: "Ortografía" },
};

export function playBtn(id, { size = "", label = "Escuchar", solid = false } = {}) {
  if (!id) return "";
  return `<button type="button" class="play ${size} ${solid ? "solid" : ""}" data-play="${esc(id)}" aria-label="${esc(label)}">${icon.play}${icon.pause}</button>`;
}

export function initials(name = "") { return name.slice(0, 1).toUpperCase(); }

export function avatar(speaker, cast, size = "") {
  const s = cast[speaker] || { name: "?", register: "model" };
  return `<span class="avatar ${size} reg-${s.register}" aria-hidden="true">${esc(initials(s.name))}</span>`;
}

export function regChip(level) {
  const r = REG[level] || REG.neutral;
  return `<span class="chip reg reg-${level}"><span class="dot"></span>${esc(r.short)}</span>`;
}

export function regMeter(level) {
  const n = REG[level]?.level || 0;
  return `<span class="reg-meter" aria-label="Formalidad ${n} de 3">${[1, 2, 3].map((i) => `<i class="${i <= n ? "on" : ""}"></i>`).join("")}</span>`;
}

export function fmtTime(sec = 0) {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// Deterministic pseudo-waveform for a clip id, so each voice note looks distinct.
export function waveBars(id, n = 42) {
  let h = 2166136261;
  for (const ch of id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 16777619); }
  const bars = [];
  for (let i = 0; i < n; i++) {
    h ^= h << 13; h ^= h >>> 17; h ^= h << 5;
    const r = ((h >>> 0) % 1000) / 1000;
    const env = Math.sin((i / (n - 1)) * Math.PI) * 0.55 + 0.45;
    bars.push(Math.round((0.18 + r * 0.82) * env * 100));
  }
  return `<span class="wave" data-wave="${esc(id)}" aria-hidden="true">${bars.map((v) => `<i style="--h:${v}%"></i>`).join("")}</span>`;
}

let toastTimer;
export function toast(message) {
  let el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    el.setAttribute("role", "status");
    el.setAttribute("aria-live", "polite");
    document.body.append(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

export function shuffle(list, seed = 7) {
  const a = [...list];
  let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 9301 + 49297) % 233280;
    const j = Math.floor((s / 233280) * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
