// Spanish-L1 heuristics for the B2 lessons (assisted self-check). Same contract as
// checks.js: each function takes the learner's text and returns null or
// { msg, sample?, soft? }. Messages stay in Spanish: they belong to the L1 matrix,
// the one place B2 keeps the learner's language by design.
// Every check is tried with correct and incorrect sentences before a lesson names it.

const sentencesOf = (text) => text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);

export const CHECKS_B2 = {
  // m25 · Present Perfect Continuous vs Simple -------------------------------
  // «Llevo tres semanas trabajando en esto» → *I am working on this for three weeks* / *since March*.
  presentForSince(text) {
    const present = /\b(am|is|are|'m|'s|'re)\s+(\w+ing)\b/i;
    const since = /\bsince\s+(january|february|march|april|may|june|july|august|september|october|november|december|monday|tuesday|wednesday|thursday|friday|last|the\s+start|the\s+beginning|\d)/i;
    // "I'm staying for two weeks" can be a plan, so a duration only counts with now / already / still.
    const duration = /\bfor\s+(the\s+last|the\s+past|a|an|two|three|four|five|six|seven|eight|nine|ten|\d+|several|many)\s+\w*(week|month|year|day|hour)s?\b/i;
    const s = sentencesOf(text).find((x) => present.test(x) && !/\b(have|has|'ve|'s)\s+been\b/i.test(x) && (since.test(x) || (duration.test(x) && /\b(now|already|still)\b/i.test(x))));
    return s ? { msg: "Una acción que empezó en el pasado y sigue va en Present Perfect Continuous: *We've been working on it since March*, no *We are working… since*.", sample: s } : null;
  },
  // Stative verbs do not take the continuous: *I've been knowing him for years*.
  stativeContinuous(text) {
    const m = text.match(/\b(have|has|'ve|'s)\s+been\s+(knowing|believing|understanding|owning|belonging|containing|needing|wanting|liking|preferring|seeming)\b[^.!?]*/i);
    return m ? { msg: "Los verbos de estado (*know, believe, own, need, want*) no van en continuo: *I've known him for years*, *we've needed this since May*.", sample: m[0] } : null;
  },
  // m25 · l122 · explaining delays -------------------------------------------
  // *due to / owing to* + a clause (Spanish «debido a que»).
  dueToClause(text) {
    const m = text.match(/\b(due to|owing to)\s+(the|a|an|our|my|their|his|her|its|we|they|he|she|it|I|you)\b\s+\w+\s+(\w+ed|changed|was|were|is|are|did|had|has|have|sent|took|went|made)\b[^.!?]*/i);
    return m ? { msg: "*Due to* y *owing to* van seguidos de un sustantivo (*due to a change in the format*). Con una oración completa usa *because*.", sample: m[0] } : null;
  },
  // «el proyecto se ha retrasado» → *the project has delayed*.
  delayIntransitive(text) {
    const m = text.match(/\b(has|have|had|is|are|was|were)\s+delayed\s+(by\s+)?(a|an|one|two|three|four|five|six|\d+|several|a few|two weeks|a week)\b[^.!?]*/i);
    if (m && !/\bbeen\s+delayed\b/i.test(m[0]) && !/\b(is|are|was|were)\s+delayed\b/i.test(m[0])) return { msg: "*Delay* necesita objeto o pasiva: *the module has been delayed by two weeks*, o *has slipped by two weeks*. Nunca *the module has delayed*.", sample: m[0] };
    return null;
  },
  // «para el viernes» → *for Friday* with a deliverable.
  forDeadline(text) {
    const m = text.match(/\b(deliver|send|finish|complete|submit|have it|ready|done|delivered)\b[^.!?]{0,25}\bfor\s+(monday|tuesday|wednesday|thursday|friday|saturday|sunday|the end of|june|july|may|april|march|\d{1,2}(st|nd|rd|th)?\b)/i);
    return m ? { msg: "Para un plazo límite usa *by*: *we'll deliver it by Friday*. *For* indica propósito o destinatario.", sample: m[0], soft: true } : null;
  },
  // Blame vocabulary in a client message.
  blameWords(text) {
    const m = text.match(/[^.!?]*\b(guilty|is to blame|are to blame|the fault of|it's their fault|it is their fault|their fault|blame the|blame on)\b[^.!?]*/i);
    return m ? { msg: "Nombra el hecho, no al culpable: *the delay is down to a change in the supplier's format*, *has been held up by…*. *Guilty* es lenguaje judicial.", sample: m[0].trim(), soft: true } : null;
  },
  // m25 · l123 · results vs effort ------------------------------------------
  // «todavía no hemos terminado» → *we haven't finished already*.
  alreadyNegative(text) {
    const m = text.match(/\b(haven't|hasn't|have not|has not|didn't|did not)\b[^.!?]{0,40}\balready\b[^.!?]*/i);
    return m ? { msg: "En negativas y preguntas, *ya* es *yet*, al final: *we haven't finished yet*. *Already* va en afirmativas.", sample: m[0] } : null;
  },
  // «reducir en un 40 %» → *reduce in 40%*.
  reduceIn(text) {
    // "cut in half" is fine; the calque is "in" + a percentage or fraction of change.
    const m = text.match(/\b(reduc\w*|cut|increas\w*|improv\w*|lower\w*|grow\w*|fell|rose|dropp?\w*)\b[^.!?]{0,25}\bin\s+(a\s+|an\s+)?(\d+\s*(%|percent)|a third|a quarter|forty|thirty|twenty|ten)(?![a-z])/i);
    return m ? { msg: "La diferencia se introduce con *by*: *we reduced load time by 40%*. *To* da el valor final (*to three seconds*).", sample: m[0] } : null;
  },
  // «el doble de rápido» → *the double of fast*, *two times more fast*.
  doubleOfFast(text) {
    const m = text.match(/\b(the double of|two times more|twice more|double more|the double)\b[^.!?]*/i);
    return m ? { msg: "«El doble de rápido» es *twice as fast*; «tres veces más» es *three times as fast*.", sample: m[0] } : null;
  },
  // m25 · l124 · stakeholder expectations ------------------------------------
  // *likely* as a bare adverb before the verb (Spanish «probablemente»).
  likelyAdverb(text) {
    const m = text.match(/\b(we|they|he|she|it|I|you|this|that)\s+likely\s+(?!to\b)\w+/i);
    return m ? { msg: "*Likely* necesita *be*: *we're likely to lose a week*. O usa *probably*: *we'll probably lose a week*.", sample: m[0] } : null;
  },
  // «comprometerse a» → *compromise to*.
  compromiseTo(text) {
    const m = text.match(/\bcompromis\w*\s+to\s+(a|the|june|july|may|monday|tuesday|wednesday|thursday|friday|\d|deliver|finish|go)/i);
    return m ? { msg: "*Compromise* es ceder para llegar a un acuerdo. Para «comprometerse a una fecha» usa *commit to a date*.", sample: m[0] } : null;
  },
  // «es pronto para saberlo» → *Is too early to say*.
  proDropIt(text) {
    const m = text.match(/(^|[.!?;:]\s+)(Is|Was|Will be|Would be)\s+(too|very|still|quite|not)\s+(early|late|soon|difficult|hard|important|likely|possible|clear)\b[^.!?]*/m);
    return m ? { msg: "Falta el sujeto *it*: *it's too early to say*, *it's still unclear*.", sample: m[0].trim() } : null;
  },
  // «en el peor de los casos» → *in the worst of the cases*.
  worstOfCases(text) {
    const m = text.match(/\bin the (worst|best) of (the )?cases\b[^.!?]*/i);
    return m ? { msg: "*In the worst case* o *worst case*, sin *of the cases*. También *in the worst-case scenario*.", sample: m[0] } : null;
  },
  // m25 · l125 · status report ---------------------------------------------
  inProcess(text) {
    const m = text.match(/\bin process\b[^.!?]*/i);
    return m ? { msg: "La etiqueta de estado es *in progress*; *in process* es raro y técnico.", sample: m[0] } : null;
  },
  pendent(text) {
    const m = text.match(/\bpendent\b[^.!?]*/i);
    return m ? { msg: "*Pendent* no existe en este sentido: *pending* o, en un informe, *outstanding*.", sample: m[0] } : null;
  },
  theResponsible(text) {
    const m = text.match(/\bthe responsible\b(?!\s+(person|team|party|manager|department|people))[^.!?]*/i);
    return m ? { msg: "*Responsible* es solo adjetivo. En un informe, la persona es el *owner*: *owner: Alex*.", sample: m[0] } : null;
  },
  isBeenPassive(text) {
    const m = text.match(/\b(is|are|was|were)\s+been\s+\w+/i);
    return m ? { msg: "*Is been* no existe. Pasiva en curso: *is being tested*; pasiva terminada: *has been tested*.", sample: m[0] } : null;
  },
  // Finished quantity with the continuous: *We've been fixing three bugs* (result → simple).
  continuousWithCount(text) {
    const m = text.match(/\b(have|has|'ve|'s)\s+been\s+(\w+ing)\s+(two|three|four|five|six|seven|eight|nine|ten|\d+|all\s+the|every)\s+\w+/i);
    return m ? { msg: "Cuando cuentas resultados terminados (*three reports*, *all the tests*), usa el Present Perfect Simple: *We've fixed three bugs*. El continuo habla de la actividad, no del número.", sample: m[0], soft: true } : null;
  },
  // «Desde hace tres semanas» → *since three weeks*.
  sinceDuration(text) {
    const m = text.match(/\bsince\s+(a|an|one|two|three|four|five|six|seven|eight|nine|ten|\d+|several|many|a few)\s+(days?|weeks?|months?|years?|hours?|minutes?)\b/i);
    return m ? { msg: "*Since* va con el punto de inicio (*since March*); para la duración usa *for*: *for three weeks*.", sample: m[0] } : null;
  },
  // *still* after the verb: «todavía estamos esperando» → *we are waiting still*.
  stillPosition(text) {
    const m = text.match(/\b(am|is|are|'m|'s|'re|have|has|'ve)\s+(\w+ing|been\s+\w+ing)\b[^.!?]{0,30}\bstill\b/i);
    return m ? { msg: "*Still* va antes del verbo principal o después del auxiliar: *We're still waiting*, *we've still been testing*.", sample: m[0], soft: true } : null;
  },
  // «Actualmente» → *actually*.
  actuallyCurrently(text) {
    const m = text.match(/[^.!?]*\bactually\b[^.!?]*[.!?]?/i);
    return m ? { msg: "*Actually* significa «en realidad», no «actualmente». Para el momento presente usa *currently*, *at present* o *at the moment*.", sample: m[0].trim(), soft: true } : null;
  },
  // Subject omitted before a perfect form: *Have been working on it since May.*
  proDropPerfect(text) {
    const s = sentencesOf(text).find((x) => /^(have|has|had)\s+(been|\w+ed|\w+en)\b/i.test(x) && !x.endsWith("?"));
    return s ? { msg: "Falta el sujeto. En inglés es obligatorio: *We have been working…*, *It has taken longer…*.", sample: s } : null;
  },
  // m26 · l126 · hedging ----------------------------------------------------
  // «la búsqueda parece que es lenta» → *the search seems that is slow*.
  seemsThat(text) {
    const m = text.match(/\b(?!it\b)\w+\s+(seems?|appears?|seemed|appeared)\s+that\s+(is|are|was|were|has|have|will|can|it's|isn't|doesn't|does)\b[^.!?]*/i);
    return m ? { msg: "Con un sujeto delante, *seem* va con *to*: *the search seems to be slow*. O empieza por *it*: *it seems that the search is slow*.", sample: m[0] } : null;
  },
  // «sinceramente» → *Sincerely, …* inside the message (not as the sign-off).
  sincerelyHonest(text) {
    const m = text.match(/\bsincerely,?\s+(i|we|the|it|this|that|our|they|you|there)\b[^.!?\n]*/i);
    return m ? { msg: "*Sincerely* solo cierra una carta (*Yours sincerely*). Para dar una opinión sincera: *to be honest*, *honestly* o *frankly*.", sample: m[0] } : null;
  },
  // «quizás no esté lista» → *the search maybe will not be ready*.
  maybeInside(text) {
    const m = text.match(/\b(we|they|it|he|she|i|you|search|test|launch|date|fix|team|this|that)\s+maybe\s+(will|won't|can|can't|is|are|be|need|needs|have|has)\b[^.!?]*/i);
    return m ? { msg: "*Maybe* va al principio de la frase (*Maybe the search won't be ready*). Dentro del verbo usa *may* o *might*: *the search may not be ready*.", sample: m[0] } : null;
  },
  // Three or more softeners in one sentence make the message vague.
  hedgeStack(text) {
    const hedge = /\b(maybe|perhaps|possibly|probably|might|may|could|a (little )?bit|a little|slightly|somewhat|kind of|sort of|seems?|appears?|i think|not quite|not so)\b/gi;
    const s = sentencesOf(text).find((x) => (x.match(hedge) || []).length >= 4);
    return s ? { msg: "Demasiados atenuadores en una frase: el mensaje se vuelve vago. Elige uno o dos que reflejen tu duda real y deja firme el dato.", sample: s, soft: true } : null;
  },
  // m26 · l127 · declining ---------------------------------------------------
  // «me encantaría, pero…» → *I'd love, but…* (to dropped).
  loveNoTo(text) {
    const m = text.match(/\b(i'd|i would|we'd|we would)\s+(love|like)\s*(,|but\b|\.)[^.!?]*/i);
    return m ? { msg: "Falta *to*: *I'd love to, but…*, *I'd like to, but…*. El *to* sustituye al verbo que no repites.", sample: m[0] } : null;
  },
  // «asistir a una reunión» → *assist the meeting*.
  assistAttend(text) {
    const m = text.match(/\bassist(ed|ing|s)?\s+(to\s+)?(the|a|an|our|your|this|that|tomorrow's|friday's|next week's)\s+(meeting|event|conference|presentation|session|workshop|launch|party|dinner|call|training|course|class)\b[^.!?]*/i);
    return m ? { msg: "*Assist* significa «ayudar». Para ir a una reunión o un evento: *attend the meeting*.", sample: m[0] } : null;
  },
  // «gracias por invitarme» → *thanks for invite me*.
  forBaseVerb(text) {
    const m = text.match(/\b(thanks|thank you|grateful)\s+for\s+(invite|think|come|send|let|make|give|take|ask|tell|consider|contact|share|offer|explain|include|remember)\b(?!s\b)[^.!?]*/i);
    return m ? { msg: "Después de *for*, el verbo va en -ing: *thanks for inviting me*, *thank you for thinking of us*.", sample: m[0] } : null;
  },
  // «rechazar su amable oferta» → *reject your kind offer*.
  rejectOffer(text) {
    const m = text.match(/\breject(ed|ing|s)?\s+(your|the|this|their|his|her|tom's|helen's)\s+(kind\s+|generous\s+)?(offer|invitation|help|proposal)\b[^.!?]*/i);
    return m ? { msg: "*Reject* juzga la propuesta como mala y suena duro. Para un no cortés: *decline* o *turn down* (*we'll have to decline your kind offer*).", sample: m[0], soft: true } : null;
  },
  // m26 · l128 · constraints and mixed conditionals ----------------------------
  // *would* in the if-clause: *if we would have tested…*.
  ifWouldHave(text) {
    // Polite "if you would like / if it would help" is correct English, so those verbs are skipped.
    const m = text.match(/\bif\s+(we|i|you|they|he|she|it|someone|anyone|the \w+)(\s+would\s+(?!like\b|prefer\b|mind\b|help\b|kindly\b|be willing\b|be so kind\b)(have\s+)?\w+|'d\s+have\s+(\w+(ed|en)|known|done|made|told|thought|sent|had))\b[^.!?]*/i);
    return m ? { msg: "La parte del *if* no lleva *would*. Pasado irreal: *if we had tested* (o *if we'd tested*), y *would* va en la otra parte: *we would have more options now*.", sample: m[0] } : null;
  },
  // «realizar el proyecto» → *realize the project*.
  realizeWork(text) {
    const m = text.match(/\breali[sz](e|ed|ing)\s+(the|a|an|this|that|our|these|those)\s+(\w+\s+)?(project|rebuild|work|task|changes?|migration|test|tests|testing|analysis|study|tutorials?|videos?|fix|update|production|review)\b[^.!?]*/i);
    return m ? { msg: "*Realize* significa «darse cuenta». Para «realizar» un trabajo: *carry out*, *do*, *complete* o *produce*.", sample: m[0] } : null;
  },
  // «el presupuesto actual» → *the actual budget*.
  actualCurrent(text) {
    const m = text.match(/\b(the|our|your|their)\s+actual\s+(budget|plan|schedule|situation|timeline|date|version|team|contract|scope|status|deadline|system|platform)\b[^.!?]*/i);
    return m ? { msg: "*Actual* significa «real». Para «actual» (el de ahora) usa *current*: *the current budget*.", sample: m[0], soft: true } : null;
  },
  // «límites económicos» → *economic limits*.
  economicBudget(text) {
    const m = text.match(/\beconomic(al)?\s+(limits?|limitations?|constraints?|reasons?|resources|problems?|cost|costs|issues?)\b[^.!?]*/i);
    return m ? { msg: "*Economic* se refiere a la economía de un país. En un proyecto: *budget constraints*, *financial reasons*; para «barato», *inexpensive*.", sample: m[0], soft: true } : null;
  },
  // m26 · l129 · alternatives and counter-proposals ----------------------------
  // «te sugiero que añadas» → *I suggest you to add*.
  suggestTo(text) {
    const m = text.match(/\bsuggest(s|ed|ing)?\s+(you|him|her|them|us|me|laura|tom|helen)\s+to\s+\w+[^.!?]*/i);
    return m ? { msg: "*Suggest* no lleva objeto + *to*: *I suggest adding a guide* o *I suggest (that) you add a guide*.", sample: m[0] } : null;
  },
  // «en vez de mover» → *instead of move*.
  insteadOfBase(text) {
    const m = text.match(/\binstead of\s+(move|add|wait|launch|make|do|send|produce|record|use|build|change|delay|cancel|go|have|create|write|try)\b(?!s\b)[^.!?]*/i);
    return m ? { msg: "*Instead of* es una preposición: el verbo va en -ing. *Instead of moving go-live…*.", sample: m[0] } : null;
  },
  // *provided / as long as* + will: «siempre que lo mantengamos» → *provided we will keep*.
  providedWill(text) {
    const m = text.match(/\b(provided( that)?|providing( that)?|as long as|unless)\s+[^,.!?]{0,30}?\b(will|'ll|won't)\b[^.!?]*/i);
    return m ? { msg: "Tras *provided (that)*, *as long as* y *unless*, el futuro va en presente: *provided your team writes the scripts*, no *will write*.", sample: m[0] } : null;
  },
  // «le proponemos un enfoque» → *we propose you a phased approach*.
  proposeYou(text) {
    const m = text.match(/\bpropos(e|ed|ing)\s+(you|him|her|them|us)\s+(a|an|the|to|that)\b[^.!?]*/i);
    return m ? { msg: "*Propose* lleva la cosa propuesta: *we propose a phased approach* (o *we propose to you…*). La persona no va justo después del verbo.", sample: m[0] } : null;
  },
  // «¿qué tal añadir…?» → *how about add…*.
  howAboutBase(text) {
    const m = text.match(/\bhow about\s+(add|move|launch|make|do|send|produce|use|try|wait|keep|ask|start|record|write|create|have)\b(?!s\b)[^.!?]*/i);
    return m ? { msg: "*How about* va con -ing (o con un sustantivo): *how about adding just the invoice filter?*", sample: m[0] } : null;
  },
  // m26 · l130 · bad news ------------------------------------------------------
  // «os decepcionará» → *will deceive you*.
  deceiveDisappoint(text) {
    const m = text.match(/\b(deceiv\w*|deception)\b[^.!?]*/i);
    return m ? { msg: "*Deceive* es «engañar». «Decepcionar» es *disappoint*; «decepción», *disappointment*.", sample: m[0] } : null;
  },
  // «lamentamos informar que» → *we regret to inform that*.
  informNoObject(text) {
    const m = text.match(/\binform(ed|ing|s)?\s+(that|about)\b[^.!?]*/i);
    return m ? { msg: "*Inform* necesita a la persona: *we regret to inform you that…*, *I'll inform the board of…*.", sample: m[0] } : null;
  },
  // «disculpen las molestias» → *sorry for the inconveniences*.
  inconveniences(text) {
    const m = text.match(/\b(the|these|any|all the)\s+inconveniences\b[^.!?]*/i);
    return m ? { msg: "En las disculpas, *inconvenience* va en singular: *we apologize for any inconvenience*.", sample: m[0] } : null;
  },
  // *The news are…*
  newsAre(text) {
    const m = text.match(/\b(the|this|that|some|bad|good|disappointing)\s+news\s+(are|were|have been)\b[^.!?]*/i);
    return m ? { msg: "*News* es incontable y va en singular: *the news is disappointing*.", sample: m[0] } : null;
  },
};
