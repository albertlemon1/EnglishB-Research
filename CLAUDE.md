# CLAUDE.md — Curso de inglés Banda B (B1–B2)

Contexto para retomar el proyecto en una sesión nueva. Léelo entero antes de tocar nada; el `README.md` amplía cómo ejecutar, desplegar y regenerar audios.

## Qué es

App de autoaprendizaje para hispanohablantes, Banda B del MCER: 270 h en cuatro subniveles (B1.1 60 h, B1.2 60 h, B2.1 75 h, B2.2 75 h), 54 módulos, 270 lecciones. La estructura completa está en `content/course.json` (fuente única); `docs/ESTRUCTURA_BANDA_B.md` se genera desde ahí.

**Estado (2026-11-10):** publicados con audio los Módulos 1 a 6: l01–l05 (233 audios), l06–l10 (248), l11–l15 (231), l16–l20 (235), l21–l25 (231) y l26–l30 (235), en total 1413 clips. Se descartó ElevenLabs: el usuario prefiere no tocar la canalización de Kokoro, que ya resuelve fonemas forzados, versión lenta, entonación medida y control de calidad. El usuario valora mucho el WER bajo (0,12 en el Módulo 5): mantenlo.

**Flujo de trabajo por módulo (acordado con el usuario):** se hace un módulo cada vez y se hace push al terminarlo.
- Si el usuario pide **solo el texto**, el módulo entra como `"status": "draft"` (huecos de audio puestos, sin MP3) y lo revisa con `?borrador`. Los audios se generan cuando lo pida, y entonces pasa a `"available"`.
- Si pide **texto y audio** (como en los Módulos 5 y 6), se hace todo en una pasada: texto → verificación de fonemas con misaki → generación con Kokoro → `qa_audio.py` → Playwright → `"available"`.
- Abre el PR solo cuando el usuario lo pida.

**Siguiente: Módulo 7**, «Media, Culture & Personal Preferences» (l31–l35; gramática: comparativos y superlativos, adjetivos -ed / -ing y too / enough; AFH: acento sustantivo / verbo, como *REcord / reCORD*).

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

- Rutas hash: `#inicio`, `#ruta`, `#metodo`, `#m02`, `#m02-l06`, `#m02-l06-lexical`, `#m02-repaso`. La app es independiente del módulo: un módulo aparece al marcarlo `"status": "available"` en `course.json`. Los módulos `"draft"` (texto sin audio) solo se ven con `?borrador` (p. ej. `index.html?borrador#m04`); allí los botones de audio muestran «Audio pendiente».
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

Rutas: `content/<subnivel>/<módulo>/`, con `module.json`, `lNN.json` (número **global** de lección) y `review.json`; audios en `audio/<subnivel>/<módulo>/` más `manifest.json`. **Usa `content/b1-1/m06/` o `m05/` como plantilla general** (los más recientes; no usan `tone`; el 4 y el 6 tienen `variants` sin tono para contrastes de acento y de sonido, como *yet / jet*) y `m02/` cuando necesites tipos que el 3 no tiene: `intonation`, `variants` (tags con `tone`) y un modelo de tarea con diálogo (`lines[]`). El Módulo 1 es el más sencillo.

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
- `task`: `{title, format: voice|text|email, scenario, brief, input? (solo el examen de mediación), steps, length, minWords, frames, chunks[{label, re}], checks[], extra, model{parts[]}, selfCheck}`.
  - `checks` apunta a funciones de `assets/js/checks.js`; si añades una, pruébala con frases correctas e incorrectas.

Reglas de redacción:

- Marcado en línea: `{{chunk}}` resalta, `**negrita**`, `*inglés dentro del español*`. **Nunca dejes espacio antes de una contracción**: `I{{'ve lived}}`, no `I {{'ve lived}}` (el validador lo detecta).
- Los IDs de audio son **únicos en todo el curso**. Los del repaso llevan prefijo de módulo (`m07-rv-…` en el próximo).
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
| Daniel | `bm_daniel` | Soporte técnico, formal UK (desde el Módulo 3) |
| Emma | `bf_emma` | Formal UK y modelo de pronunciación británica |
| George | `bm_george` | Formal UK |
| Priya | `af_aoede` | Neutro, canadiense |
| Oliver | `bm_fable` | Neutro UK |
| Grace | `af_nova` | Neutro US; atención al cliente de la compañía de internet (desde el Módulo 4) |
| Hannah (Dr Hannah Ward) | `bf_isabella` | Formal UK; médica de familia de Sarah (desde el Módulo 5) |
| Sophie (Sophie Bennett) | `bf_lily` | Formal UK; recepcionista del hotel de Edimburgo (desde el Módulo 6) |

Los personajes nuevos se añaden a `cast.json` y a `cast` del `module.json`. El Módulo 3 añadió a Daniel (soporte técnico interno de la empresa de Priya), el Módulo 4 a Grace (compañía de internet), el Módulo 5 a la doctora Hannah Ward (médica de familia) y el Módulo 6 a Sophie (recepcionista del hotel de Edimburgo). Oliver creció en Edimburgo y allí vive su familia; Maya trabaja en una agencia de viajes. George atiende en la tienda de electrónica de las lecciones 18 y 20. No le des a un personaje dos trabajos incompatibles.

## Audio: generación y control de calidad

El modelo TTS no está en el repositorio; en un contenedor nuevo hay que reinstalarlo (Hugging Face está bloqueado, se descarga de GitHub releases):

