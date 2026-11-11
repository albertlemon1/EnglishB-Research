// Lesson-shell strings in Spanish (B1) and English (B2). The sublevel decides
// which set is active ("ui" in course.json; Spanish when absent): B2 withdraws
// the Spanish crutch from instructions and block titles, while the phonetics
// block (AFH) and the self-check keep Spanish by design, because both rely on
// explicit contrast with the learner's L1.
// The app chrome outside a lesson (home, route, method, top bar) stays in Spanish.

const ES = {
  "block.lexical.name": "Input léxico", "block.lexical.short": "Input", "block.lexical.title": "Escenario vivo y registros reales",
  "block.discovery.name": "Descubrimiento guiado", "block.discovery.short": "Descubre", "block.discovery.title": "Descubre la regla tú mismo",
  "block.phonetics.name": "Glosario fonético dual", "block.phonetics.short": "Fonética", "block.phonetics.title": "IPA + Anclaje Fonético Hispanohablante",
  "block.consolidation.name": "Consolidación y L1", "block.consolidation.short": "Consolida", "block.consolidation.title": "Estructuras, matices y puntos ciegos",
  "block.practice.name": "Práctica", "block.practice.short": "Practica", "block.practice.title": "Practica con corrección inmediata",
  "block.task.name": "Tarea y autoevaluación", "block.task.short": "Tarea", "block.task.title": "Tarea comunicativa real",
  "block.of": "Bloque {n} de {total} · {name}",

  // lesson view
  "lesson.n": "Lección {n}", "lesson.ofCourse": "Lección {n} de {total}", "lesson.min": "{n} min",
  "lesson.objectives": "Objetivos · al terminar podrás", "lesson.warmup": "Calentamiento", "lesson.lexis": "Léxico", "lesson.phon": "Fonética",
  "lesson.blocks": "Los seis bloques", "lesson.block": "Bloque {n}", "lesson.continue": "Continuar la lección", "lesson.start": "Empezar la lección",
  "lesson.prevObjectives": "Objetivos", "lesson.next": "Siguiente: {name}", "lesson.backToModule": "Volver al módulo", "lesson.nextLesson": "Lección {n}",
  "lesson.review": "Repaso del módulo", "lesson.module": "Módulo {n}", "lesson.route": "Ruta", "lesson.stepperLabel": "Bloques de la lección",
  "lesson.blockNavLabel": "Navegación entre bloques",
  "review.eyebrow": "Repaso del módulo", "review.crumb": "Repaso", "review.title": "Repaso", "review.back": "Volver al módulo", "review.route": "Ver la ruta completa", "review.retry": "Repetir el repaso",

  // lexical
  "lex.intro": "El mismo mensaje cambia según con quién hablas. Escucha, fíjate en los bloques resaltados y toca uno para ver su significado.",
  "lex.listenMsg": "Escuchar el mensaje", "lex.listenTo": "Escuchar a {name}", "lex.comprehension": "Comprensión",
  "lex.comprehensionText": "Tres preguntas rápidas sobre la conversación de abajo. Escúchala primero.", "lex.listenDialogue": "Escuchar la conversación", "lex.stop": "Detener",
  "lex.registers": "Mapa de registros",
  "lex.registersText": "Cada columna tiene su propio grupo de voces: amistades para el casual, coordinación cotidiana para el neutro y voces británicas institucionales para el formal.",
  "lex.whichRegister": "¿Qué registro es?", "lex.whichRegisterText": "Clasifica cada frase. La corrección es inmediata.", "lex.registerLabel": "Registro",
  "lex.itIs": "Es <b>{reg}</b>. ",
  "lex.chunks": "Banco de chunks", "lex.chunksText": "Apréndelos como bloques completos, no palabra por palabra. El color indica el registro.",
  "lex.syn": "Similar", "lex.ant": "Opposite",
  "reg.casual": "Casual / social", "reg.neutral": "Neutro / estándar", "reg.formal": "Formal / escrito", "reg.model": "Modelo",
  "reg.casual.short": "Casual", "reg.neutral.short": "Neutro", "reg.formal.short": "Formal", "reg.model.short": "Modelo",
  "reg.meter": "Formalidad {n} de 3",

  // discovery
  "disc.analysis": "Texto de análisis", "disc.listenText": "Escuchar el texto", "disc.questions": "Preguntas de descubrimiento",
  "disc.questionsText": "Significado → forma → uso. Elige una opción: recibirás la explicación al instante.",
  "disc.questionsOpenText": "Significado → forma → uso. Escribe la regla con tus palabras y compárala con el modelo.",
  "disc.rule": "La regla que descubriste", "disc.locked": "Responde las {total} preguntas para ver la regla ({n}/{total}).",
  "disc.organizer": "Organizador",

  // phonetics (kept in Spanish in every sublevel: it is the AFH block)
  "ph.listen": "Escuchar {term}", "ph.us": "Modelo estadounidense", "ph.slow": "Modelo lento", "ph.slowLabel": "Lento", "ph.uk": "Modelo británico",
  "ph.afh": "AFH · cómo sonarlo", "ph.variants": "Escucha la diferencia", "ph.example": "Ejemplo con {name}", "ph.record": "Grabar y comparar",
  "ph.howTo": "Cómo leer el AFH",
  "ph.howTo1": "El Anclaje Fonético Hispanohablante reescribe la palabra con letras del español para que la pronuncies bien desde el primer intento. La IPA es la referencia exacta; el AFH es tu atajo.",
  "ph.howTo2": "<b>MAYÚSCULAS</b> = sílaba tónica · <b>dy</b> = /dʒ/ (la y enfática de «¡yo!») · <b>sh</b> = /ʃ/ · <b>dh</b> = /ð/ (la d suave de «nada») · <b>z</b> = /z/ sonora (zumbido) · <b>h</b> = aspiración suave, nunca jota · <b>a</b> en sílaba átona = schwa /ə/, una vocal relajada · <b>r</b> entre vocales en «sor-ri» = flap T americana.",

  // consolidation
  "cons.intro": "Desglose mecánico de cada estructura, con matices de uso y ejemplos en contexto. Después, revisa los puntos ciegos del hispanohablante.",
  "cons.structure": "Estructura {n}", "cons.l1": "Matriz de interferencia L1",
  "cons.l1Text": "Marca cada punto cuando lo tengas claro. Volverás a esta lista en la autoevaluación de la tarea.",

  // practice
  "pr.firstTry": "Cuenta tu primer intento.", "pr.count": "{n} ejercicios", "pr.retry": "Repetir la práctica",
  "pr.type.choice": "elección", "pr.type.gap": "huecos", "pr.type.order": "orden", "pr.type.fix": "corrección de errores típicos", "pr.type.stress": "acento",
  "pr.type.intonation": "entonación", "pr.type.dictation": "dictado", "pr.type.organizer": "organizadores", "pr.type.open": "respuesta abierta", "pr.and": "y",

  // exercises
  "ex.kind.semantic": "Significado", "ex.kind.syntactic": "Forma", "ex.kind.pragmatic": "Uso", "ex.kind.comprehension": "Comprensión",
  "ex.kind.choice": "Elige", "ex.kind.gap": "Completa", "ex.kind.order": "Ordena", "ex.kind.fix": "Corrige", "ex.kind.stress": "Acento",
  "ex.kind.dictation": "Dictado", "ex.kind.intonation": "Entonación", "ex.kind.organizer": "Completa el esquema", "ex.kind.open": "Escribe la regla",
  "ex.ok": "Bien", "ex.bad": "Revisa", "ex.lesson": "Lección {n}", "ex.answer": "Respuesta", "ex.check": "Comprobar", "ex.reset": "Reiniciar", "ex.copy": "Copiar la frase",
  "ex.answerIs": "Respuesta: <em class=\"en\">{a}</em>. ", "ex.orderIs": "Orden correcto: <em class=\"en\">{a}.</em> ", "ex.fixIs": "Corrección: <em class=\"en\">{a}</em> ",
  "ex.textIs": "Texto: <em class=\"en\">{a}</em><br>", "ex.orderEmpty": "Toca las palabras en orden", "ex.fixPlaceholder": "Escribe la frase corregida", "ex.fixLabel": "Frase corregida",
  "ex.listenWord": "Escuchar {w}", "ex.listenSentence": "Escuchar la frase", "ex.listenDict": "Escuchar el dictado", "ex.dictHint": "Puedes escucharlo las veces que necesites.",
  "ex.dictPlaceholder": "Escribe aquí lo que oyes", "ex.dictLabel": "Dictado",
  "ex.rise": "Sube: pregunta de verdad (no está seguro)", "ex.fall": "Baja: busca confirmación o acuerdo",
  "ex.answered": "{n} de {total} respondidas", "ex.result": "Resultado", "ex.retry": "Repetir",
  "ex.msgHigh": "Excelente. Dominas los rasgos de esta lección.", "ex.msgMid": "Buen trabajo. Repasa las explicaciones de los fallos.", "ex.msgLow": "Vuelve al bloque de consolidación y repite la práctica.",
  // open answer
  "open.placeholder": "Escribe aquí la regla con tus palabras…", "open.compare": "Comparar con el modelo", "open.tooShort": "Escribe al menos {n} palabras antes de comparar.",
  "open.signals": "Tu respuesta menciona", "open.model": "Regla modelo", "open.yours": "Tu respuesta", "open.criteria": "Valora tu respuesta",
  "open.yes": "Sí", "open.partly": "A medias", "open.no": "Aún no", "open.done": "Guardar mi valoración", "open.allMet": "Tu regla cubre los tres puntos.", "open.someMet": "Compara los puntos que faltan con la regla modelo.",
  // organizer
  "org.check": "Comprobar", "org.allRight": "Todos los huecos están bien.", "org.someWrong": "{n} de {total} huecos por revisar. La respuesta aparece en los huecos fallidos.",

  // task
  "task.intro": "Usa lo que has aprendido para cumplir un objetivo real. Luego compara con el modelo comentado y revisa tu texto con la matriz L1.",
  "task.format.voice": "Mensaje (escrito o de voz)", "task.format.text": "Texto", "task.format.email": "Correo / mensaje",
  "task.frames": "Plantillas de frases · toca una para insertarla", "task.keywords": "Palabras clave · úsalas con tu propia sintaxis",
  "task.yourText": "Tu texto", "task.autosave": "Se guarda automáticamente en este navegador.", "task.placeholder": "Escribe aquí en inglés…",
  "task.words": "{n} palabras · objetivo {goal}", "task.chunksDetected": "Chunks detectados", "task.review": "Revisar mi texto", "task.showModel": "Ver modelo comentado",
  "task.record": "Grabar mi mensaje de voz", "task.extraPlaceholder": "Your formal sentence…",
  "task.model": "Modelo comentado", "task.modelText": "Escucha y compara: ¿qué chunks usó el modelo que tú no usaste?", "task.listenModel": "Escuchar el modelo", "task.listenDialogue": "Escuchar el diálogo",
  "task.listenInput": "Escuchar el mensaje",
  "task.selfcheck": "Autoevaluación", "task.selfcheckText": "Repasa tu texto punto por punto antes de darlo por terminado.",
  "task.selfcheckMetaText": "Más que una lista de control: valora el efecto de tu texto en quien lo lee y anota cómo lo conseguiste.",
  "task.sc.yes": "Sí", "task.sc.partly": "A medias", "task.sc.no": "Aún no", "task.sc.reflect": "¿Cómo? Anota la frase que lo consigue.",
  "task.area.impact": "Efecto social", "task.area.register": "Registro", "task.area.accuracy": "Precisión", "task.area.l1": "Interferencia L1", "task.area.strategy": "Estrategia",
  "task.tooShort": "Escribe primero tu texto (al menos un par de frases) y vuelve a revisarlo.",
  "task.lengthNote": "Tu texto tiene {n} palabras; el objetivo es {goal}. Añade un detalle más.",
  "task.chunksUsed": "Chunks de la lección usados.", "task.chunksGood": "Buen despliegue de vocabulario.", "task.chunksMore": "Intenta incorporar alguno más de la lista de arriba.",
  "task.noHints": "No se detectaron los errores típicos de interferencia que revisa esta lección. Repásalo igualmente con la autoevaluación.",
  "task.done": "Lección completada", "task.undo": "Marcar como pendiente", "task.complete": "Marcar la lección como completada", "task.doneToast": "Lección completada",
  "audio.pending": "Audio pendiente: este módulo aún no tiene audio",
};

