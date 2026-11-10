# Inglés Banda B · B1–B2 para hispanohablantes

App web de autoaprendizaje para la Banda B del MCER (270 horas, de B1.1 a B2.2). Combina Enfoque Léxico, Descubrimiento Guiado, Enseñanza Basada en Tareas (TBLT) y el **Anclaje Fonético Hispanohablante (AFH)**.

- **Estructura completa** de la Banda B: 4 subniveles, 54 módulos y 270 lecciones, con dominios temáticos, foco gramatical (EGP), léxico (EVP) y fonético (AFH) por módulo, y la prueba de transición *The Threshold Gate*. Ver [`docs/ESTRUCTURA_BANDA_B.md`](docs/ESTRUCTURA_BANDA_B.md).
- **Módulos 1 y 2 completos** (B1.1): *Personal Life, Routines & Current Projects* y *Social Interactions & Making Connections*, con 5 lecciones de 1 hora y un repaso cada uno.
- **1413 audios** generados con catorce voces neuronales (233 del Módulo 1, 248 del Módulo 2, 231 del Módulo 3, 235 del Módulo 4, 231 del Módulo 5 y 235 del Módulo 6), guardados en `audio/<subnivel>/<módulo>/` y servidos por la propia app (también sin conexión).

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
| Grace | `af_nova` | US | Registro neutro: atención al cliente de una compañía de internet (desde el Módulo 4) |
| Hannah | `bf_isabella` | UK | Registro formal: la doctora Hannah Ward, médica de familia de Sarah (desde el Módulo 5) |
| Sophie | `bf_lily` | UK | Registro formal: Sophie Bennett, recepcionista del hotel de Edimburgo (desde el Módulo 6) |

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
content/b1-1/m01/ … m06/                 Módulos 1 a 6: module.json, lecciones, review.json
audio/b1-1/m01/ … m06/                   233 + 248 + 231 + 235 + 231 + 235 MP3, cada uno con su manifest.json
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

## Módulos en borrador: primero el texto, el audio al final

Desde el Módulo 4, los módulos se escriben y se publican en dos fases: primero el contenido y, al final, los audios de varios módulos de una vez.

- En `course.json`, un módulo con `"status": "draft"` tiene sus textos completos, pero todavía no tiene audio. Cada clip conserva `audio` + `speaker` + `text` (y `tts` cuando hace falta), con IDs únicos, así que los botones de audio ya están en su sitio.
- `check_content.py` valida los borradores igual que los publicados (JSON, hablantes, respuestas de los ejercicios, contracciones, unicidad de IDs), pero no exige los MP3 ni el manifiesto.
- La app oculta los borradores, salvo que se abra con `?borrador` (por ejemplo, `…/index.html?borrador#m04`). En ese modo, el módulo muestra la etiqueta «Borrador · audio pendiente» y los botones de audio avisan de que el audio aún no existe.
- Para publicar un borrador: genera el audio con `generate_audio.py`, pasa `qa_audio.py`, cambia el estado a `available` y vuelve a ejecutar `check_content.py`.

## Notas del Módulo 4 (problemas prácticos, l16–l20)

