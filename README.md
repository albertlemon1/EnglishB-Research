# Inglés Banda B · B1–B2 para hispanohablantes

App web de autoaprendizaje para la Banda B del MCER (270 horas, de B1.1 a B2.2). Combina Enfoque Léxico, Descubrimiento Guiado, Enseñanza Basada en Tareas (TBLT) y el **Anclaje Fonético Hispanohablante (AFH)**.

- **Estructura completa** de la Banda B: 4 subniveles, 54 módulos y 270 lecciones, con dominios temáticos, foco gramatical (EGP), léxico (EVP) y fonético (AFH) por módulo, y la prueba de transición *The Threshold Gate*. Ver [`docs/ESTRUCTURA_BANDA_B.md`](docs/ESTRUCTURA_BANDA_B.md).
- **Módulos 1 y 2 completos** (B1.1): *Personal Life, Routines & Current Projects* y *Social Interactions & Making Connections*, con 5 lecciones de 1 hora y un repaso cada uno.
- **712 audios** generados con once voces neuronales (233 del Módulo 1, 248 del Módulo 2 y 231 del Módulo 3), guardados en `audio/<subnivel>/<módulo>/` y servidos por la propia app (también sin conexión).

## Ejecutar la app

Es una app estática: HTML, CSS y JavaScript sin dependencias ni paso de compilación. Todas las rutas del proyecto son relativas, así que los mismos archivos funcionan igual en los tres entornos de abajo, estén en la raíz de un dominio o bajo una subruta. Necesita servirse por HTTP (no abrir `index.html` con doble clic) porque carga el contenido como JSON.

### En local

```bash
python3 tools/serve.py          # sirve en http://localhost:8000 (o el siguiente puerto libre) y abre el navegador
# o, el clásico, si prefieres no usar el script:
python3 -m http.server 8000
```

`tools/serve.py` desactiva la caché del navegador en cada recarga (para no ver una lección o un audio desactualizados mientras editas) y abre la pestaña automáticamente. La grabación de voz y la instalación como PWA funcionan en `localhost`; la descarga de audios para uso sin conexión y el modo offline del service worker solo se activan en un origen HTTPS real (GitHub Pages o Netlify), no en local.

### GitHub Pages

El flujo `.github/workflows/pages.yml` valida el contenido y publica la app al hacer push a `main`. Pasos de activación, una sola vez:

1. **Settings → Pages → Build and deployment → Source: GitHub Actions.**
2. Al activar Pages por primera vez, GitHub crea un entorno `github-pages` y lo restringe automáticamente a la rama que era la rama por defecto del repositorio en ese momento. Si luego publicas desde otra rama (por ejemplo, si cambias la rama por defecto a `main` más tarde), ese despliegue se rechazará en segundos con un entorno que nunca llega a ejecutar ningún paso. Para permitir `main`: **Settings → Environments → `github-pages` → Deployment branches and tags → Add deployment branch or tag rule → `main`.** Esto es más fiable que cambiar la rama por defecto del repositorio, que en algunos navegadores móviles puede fallar con "Could not change default branch".
3. Lanza la publicación una vez desde **Actions → Publicar la app en GitHub Pages → Run workflow**, eligiendo `main`.

La URL queda en `https://<usuario>.github.io/<repositorio>/`. Con Pages, la grabación de voz y la descarga de audios para uso sin conexión ya funcionan, y la app se puede instalar en el móvil como PWA.

### Netlify

No hace falta ninguna configuración manual: `netlify.toml` ya trae todo lo necesario (sin comando de build, directorio de publicación en la raíz, cabeceras de caché). Dos formas de desplegar:

- **Conectando el repositorio:** en Netlify, *Add new site → Import an existing project*, elige el repositorio; Netlify lee `netlify.toml` y despliega sin pedir nada más. Cada push a la rama que elijas se publica solo.
- **Arrastrando la carpeta:** en [app.netlify.com/drop](https://app.netlify.com/drop), arrastra la carpeta del proyecto. Útil para una prueba rápida sin conectar GitHub.

A diferencia de GitHub Pages, Netlify sirve el sitio en la raíz del dominio y no tiene el problema de rama por defecto / entorno restringido, así que publicar desde `main` funciona desde el primer despliegue.

## Qué incluye cada lección

Cada lección sigue la misma matriz de seis bloques, con navegación por pasos y progreso guardado en el navegador:

| Bloque | Contenido |
|---|---|
| 1 · Input léxico | Mensaje de voz real, conversación ampliada con reproducción continua, preguntas de comprensión, **mapa de tres registros** (casual / neutro / formal), quiz de registro y banco de chunks con traducción al tocar. |
| 2 · Descubrimiento guiado | Texto de análisis con el rasgo criterial resaltado y tres CCQs (significado, forma, uso) con corrección inmediata. La regla se desbloquea al responder. |
| 3 · Glosario fonético dual | 5 términos por lección con IPA estadounidense y británica, audio US, US lento y UK, respelling AFH, alertas (s-cluster, acento, vocal, linking, -ed, flap T…), ejemplo en contexto y **grabación de tu voz para comparar**. |
| 4 · Consolidación y L1 | Fórmula, matiz y ejemplos con audio de cada estructura + matriz de interferencias del español con pares ✕ / ✓. |
| 5 · Práctica | 9 ejercicios: elección, huecos, ordenar, corregir el error típico, acento de palabra, entonación (↗ / ↘, desde el Módulo 2) y dictado con comparación palabra a palabra. |
| 6 · Tarea TBLT | Escenario real (a veces con un mensaje de audio que hay que responder), plantillas de frases que se insertan con un toque, detección en vivo de los chunks usados, **revisión asistida de errores L1**, modelo comentado con audio y autoevaluación. |

## Voces

Cada voz está asignada a un registro y un contexto, para que el oído asocie la voz con el nivel de formalidad:

| Personaje | Voz Kokoro | Acento | Uso |
|---|---|---|---|
| Nora (coach) | `af_heart` | US | Modelos de pronunciación (normal y lento) y ejemplos de gramática |
| Maya | `af_bella` | US | Registro casual: mensajes de voz, chats, brindis |
| Leo | `am_puck` | US | Registro casual: slang, amigos |
| Alex | `am_michael` | US | Registro neutro: coordinación de planes |
| Sarah | `af_sarah` | US | Registro neutro: estudio y rutinas |
| Ryan | `am_fenrir` | US | Textos de análisis gramatical, imprevistos |
| Emma | `bf_emma` | UK | Registro formal y modelo de pronunciación británica |
| George | `bm_george` | UK | Registro formal: atención al cliente, institucional |
| Priya | `af_aoede` | CA | Registro neutro: nueva amiga de Sarah en el meetup (desde el Módulo 2) |
| Oliver | `bm_fable` | UK | Registro neutro británico: organizador del meetup (desde el Módulo 2) |
| Daniel | `bm_daniel` | UK | Registro formal: soporte técnico (TI), correos y llamadas (desde el Módulo 3) |

### Regenerar los audios

Los audios se generan sin conexión con [Kokoro-82M](https://github.com/thewh1teagle/kokoro-onnx) (ONNX) y fonemización `misaki` (US / GB), que respeta heterónimos y permite forzar pronunciaciones (por ejemplo `[progress](/pɹˈɑɡɹɛs/)` para el sustantivo). El volumen se iguala entre voces y se exporta a MP3 mono de 64 kbps.

```bash
pip install -r tools/tts/requirements.txt
pip install --no-deps misaki==0.7.4
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/kokoro-v1.0.onnx
curl -LO https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/voices-v1.0.bin
python3 tools/tts/generate_audio.py --model kokoro-v1.0.onnx --voices voices-v1.0.bin
```

El generador lee los clips directamente del contenido (`audio` + `speaker` + `text`/`tts`) y solo regenera los que cambiaron. Para otro módulo, indica las carpetas: `--module content/b1-1/m02 --out audio/b1-1/m02`. Los nombres propios que el fonemizador lee mal se corrigen una vez en el léxico de `generate_audio.py` (por ejemplo, *Priya*).

`tools/tts/qa_audio.py` hace una prueba de inteligibilidad con reconocimiento de voz offline y `tools/check_content.py` comprueba que cada audio referenciado existe, que los IDs de audio son únicos en todo el curso y que las respuestas de los ejercicios son coherentes.

#### Entonación de las question tags

Kokoro no hace subir de forma fiable el tono de una question tag terminada en «?»: medido en seis voces, la mayoría de las tags que debían subir bajaban. Como el Módulo 2 enseña que la entonación cambia el significado (↗ pregunta real, ↘ busca acuerdo), los clips cuyo contenido declara `"tone": "rise"` o `"tone": "fall"` (y los ejercicios de tipo `intonation`) pasan por `tools/tts/intonation.py`, que impone la curva solo en la tag con PSOLA de Praat (`parselmouth`) y la mide. El manifiesto guarda dónde está cada tag y cuánto se mueve, y `qa_audio.py --tones-only` lo vuelve a medir sobre los MP3 finales: una tag que no se mueve al menos 3 semitonos en la dirección declarada es un error.

## Publicar un módulo nuevo

La app no tiene nada atado a un módulo concreto: lee de `content/course.json` qué módulos están publicados.

1. Escribe el contenido en `content/<subnivel>/<módulo>/`: `module.json`, una lección por archivo con el número global (`l06.json`…`l10.json` para el Módulo 2) y `review.json`. Los IDs de audio del repaso llevan prefijo de módulo (`m02-rv-…`).
2. Si aparecen personajes nuevos, añádelos a `content/cast.json` y a la lista `cast` del módulo.
3. Marca el módulo con `"status": "available"` en `content/course.json`.
4. Genera los audios con `generate_audio.py --module … --out …` y revísalos con `qa_audio.py`.
5. Valida con `python3 tools/check_content.py` y regenera la estructura con `python3 tools/build_structure_doc.py`.

El service worker no necesita cambios: guarda el contenido de cada módulo al visitarlo, o completo con el botón «Descargar audios» de la página del módulo.

## Organización del repositorio

```
index.html, sw.js, manifest.webmanifest   App (PWA)
netlify.toml                              Config de despliegue en Netlify (sin build)
.github/workflows/pages.yml               Config de despliegue en GitHub Pages
assets/css, assets/js                     Interfaz (módulos ES, sin dependencias)
content/course.json                       Estructura completa de la Banda B
content/cast.json                         Reparto de voces
content/b1-1/m01/, m02/, m03/            Módulos 1 a 3: module.json, lecciones, review.json
audio/b1-1/m01/, m02/, m03/              233 + 248 + 231 MP3, cada uno con su manifest.json
tools/serve.py                            Servidor local de desarrollo
tools/                                    Generación y validación de audio y contenido
docs/ESTRUCTURA_BANDA_B.md                Estructura del curso (generada desde course.json)
```

## Correcciones aplicadas al material fuente del Módulo 1

Al convertir la ficha del módulo en lecciones interactivas se corrigieron estos puntos:

- **Bloque 4 (Tarea TBLT + Self-Check)**: no aparecía en la ficha; se añadió a las cinco lecciones según la matriz atómica del diseño curricular (tarea, plantillas, modelo comentado y autoevaluación).
- **IPA**: se dan las dos variantes (US y UK) y coinciden con los audios. *Accommodation* empieza por schwa /ə/, no por /a/.
- ***Adjusting to***: se eliminó la alerta de «s-cluster / epéntesis», que no aplica. Ahora las alertas tratan /dʒ/ frente a la jota, la vocal /ʌ/ y la forma débil de *to*.
- ***Objective***: la matriz L1 hablaba de una «/t/ final»; la palabra termina en /v/ labiodental.
- ***Encountered***: tiene tres sílabas (en-COUN-tered). El error del hispanohablante es pronunciar cuatro («en-coun-te-red»).
- **Ejemplo de *workaround***: «Using taking the bus…» era agramatical; ahora es *Taking the bus was a good temporary workaround while the car was being repaired.*
- **Epéntesis en L01**: *sorted* no tiene grupo s- inicial; los ejemplos son *schedule*, *status* y *start*.
- ***Acclimate***: no es un falso amigo; el problema es el acento. Se añade la variante británica *acclimatise*.
- **Guion en *well-positioned***: obligatorio delante de un sustantivo; tras *be* se aceptan ambas formas.
- **Elipsis del sujeto** (*Slowly getting into the groove*, *Ran into a small hiccup*): se explica como rasgo de registro muy informal, para no contradecir la regla de sujeto obligatorio.
- **Already + Past Simple**: se aclara que en inglés americano informal también se oye *I already booked it*.
- **AFH**: respelling coherente con la ortografía española (*gue* para /ɡe/, *dy* para /dʒ/, *dh* para /ð/) y leyenda dentro de la app.

## Notas del Módulo 3 (tecnología cotidiana, l11–l15)

La ficha del Módulo 3 solo aporta los títulos de las lecciones, la gramática (Zero Conditional, imperativos y secuenciadores) y el AFH (acento en sustantivos compuestos y grupos sp- / st- / sk-); el resto se diseñó a partir de la matriz atómica. Decisiones:

- **Reparto de la gramática**: l11 Zero Conditional (*if / when* + presente) y *use … to*; l12 imperativos, *Could you / Would you mind + -ing* y reglas de acceso; l13 *if* + presente + imperativo, *Why don't you…?* y *Try + -ing*; l14 *Never / Always / Don't* y *unless*; l15 secuenciadores y *Once* + presente. Todas las lecciones repiten el Zero Conditional con un propósito distinto, en espiral.
- **Voz nueva**: Daniel (`bm_daniel`, soporte técnico, formal UK), para el registro formal de atención al cliente.
- **Sin question tags**: este módulo no usa clips con `tone`, así que no pasa por `intonation.py`. Los ejercicios de acento usan `audioRef` hacia los audios de fonética.
- **Comprobaciones nuevas** en `checks.js`: `ifWill`, `forToInfinitive`, `loginVerb`, `couldTo`, `mindTo`, `noImperative`, `whyDontTo`, `uncountable`, `makeDoList`, `unlessNot`, `doubleNegative`, `onceWill`, `atTheEnd`, `afterOf` y `enterApp`. Se probaron con frases correctas e incorrectas.
- **Revisión del audio**: PocketSphinx marcó cuatro clips. Dos eran de Leo (`am_puck`, la voz con peor WER del curso): *Got it! Do I type it here?* se cambió por *Okay, got it! Do I type the code here?* y *Don't forget to tap Save* por *…press Save*. Los otros dos (*Easy peasy…* y *Finally, confirm the code…* en voz UK) dieron el mismo error con otras voces: falsos positivos del reconocedor.
- **Fonemas**: se comprobó con el fonemizador que los clips dicen lo que afirma el IPA (*sync* /sɪŋk/, *once* /wʌns/, la t suelta de *notification* y *settings* en EE. UU., *privacy* con /ɪ/ en UK). En *Turn off* se fuerza el acento principal en *off* para que el audio coincida con la alerta.