const EN = {
  ...ES,
  "block.lexical.name": "Lexical input", "block.lexical.short": "Input", "block.lexical.title": "A real scenario, three registers",
  "block.discovery.name": "Guided discovery", "block.discovery.short": "Discover", "block.discovery.title": "Work out the rule yourself",
  // Block 3 keeps its Spanish name on purpose: it is the contrastive (AFH) block.
  "block.consolidation.name": "Consolidation & L1", "block.consolidation.short": "Consolidate", "block.consolidation.title": "Structures, nuances and blind spots",
  "block.practice.name": "Practice", "block.practice.short": "Practise", "block.practice.title": "Practise with instant feedback",
  "block.task.name": "Task & self-check", "block.task.short": "Task", "block.task.title": "A real communicative task",
  "block.of": "Block {n} of {total} · {name}",

  "lesson.n": "Lesson {n}", "lesson.ofCourse": "Lesson {n} of {total}", "lesson.min": "{n} min",
  "lesson.objectives": "Objectives · by the end you can", "lesson.warmup": "Warm-up", "lesson.lexis": "Lexis", "lesson.phon": "Phonetics",
  "lesson.blocks": "The six blocks", "lesson.block": "Block {n}", "lesson.continue": "Continue the lesson", "lesson.start": "Start the lesson",
  "lesson.prevObjectives": "Objectives", "lesson.next": "Next: {name}", "lesson.backToModule": "Back to the module", "lesson.nextLesson": "Lesson {n}",
  "lesson.review": "Module review", "lesson.module": "Module {n}", "lesson.route": "Route", "lesson.stepperLabel": "Lesson blocks", "lesson.blockNavLabel": "Block navigation",
  "review.eyebrow": "Module review", "review.crumb": "Review", "review.title": "Review", "review.back": "Back to the module", "review.route": "See the full route", "review.retry": "Retry the review",

  "lex.intro": "The same message changes with the listener. Listen, notice the highlighted chunks and tap one to see what it means.",
  "lex.listenMsg": "Listen to the message", "lex.listenTo": "Listen to {name}", "lex.comprehension": "Comprehension",
  "lex.comprehensionText": "Three quick questions about the conversation below. Listen first.", "lex.listenDialogue": "Play the conversation", "lex.stop": "Stop",
  "lex.registers": "Register map",
  "lex.registersText": "Each column has its own voices: friends for casual, everyday coordination for neutral and British institutional voices for formal.",
  "lex.whichRegister": "Which register is it?", "lex.whichRegisterText": "Classify each sentence. Feedback is immediate.", "lex.registerLabel": "Register",
  "lex.itIs": "It is <b>{reg}</b>. ",
  "lex.chunks": "Chunk bank", "lex.chunksText": "Learn them as whole blocks, not word by word. Definitions are in English: infer, then check. The colour shows the register.",
  "lex.syn": "Similar", "lex.ant": "Opposite",
  "reg.casual": "Casual / social", "reg.neutral": "Neutral / standard", "reg.formal": "Formal / written", "reg.model": "Model",
  "reg.casual.short": "Casual", "reg.neutral.short": "Neutral", "reg.formal.short": "Formal", "reg.model.short": "Model",
  "reg.meter": "Formality {n} of 3",

  "disc.analysis": "Analysis text", "disc.listenText": "Listen to the text", "disc.questions": "Discovery questions",
  "disc.questionsText": "Meaning → form → use. Choose an option: the explanation appears at once.",
  "disc.questionsOpenText": "Meaning → form → use. Write the rule in your own words, then compare it with the model.",
  "disc.rule": "The rule you worked out", "disc.locked": "Answer the {total} questions to see the rule ({n}/{total}).",
  "disc.organizer": "Organizer",

  "cons.intro": "Each structure taken apart, with nuances of use and examples in context. Then review the Spanish speaker's blind spots.",
  "cons.structure": "Structure {n}", "cons.l1": "L1 interference matrix",
  "cons.l1Text": "Tick each point once it is clear. You will come back to this list in the task's self-check.",

  "pr.firstTry": "Your first attempt counts.", "pr.count": "{n} exercises", "pr.retry": "Repeat the practice",
  "pr.type.choice": "multiple choice", "pr.type.gap": "gap-fill", "pr.type.order": "word order", "pr.type.fix": "error correction", "pr.type.stress": "word stress",
  "pr.type.intonation": "intonation", "pr.type.dictation": "dictation", "pr.type.organizer": "organizers", "pr.type.open": "open answers", "pr.and": "and",

  "ex.kind.semantic": "Meaning", "ex.kind.syntactic": "Form", "ex.kind.pragmatic": "Use", "ex.kind.comprehension": "Comprehension",
  "ex.kind.choice": "Choose", "ex.kind.gap": "Complete", "ex.kind.order": "Put in order", "ex.kind.fix": "Correct", "ex.kind.stress": "Stress",
  "ex.kind.dictation": "Dictation", "ex.kind.intonation": "Intonation", "ex.kind.organizer": "Complete the organizer", "ex.kind.open": "Write the rule",
  "ex.ok": "Correct", "ex.bad": "Look again", "ex.lesson": "Lesson {n}", "ex.answer": "Answer", "ex.check": "Check", "ex.reset": "Reset", "ex.copy": "Copy the sentence",
  "ex.answerIs": "Answer: <em class=\"en\">{a}</em>. ", "ex.orderIs": "Correct order: <em class=\"en\">{a}.</em> ", "ex.fixIs": "Correction: <em class=\"en\">{a}</em> ",
  "ex.textIs": "Text: <em class=\"en\">{a}</em><br>", "ex.orderEmpty": "Tap the words in order", "ex.fixPlaceholder": "Type the corrected sentence", "ex.fixLabel": "Corrected sentence",
  "ex.listenWord": "Listen to {w}", "ex.listenSentence": "Listen to the sentence", "ex.listenDict": "Listen to the dictation", "ex.dictHint": "Listen as many times as you need.",
  "ex.dictPlaceholder": "Type what you hear", "ex.dictLabel": "Dictation",
  "ex.rise": "Rises: a genuine question (not sure)", "ex.fall": "Falls: seeking confirmation or agreement",
  "ex.answered": "{n} of {total} answered", "ex.result": "Result", "ex.retry": "Retry",
  "ex.msgHigh": "Excellent. You have these features under control.", "ex.msgMid": "Good work. Reread the explanations of the ones you missed.", "ex.msgLow": "Go back to the consolidation block and repeat the practice.",
  "open.placeholder": "Write the rule in your own words…", "open.compare": "Compare with the model", "open.tooShort": "Write at least {n} words before comparing.",
  "open.signals": "Your answer mentions", "open.model": "Model rule", "open.yours": "Your answer", "open.criteria": "Rate your answer",
  "open.yes": "Yes", "open.partly": "Partly", "open.no": "Not yet", "open.done": "Save my rating", "open.allMet": "Your rule covers every point.", "open.someMet": "Compare the missing points with the model rule.",
  "org.check": "Check", "org.allRight": "Every gap is right.", "org.someWrong": "{n} of {total} gaps to review. The answer is shown in each wrong gap.",

  "task.intro": "Use what you have learned to achieve a real goal. Then compare with the annotated model and review your text with the L1 matrix.",
  "task.format.voice": "Message (written or voice)", "task.format.text": "Text", "task.format.email": "Email / message",
  "task.frames": "Sentence frames · tap one to insert it", "task.keywords": "Key words · build your own sentences around them",
  "task.yourText": "Your text", "task.autosave": "Saved automatically in this browser.", "task.placeholder": "Write here in English…",
  "task.words": "{n} words · target {goal}", "task.chunksDetected": "Chunks detected", "task.review": "Review my text", "task.showModel": "Show the annotated model",
  "task.record": "Record my voice message", "task.extraPlaceholder": "Your formal sentence…",
  "task.model": "Annotated model", "task.modelText": "Listen and compare: which chunks did the model use that you did not?", "task.listenModel": "Listen to the model", "task.listenDialogue": "Play the dialogue",
  "task.listenInput": "Listen to the message",
  // The self-check stays in Spanish (L1 contrast), so its headings do too.
  "task.tooShort": "Write your text first (at least a couple of sentences) and review it again.",
  "task.lengthNote": "Your text has {n} words; the target is {goal}. Add one more detail.",
  "task.chunksUsed": "Lesson chunks used.", "task.chunksGood": "Good range of vocabulary.", "task.chunksMore": "Try to bring in one or two more from the list above.",
  "task.noHints": "None of the typical interference slips this lesson checks were detected. Still go through the self-check.",
  "task.done": "Lesson completed", "task.undo": "Mark as pending", "task.complete": "Mark the lesson as completed", "task.doneToast": "Lesson completed",
  "audio.pending": "Audio pending: this module has no audio yet",
};

const SETS = { es: ES, en: EN };
let current = ES;
let code = "es";

export function setLang(lang) {
  code = SETS[lang] ? lang : "es";
  current = SETS[code];
}
export const lang = () => code;

// t("lesson.n", { n: 5 }) → "Lección 5". Unknown keys return the key, so a typo is visible.
export function t(key, vars) {
  let s = current[key] ?? ES[key] ?? key;
  if (vars) for (const [k, v] of Object.entries(vars)) s = s.split(`{${k}}`).join(String(v));
  return s;
}