```bash
pip install kokoro-onnx soundfile spacy regex pocketsphinx praat-parselmouth
pip install --no-deps misaki==0.7.4 num2words
pip install https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
# guárdalos en el scratchpad, no en el repo:
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin

python3 tools/tts/generate_audio.py --module content/b1-1/mNN --out audio/b1-1/mNN --model <onnx> --voices <bin> [--only id…] [--force] [--list]
python3 tools/tts/qa_audio.py audio/b1-1/mNN            # inteligibilidad (ASR offline, WER)
python3 tools/tts/qa_audio.py audio/b1-1/mNN --tones-only
python3 tools/check_content.py                          # debe terminar en OK
python3 tools/build_structure_doc.py
```

- Kokoro-82M (ONNX) + misaki G2P (US/GB). Salida en MP3 mono a 64 kbps, normalizado a −20 dBFS. Velocidades: 0.95 por defecto, 0.92 para el coach, 0.72 para el lento y 0.9 para el dictado. Solo se regeneran los clips cuyo hash cambió.
- **Question tags:** Kokoro no sube el tono de forma fiable. Los clips con `tone` pasan por `tools/tts/intonation.py`, que impone la curva con PSOLA de Praat, la mide y falla si la tag se mueve menos de 3 semitonos en la dirección declarada.
- **No afirmes nada de un audio sin medirlo.** En el Módulo 2, una explicación decía que *Have you ever…?* sube, y la medición mostró que bajaba; se retiró. Si el contenido dice «sube» o «baja», el audio tiene que hacerlo.
- **Elegir voz para un personaje nuevo:** antes de generar, sintetiza 10–15 de sus frases con las voces candidatas del mismo género y acento, y elige la de menor WER. En el Módulo 6, `bf_alice` daba 0,28 y `bf_lily` 0,22 en las mismas frases de Sophie. Entre las voces UK femeninas, `bf_emma` es la más inteligible, pero ya es de Emma.
- PocketSphinx da falsos positivos en frases muy cortas y en voces UK: compara con otra voz antes de reasignar. `am_puck` (Leo) es la voz que peor puntúa: si un clip suyo falla y con `am_michael` no, reformula la frase (en el Módulo 3, *tap* → *press*). Si un clip no se entiende, cambia la voz o el `tts`.
- Si un override de fonemas suena mal, cambia el override, no el texto. Ejemplo: `follow up` → `[follow](/fˈɑlO/) [up](/ˈʌp/)`.
- misaki no aplica las reducciones del habla rápida que enseñan las lecciones: lee *every* y *interesting* con todas sus sílabas, *have to* con /v/, *overwhelmed* con «hw», *anxious* sin /k/ y *medicine* (UK) con tres sílabas. Cuando una alerta afirme una reducción, fuérzala en el clip de fonética (`ttsUs` / `ttsUk`) y en el ejemplo (`tts`). Desde el Módulo 5, *have to / has to* se fuerzan a /hæf tə/ y /hæs tə/ en todos los clips, y desde el 6 también *every* a /ˈɛvɹi/, con el post-proceso descrito en el README. Mantén esa coherencia entre módulos: si una lección enseña una reducción, no la contradigas en los audios de los módulos siguientes.

## Verificación antes de entregar

1. `check_content.py` OK, sin audios huérfanos ni ausentes (en los borradores solo valida el contenido y los IDs).
2. QA de audio: WER razonable y tonos correctos (no aplica a los borradores). Antes de generar, comprueba con misaki que los fonemas de cada entrada de fonética coinciden con lo que afirman el IPA y las alertas; si no, fuerza los fonemas con `ttsUs` / `ttsUk` / `tts`.
3. Recorrer con Playwright todas las rutas del módulo (con `?borrador` si es un borrador) en móvil, escritorio y modo oscuro: sin errores de consola ni desbordamiento, cada botón de audio apunta a un MP3 real y el Módulo 1 sigue funcionando (regresión).
4. Servidor local: `python3 tools/serve.py`.

## Despliegue

- **GitHub Pages:** `.github/workflows/pages.yml` ejecuta `check_content.py`, copia la app a `_site` y despliega al hacer push a `main` (o con workflow_dispatch). El entorno `github-pages` ya acepta `main`. No corre en los PR: si falla, lo verás tras fusionar. El contenedor de Claude no alcanza `github.io` (el proxy da 403), así que el sitio en vivo lo revisa el usuario en el móvil; desde aquí solo se puede consultar el estado del workflow con las herramientas de GitHub.
- **Netlify:** `netlify.toml`, sin build, publica `.`. Las reglas de headers solo admiten un comodín final (`/audio/*`).
- **Local:** `tools/serve.py`, sin caché; busca un puerto libre.

## Git

- Repositorio `albertlemon1/EnglishB-Research`, público. Rama de trabajo: la que indique la sesión (el Módulo 3 se hizo en `claude/modulo-3-inicio-akpkjk`).
- Si el PR de la rama ya está fusionado (como el del Módulo 3), reiníciala desde `main` antes de empezar: `git fetch origin main && git checkout -B <rama> origin/main`.
- Push con `git push -u origin <rama>`. No hagas force-push ni operaciones destructivas.
- Abre un PR a `main` solo cuando el usuario lo pida; el usuario lo fusiona.
- Los mensajes de commit explican el porqué de las decisiones. No pongas identificadores de modelo en commits ni PRs.