- **Gramática en espiral**: l16 *too / (not) enough* y *keep + -ing*; l17 First Conditional frente al Zero Conditional del Módulo 3, más *It says…*; l18 First Conditional para ofrecer y prometer, y *as soon as / when* + presente; l19 *will* (seguro) frente a *might* (posible) y *If that doesn't work…*; l20 *if / unless* con compromisos y Present Perfect + *since* (Módulo 2) para confirmar.
- **AFH**: letras mudas (*wrong, should, receipt, half, doubt, hour*), grupos finales con -ed (*crashed, fixed, asked, replaced, switched off, plugged in, resolved, confirmed*) y acento sustantivo / verbo (*BREAKdown / break DOWN*, *REset / reSET*).
- **Reparto**: George atiende en la tienda de electrónica (l18 y l20); Grace (`af_nova`), nueva, en la compañía de internet de Sarah (l20). El administrador del edificio de l16 (*Mr Lee*) solo aparece por escrito, para no asignar a George dos trabajos.
- **Fonemas comprobados con misaki antes de generar el audio**: el fonemizador acentuaba *reset* en SET también como sustantivo, *broke down* en BROKE y leía *issue* en UK como /ˈɪʃjuː/. Para que el audio coincida con las alertas, se fuerzan los fonemas con `ttsUs` / `ttsUk` / `tts`.
- **Comprobaciones nuevas** en `checks.js`: `tooMuchAdj`, `enoughBeforeAdj`, `keepTo`, `doesntS`, `explainMe`, `messageTells`, `askFor`, `returnMoney`, `mightTo`, `doubtsQuestions` y `aHour`, probadas con frases correctas e incorrectas y contra los modelos de tarea.
- **Audio (publicado tras el borrador)**: 235 clips con Kokoro y WER medio de 0,15, igual que los módulos anteriores. PocketSphinx marcó cuatro clips (*A reset. To reset.* lento y UK; *My battery's dead…*; *…unplug the router*) que fallan igual con otras voces, así que son falsos positivos del reconocedor. El fonemizador produce bien *unplug* /ʌnˈplʌɡ/ y el contraste *REset / reSET*. No hay clips con `tone`.

## Notas del Módulo 5 (bienestar y equilibrio del tiempo, l21–l25)

- **Gramática en espiral**: l21 *have to / don't have to* y *spend* + tiempo + *-ing*; l22 *should / shouldn't / ought to* para aconsejar y poner límites; l23 *have to* (obligatorio), *don't have to* (no hace falta) y *mustn't* (prohibido), con *(not) … enough* del Módulo 4; l24 *should* (consejo) frente a *have to* (indicación médica), *enough* + sustantivo y *too much / too many*; l25 *have to* para compromisos, *Should we…?* / *Why don't we…?* para proponer y *enough time to* + verbo.
- **AFH**: la schwa y las sílabas que desaparecen (*every, calendar, comfortable, vegetable, interesting, family, Wednesday*), *have to* = /ˈhæf.tə/, letras mudas (*shouldn't, ought, mustn't, muscles*) y variantes US / UK (*leisure, weekend, medicine*).
- **Personaje nuevo**: la doctora Hannah Ward (`bf_isabella`), médica de familia de Sarah (l24). Así los consejos de salud vienen de una profesional y no de un personaje con otro trabajo.
- **Fonemas forzados**: misaki no aplica las reducciones que enseñan las alertas, así que se fuerzan en `ttsUs` / `ttsUk` / `tts`: *every* /ˈɛvɹi/, *comfortable* /ˈkʌmftəɹbəl/, *vegetable* /ˈvɛʤtəbᵊl/, *interesting* /ˈɪntɹəstɪŋ/, *anxious* con /k/, *overwhelmed* sin «hw», *ought to* con t suave en EE. UU., *medicine* de dos sílabas en UK y *have to / has to* con /f/ y /s/ en todo el módulo (53 sustituciones automáticas en el `tts` de cada clip).
- **Comprobaciones nuevas** en `checks.js`: `haventTo`, `haveToThird`, `spendTo`, `oughtNoTo`, `thinkShouldnt`, `mustAdvice`, `workInHome`, `makeExercise`, `getSleepEnough`, `tooMuchPlural`, `recipeDoctor`, `quedarStay`, `enoughTimeFor`, `dayPreposition` y `dayCapital`, probadas con frases correctas e incorrectas y contra los modelos de tarea.

## Notas del Módulo 6 (viajes, l26–l30)

- **Hilo narrativo**: Maya, que trabaja en una agencia de viajes, organiza el viaje de Sarah y Priya. Priya da una charla en un congreso en Londres y luego las dos van a Edimburgo. Allí sufren una huelga de trenes (l27), piden indicaciones a la recepcionista (l28), resuelven peticiones en el hotel (l29) y, de vuelta, se lo cuentan a Oliver, que creció en Edimburgo (l30).
- **Gramática en espiral**: Present Continuous para lo reservado, *going to* para intenciones y presente simple para horarios (l26); *will* para decisiones del momento frente a *going to* para predicciones con pruebas, más el First Conditional como plan B (l27); imperativos, *you'll see* y preguntas indirectas (Módulo 2) para dar indicaciones (l28); *will* para promesas, *Would it be possible to…?* y *there will be* (l29); los tres futuros, el Past Simple y el First Conditional para recomendar (l30).
- **AFH**: s-clusters de viaje (*station, strike, street, straight, square, stairs, special*) y el contraste /j/ – /dʒ/ con `variants` (*yet / jet*, *year / ear*), además de *Europe, journey* y *unique*.
- **Personaje nuevo**: Sophie Bennett, recepcionista del hotel de Edimburgo. Primero se probó `bf_alice`, pero su WER en el control de calidad fue de 0,38. Con las mismas frases, `bf_lily` dio 0,22 y `bf_alice` 0,28, así que Sophie usa `bf_lily`.
- **Fonemas**: todas las entradas de fonética coinciden con misaki sin overrides. Por coherencia con la Lección 21, *every* se fuerza a /ˈɛvɹi/ en los clips del módulo, igual que *have to*.
- **Comprobaciones nuevas** en `checks.js`: `willTo`, `goingToIng`, `arriveTo`, `loseTrain`, `delayedOf`, `onTheLeft`, `aTravel`, `knowCity` y `assistTo`, y `uncountable` ahora incluye *luggages, baggages, equipments*. Todas se probaron con frases correctas e incorrectas.

## Revisión del audio del Módulo 1 (2026-11-10)

El Módulo 1 se generó antes de las reglas de coherencia y de elección de voz por WER. Al revisarlo, el WER medio era de 0,15, con 5 clips marcados. Las voces británicas daban 0,28 de media y las americanas, 0,12. Cambios:

- **Dictado `rv-dict-2`** (*All arrangements are proceeding according to schedule.*): pasa de Emma a Alex. Emma pronunciaba *schedule* en británico, «SHÉ-dyul»: es correcto, pero en un dictado sorprende al alumno. Con Alex, el WER baja de 0,71 a 0,00. La explicación del ejercicio menciona ahora las dos pronunciaciones.
- **`l02-ph-acclimate-ex`**: la alerta de la lección dice que en Reino Unido se prefiere *acclimatise*, pero el ejemplo de *acclimate* lo decía Emma con voz británica. Ahora lo dice Ryan, con voz americana (WER 0,11).
- **`l04-cc-1b`** (*Our engineers encountered a minor fault…*): pasa de George a Daniel, que encaja con su papel de soporte técnico (WER de 0,56 a 0,11). Daniel se añade al reparto del módulo.
- **Coherencia con la Lección 21**: *every* se fuerza a /ˈɛvɹi/ en los 3 clips que lo contienen (`l02-gd`, `l02-cc-3b` y `l04-dlg-02`). *Have to* no aparece en el Módulo 1.
- Se mantienen las frases formales de Emma y George con *acclimating* (`l02-reg-f1`) y *a demanding workload*: ninguna otra voz británica las mejoraba de forma clara (`bf_isabella`, `bf_lily`, `bf_alice`; `bm_lewis` 0,50 frente a 0,62).
- **Resultado**: WER medio de 0,14, con 1 clip marcado. Emma pasa de 0,37 a 0,28 y George, de 0,19 a 0,16.
- **Caché de audio**: las URL de los MP3 llevan ahora `?v=<hash>`, y `sw.js` usa la URL completa como clave. Así los clips regenerados llegan a los móviles en lugar de servirse desde caché.
