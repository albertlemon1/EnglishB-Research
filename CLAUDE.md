# CLAUDE.md — Curso de inglés Banda B (B1–B2)

Contexto para retomar el proyecto en una sesión nueva. Léelo entero antes de tocar nada; el `README.md` amplía cómo ejecutar, desplegar y regenerar audios.

## Qué es

App de autoaprendizaje para hispanohablantes, Banda B del MCER: 270 h en cuatro subniveles (B1.1 60 h, B1.2 60 h, B2.1 75 h, B2.2 75 h), 54 módulos, 270 lecciones. La estructura completa está en `content/course.json` (fuente única); `docs/ESTRUCTURA_BANDA_B.md` se genera desde ahí.

**Estado (2026-11-09):** publicados el Módulo 1 (l01–l05, 233 audios) y el Módulo 2 (l06–l10, 248 audios), los dos fusionados en `main` y desplegados en GitHub Pages. **Siguiente: Módulo 3**, «Everyday Technology & Digital Life» (dominio TD, lecciones l11–l15; gramática: Zero Conditional, imperativos y secuenciadores; AFH: acento en sustantivos compuestos (PASSword) y grupos sp-/st-/sk-). Solo se genera un módulo cuando el usuario lo pide.

El usuario escribe en español y revisa en el móvil. Responde en español neutro (nada de «vosotros», «os», «vuestra»).

## Metodología (del diseño curricular del usuario)

Los documentos fuente (diseño curricular, ficha del Módulo 1 y estructura de B1.1) **no están en el repositorio**, que es público; lo esencial está aquí y en `course.json`. Si hace falta un detalle que no aparece, pídeselos al usuario.

- **Enfoques:** Lexical Approach (chunks y colocaciones), Guided Discovery (Focus on Form con tres preguntas: semántica, sintáctica y pragmática) y TBLT (tareas con propósito real y Self-Check frente a un modelo comentado).
- **Matriz atómica de lección.** El diseño define cuatro bloques; la app los reparte en seis: lexical (escenario, diálogo, comprensión, **tres registros** casual / neutral / formal, chunks y quiz de registro) → discovery → phonetics (glosario dual IPA US/UK + AFH, **mínimo 4 términos**) → consolidation (estructuras y errores L1) → practice → task (tarea TBLT, modelo comentado y self-check con la matriz de errores L1).
- **AFH (Anclaje Fonético Hispanohablante):** alertas visuales que se anticipan al error del hispanohablante: s-cluster/epéntesis, confusión vocálica (/ɪ/–/iː/), /v/–/b/, linking, acento de palabra, -ed, formas débiles, etc. El respelling sigue la ortografía española (*gue* = /ɡe/, *dy* = /dʒ/, *dh* = /ð/).
- **Desvanecimiento del andamiaje:** en B1 las instrucciones son en español, las preguntas de discovery son de opción múltiple y las tareas llevan sentence frames. Desde B2.1 (hora 121) todo pasa a inglés salvo el bloque fonético y el self-check; las opciones múltiples desaparecen (el alumno redacta la regla) y las tareas solo dan palabras clave y un esquema.
- **Threshold Gate (B1.2 → B2.1):** examen de mediación. El alumno sintetiza un informe formal y un chat informal en un documento ejecutivo.

## Arquitectura de la app

SPA estática: módulos ES sin dependencias y **sin paso de build**. Es una PWA con service worker.

- Rutas hash: `#inicio`, `#ruta`, `#metodo`, `#m02`, `#m02-l06`, `#m02-l06-lexical`, `#m02-repaso`. La app es independiente del módulo: un módulo aparece al marcarlo `"status": "available"` en `course.json`.
- `assets/js/`:
  - `data.js`: registro y carga a partir de `course.json`;
  - `views.js`: inicio, ruta, módulo, lección, repaso y método;
  - `blocks.js`: los seis bloques;
  - `exercises.js`: tipos de ejercicio y corrección;
  - `checks.js`: heurísticas de la tarea (errores L1);
  - `audio.js`, `recorder.js`, `store.js` (progreso en localStorage `bandb:v1`), `ui.js`, `main.js`.
