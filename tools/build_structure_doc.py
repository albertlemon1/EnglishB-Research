#!/usr/bin/env python3
"""Regenerate docs/ESTRUCTURA_BANDA_B.md from content/course.json (single source of truth)."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def main() -> None:
    c = json.loads((ROOT / "content/course.json").read_text(encoding="utf-8"))
    out: list[str] = []
    w = out.append
    w("# Estructura de la Banda B (B1–B2)\n")
    w("> Documento generado a partir de `content/course.json` con `python3 tools/build_structure_doc.py`. No lo edites a mano.\n")
    n_mod = sum(len(s["modules"]) for s in c["sublevels"])
    w(f"**{c['totalHours']} horas · {len(c['sublevels'])} subniveles · {n_mod} módulos · {c['totalHours']} lecciones de 1 hora.**\n")
    w("Cada lección sigue la misma matriz de seis bloques: Input léxico (tres registros) → Descubrimiento guiado (CCQs) → "
      "Glosario fonético dual (IPA + AFH) → Consolidación y matriz L1 → Práctica → Tarea TBLT con autoevaluación.\n")
    w("## Dominios temáticos transversales\n")
    w("| Código | Dominio | En español |\n|---|---|---|")
    for k, d in c["domains"].items():
        w(f"| {k} | {d['name']} | {d['es']} |")
    w("")
    w("## Resumen por subnivel\n")
    w("| Subnivel | Horas | Módulos | Lecciones | Instrucciones |\n|---|---|---|---|---|")
    start = 1
    for s in c["sublevels"]:
        n = len(s["modules"]) * 5
        w(f"| **{s['code']}** {s['name']} | {s['hours']} | {len(s['modules'])} | {start}–{start + n - 1} | {s['instructions']} |")
        start += n
    w("")
    lesson = 0
    for s in c["sublevels"]:
        w(f"## {s['code']} · {s['name']} ({s['nameEs']}) — {s['hours']} h\n")
        w(f"- **Gramática (EGP):** {s['focus']['grammar']}")
        w(f"- **Léxico y pragmática (EVP):** {s['focus']['lexis']}")
        w(f"- **Foco fonético (AFH):** {s['focus']['afh']}")
        w(f"- **Andamiaje:** {s['scaffolding']}\n")
        for m in s["modules"]:
            status = {"available": " — ✅ contenido y audios disponibles", "draft": " — 📝 contenido listo, audio pendiente"}.get(m.get("status"), "")
            doms = ", ".join(c["domains"][d]["name"] for d in m["domains"])
            w(f"### M{m['n']:02d} · {m['title']}{status}\n")
            w(f"*{doms}* · Gramática: {m['grammar']} · AFH: {m['afh']}\n")
            for t in m["lessons"]:
                lesson += 1
                w(f"{lesson}. {t}")
            w("")
        if s["id"] == c["gate"]["after"]:
            g = c["gate"]
            w(f"### ◆ {g['title']} — {g['subtitle']} (hora {g['lesson']})\n")
            w(f"{g['format']}\n")
            for cr in g["criteria"]:
                w(f"- **{cr['name']}:** {cr['text']}")
            w("")
    (ROOT / "docs/ESTRUCTURA_BANDA_B.md").write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"docs/ESTRUCTURA_BANDA_B.md · {lesson} lecciones")


if __name__ == "__main__":
    main()
