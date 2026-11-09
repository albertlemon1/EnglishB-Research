// Record-and-compare for shadowing practice. Recordings stay in memory and are never uploaded.
import { icon, toast } from "./ui.js";

let active = null; // { recorder, stream, key, chunks }
const takes = new Map(); // key -> object URL
let player = null;

export const recorderSupported = () => Boolean(navigator.mediaDevices?.getUserMedia && window.MediaRecorder);

export function recControls(key, label = "Grabar mi voz") {
  if (!recorderSupported()) return "";
  const has = takes.has(key);
  return `<div class="rec" data-rec="${key}">
    <button type="button" class="btn small ghost rec-btn" data-rec-toggle>${icon.mic}<span>${label}</span></button>
    <button type="button" class="btn small ghost" data-rec-play ${has ? "" : "hidden"}>${icon.play}<span>Escuchar mi voz</span></button>
    <span class="status" aria-live="polite"></span>
  </div>`;
}

async function start(box) {
  const key = box.dataset.rec;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream);
    const chunks = [];
    recorder.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    recorder.onstop = () => {
      stream.getTracks().forEach((t) => t.stop());
      const blob = new Blob(chunks, { type: recorder.mimeType || "audio/webm" });
      if (takes.has(key)) URL.revokeObjectURL(takes.get(key));
      takes.set(key, URL.createObjectURL(blob));
      const playBtn = box.querySelector("[data-rec-play]");
      if (playBtn) playBtn.hidden = false;
      box.querySelector(".status").textContent = "Grabación lista. Compárala con el modelo.";
    };
    recorder.start();
    active = { recorder, stream, key, box };
    const btn = box.querySelector("[data-rec-toggle]");
    btn.classList.add("is-rec");
    btn.querySelector("span").textContent = "Detener";
    box.querySelector(".status").textContent = "Grabando…";
    setTimeout(() => { if (active && active.key === key) stop(); }, 30000);
  } catch {
    box.querySelector(".status").textContent = "No se pudo usar el micrófono en este navegador o vista.";
    toast("Micrófono no disponible");
  }
}

function stop() {
  if (!active) return;
  const { recorder, box } = active;
  active = null;
  if (recorder.state !== "inactive") recorder.stop();
  const btn = box.querySelector("[data-rec-toggle]");
  btn.classList.remove("is-rec");
  btn.querySelector("span").textContent = "Grabar de nuevo";
}

export function mountRecorders(root) {
  root.addEventListener("click", (ev) => {
    const box = ev.target.closest("[data-rec]");
    if (!box) return;
    if (ev.target.closest("[data-rec-toggle]")) {
      if (active && active.key === box.dataset.rec) stop();
      else { if (active) stop(); start(box); }
    }
    if (ev.target.closest("[data-rec-play]")) {
      const url = takes.get(box.dataset.rec);
      if (!url) return;
      player?.pause();
      player = new Audio(url);
      player.play().catch(() => {});
    }
  });
}