- `sw.js`: precachea solo el shell, `course.json` y `cast.json`. Las estrategias son network-first para el contenido, cache-first para los MP3 y stale-while-revalidate para las fuentes. **Sube `VERSION`** (`bandb-AAAA-MM-DD-mNN`) cuando cambien el shell o los assets.
- Diseño:
  - fuentes: Bricolage Grotesque (títulos), Atkinson Hyperlegible Next (interfaz en español) y Charis SIL (inglés e IPA);
  - colores de registro casual/neutral/formal; resaltado tipo marcador para los chunks; modo oscuro con tokens.
  - Antes de dar algo por terminado, comprueba que no haya desbordamiento horizontal en el móvil.

## Contenido

Rutas: `content/<subnivel>/<módulo>/`, con `module.json`, `lNN.json` (número **global** de lección) y `review.json`; audios en `audio/<subnivel>/<módulo>/` más `manifest.json`. **Usa `content/b1-1/m02/` como plantilla**: es el módulo más completo y ya incluye tipos que el Módulo 1 no tiene (`intonation`, `variants`, `task.input` y un modelo con diálogo).

Esquema de lección: `id`, `n`, `title`, `titleEs`, `minutes`, `summary`, `canDo[]`, `focus{grammar, lexis, afh}`, `warmup`, más los bloques:

- `lexical`:
  - `scenario{format, title, context, speaker, to, audio, text}`;
  - `dialogue{title, context, lines[]}`, `comprehension[]`;
  - `registers[{level, use, items[]}]`, `chunks[{en, es, register}]`, `registerQuiz[]`.
- `discovery`: `{intro, speaker, audio, text, questions[{kind: semantic|syntactic|pragmatic, …}], rule{points, formulas, note}}`.
- `phonetics.items[]`: `{id, term, pos, meaning, ipa{us, uk}, afh, say, sayUk?, ttsUs?, ttsUk?, variants?, alerts[{type, text}], example}`.
  - Los IDs de audio se derivan solos (`<lección>-ph-<id>-us|slow|uk|ex`).
  - Tipos de alerta: s-cluster, stress, vowel, linking, consonant, ed, flap, weak, silent, intonation, variant, spelling.
- `consolidation`: `{structures[{title, formula, usage, examples[]}], l1[{title, text, wrong, right}]}`.
- `practice[]`, con sus tipos:
  - choice (`text` con `___`), gap (`accept[]`), order (`words`/`answer`), fix (`wrong`/`accept[]`);
  - stress (`syllables`/`answer`/`audioRef`), dictation, intonation (`answer: rise|fall`).
- `task`: `{title, format: voice|text|email, scenario, brief, input?, steps, length, minWords, frames, chunks[{label, re}], checks[], extra, model{parts[]}, selfCheck}`.
  - `checks` apunta a funciones de `assets/js/checks.js`; si añades una, pruébala con frases correctas e incorrectas.

Reglas de redacción:

- Marcado en línea: `{{chunk}}` resalta, `**negrita**`, `*inglés dentro del español*`. **Nunca dejes espacio antes de una contracción**: `I{{'ve lived}}`, no `I {{'ve lived}}` (el validador lo detecta).
- Los IDs de audio son **únicos en todo el curso**. Los del repaso llevan prefijo de módulo (`m03-rv-…`).
- Cualquier clip: objeto con `speaker` + `audio` + `text`; `tts` (opcional) es el texto que se sintetiza, con fonemas forzados `[word](/fonemas/)` en notación misaki; `tone: "rise"|"fall"` solo en clips con question tag.
- Repasa el material fuente con ojo crítico. En los módulos 1 y 2 se corrigieron IPA, sílabas, ejemplos agramaticales y falsos amigos mal etiquetados (ver «Correcciones» en el README). Documenta las correcciones que hagas.
- Nombres de personajes: evita los que el fonemizador lea mal («Inês» se leyó «circumflex»). Si hace falta, añade el nombre al `LEXICON` de `generate_audio.py`. Revisa también la coherencia de las biografías entre lecciones (fechas, años).

## Voces (`content/cast.json`)

Cada voz se asocia a un registro para que el oído relacione voz y formalidad.

| Personaje | Voz | Registro y uso |
|---|---|---|
| Nora (coach) | `af_heart` | Modelos de pronunciación y gramática |
| Maya | `af_bella` | Casual |
| Leo | `am_puck` | Casual |
| Alex | `am_michael` | Neutro |
| Sarah | `af_sarah` | Neutro |
| Ryan | `am_fenrir` | Neutro; narra los textos de análisis |
| Emma | `bf_emma` | Formal UK y modelo de pronunciación británica |
| George | `bm_george` | Formal UK |
| Priya | `af_aoede` | Neutro, canadiense |
| Oliver | `bm_fable` | Neutro UK |

Los personajes nuevos se añaden a `cast.json` y a `cast` del `module.json`. El Módulo 3 (tecnología) puede reutilizar el reparto o añadir uno o dos personajes, por ejemplo soporte técnico en registro formal.

## Audio: generación y control de calidad

El modelo TTS no está en el repositorio; en un contenedor nuevo hay que reinstalarlo (Hugging Face está bloqueado, se descarga de GitHub releases):

```bash
pip install kokoro-onnx soundfile spacy regex pocketsphinx praat-parselmouth
pip install --no-deps misaki==0.7.4 num2words
pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
# guárdalos en el scratchpad, no en el repo:
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

python3 tools/tts/generate_audio.py --module content/b1-1/m03 --out audio/b1-1/m03 --model <onnx> --voices <bin> [--only id…] [--force] [--list]
python3 tools/tts/qa_audio.py audio/b1-1/m03            # inteligibilidad (ASR offline, WER)
python3 tools/tts/qa_audio.py audio/b1-1/m03 --tones-only
python3 tools/check_content.py                          # debe terminar en OK
python3 tools/build_structure_doc.py
```

- Kokoro-82M (ONNX) + misaki G2P (US/GB). Salida en MP3 mono a 64 kbps, normalizado a −20 dBFS. Velocidades: 0.95 por defecto, 0.92 para el coach, 0.72 para el lento y 0.9 para el dictado. Solo se regeneran los clips cuyo hash cambió.
- **Question tags:** Kokoro no sube el tono de forma fiable. Los clips con `tone` pasan por `tools/tts/intonation.py`, que impone la curva con PSOLA de Praat, la mide y falla si la tag se mueve menos de 3 semitonos en la dirección declarada.
- **No afirmes nada de un audio sin medirlo.** En el Módulo 2, una explicación decía que *Have you ever…?* sube, y la medición mostró que bajaba; se retiró. Si el contenido dice «sube» o «baja», el audio tiene que hacerlo.
- PocketSphinx da falsos positivos en frases muy cortas y en voces UK: compara con otra voz antes de reasignar. Si un clip no se entiende, cambia la voz o el `tts`.
- Si un override de fonemas suena mal, cambia el override, no el texto. Ejemplo: `follow up` → `[follow](/fˈɑlO/) [up](/ˈʌp/)`.

## Verificación antes de entregar

1. `check_content.py` OK, sin audios huérfanos ni ausentes.
2. QA de audio: WER razonable y tonos correctos.
3. Recorrer con Playwright todas las rutas del módulo en móvil, escritorio y modo oscuro: sin errores de consola ni desbordamiento, cada botón de audio apunta a un MP3 real y el Módulo 1 sigue funcionando (regresión).
4. Servidor local: `python3 tools/serve.py`.

## Despliegue

- **GitHub Pages:** `.github/workflows/pages.yml` ejecuta `check_content.py`, copia la app a `_site` y despliega al hacer push a `main` (o con workflow_dispatch). El entorno `github-pages` ya acepta `main`.
- **Netlify:** `netlify.toml`, sin build, publica `.`. Las reglas de headers solo admiten un comodín final (`/audio/*`).
- **Local:** `tools/serve.py`, sin caché; busca un puerto libre.

## Git

- Repositorio `albertlemon1/EnglishB-Research`, público. Rama de trabajo: `claude/english-course-band-b-module-1-fnjm7s` (salvo que la sesión indique otra).
- Si el PR de la rama ya está fusionado, reiníciala desde `main`: `git fetch origin main && git checkout -B <rama> origin/main`.
- Push con `git push -u origin <rama>`. No hagas force-push ni operaciones destructivas.
- Abre un PR a `main` solo cuando el usuario lo pida; el usuario lo fusiona.
- Los mensajes de commit explican el porqué de las decisiones. No pongas identificadores de modelo en commits ni PRs.
