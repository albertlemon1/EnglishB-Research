// Heuristic "assisted self-check": scans the learner's text for typical Spanish-L1 slips.
// These are hints for review, never verdicts — the final judgement is the learner's.

const sentencesOf = (text) => text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
const DETERMINERS = new Set(["the", "a", "an", "my", "your", "our", "his", "her", "their", "its", "this", "that", "these", "those", "it", "them", "me", "us", "him", "you", "some", "any", "all", "each", "every", "no", "new", "being", "having"]);

function prepositionTo(text, triggers) {
  const hits = [];
  const re = new RegExp(`\\b(${triggers})\\s+to\\s+([a-z']+)`, "gi");
  let m;
  while ((m = re.exec(text))) {
    const next = m[2].toLowerCase();
    if (!next.endsWith("ing") && !DETERMINERS.has(next)) hits.push(m[0]);
  }
  return hits;
}

export const CHECKS = {
  proDrop(text) {
    const bad = sentencesOf(text).filter((s) => !s.endsWith("?") && /^(am|is|are|was|were|have|has|will|can|was)\b/i.test(s) && !/^(is it|are you|are we|have you|has he|has she|can you|will you|can we|will we)\b/i.test(s));
    const impersonal = text.match(/(^|[.!?]\s+)(is|was)\s+(important|necessary|possible|difficult|easy|hard|great|good|true)\b/gi) || [];
    if (!bad.length && !impersonal.length) return null;
    return { msg: "Hay una oración que empieza con un verbo sin sujeto. En inglés el sujeto es obligatorio: *I am…*, *It is important…*", sample: (bad[0] || impersonal[0]).trim() };
  },
  alreadyEnd(text) {
    const m = text.match(/\b(have|has|'ve|'s)\s+[a-z]+(ed|en|t|ne|ld|ght)\b[^.!?]{0,40}\balready\s*[.!?]/i);
    return m ? { msg: "*Already* al final es posible para expresar sorpresa, pero en un mensaje neutro colócalo entre el auxiliar y el participio: *I've already booked…*", sample: m[0] } : null;
  },
  yetAffirmative(text) {
    const s = sentencesOf(text).find((x) => /\byet\b/i.test(x) && !x.endsWith("?") && !/(n't|n’t|\bnot\b|\bnever\b|\bno\b)/i.test(x) && !/^yet\b/i.test(x));
    return s ? { msg: "*Yet* se usa en negativas y preguntas. En afirmaciones de tareas hechas, usa *already*.", sample: s } : null;
  },
  toInfinitive(text) {
    const hits = prepositionTo(text, "adjusting|adjust|adjusted|adapted|adapting|adapt|used|prior|forward|acclimating|acclimate|committed");
    const filtered = hits.filter((h) => !/^used to/i.test(h) || /\b(am|is|are|was|were|be|been|being|get|got|getting|'m|'s|'re)\s+used to/i.test(text.slice(Math.max(0, text.indexOf(h) - 12), text.indexOf(h) + h.length)));
    return filtered.length ? { msg: "Después de *adjust to / get used to / prior to / look forward to*, *to* es preposición: usa verbo en -ing.", sample: filtered[0] } : null;
  },
  beOmission(text) {
    const m = text.match(/\b(I|we|they|you|he|she)\s+(adjusting|getting|trying|handling|managing|working|studying|waiting|planning|building|learning|starting|doing)\b/i);
    return m ? { msg: "Falta el auxiliar *be* en una forma continua: *I am adjusting*, *we are working*.", sample: m[0] } : null;
  },
  actually(text) {
    const m = text.match(/[^.!?]*\bactually\b[^.!?]*[.!?]?/i);
    return m ? { msg: "Revisa *actually*: significa «en realidad», no «actualmente». Para «actualmente», usa *currently* o *at the moment*.", sample: m[0].trim(), soft: true } : null;
  },
  capitalI(text) {
    const m = text.match(/(^|[\s,.;:!?"(])i(\s|'m|'ve|'ll|'d)/);
    return m ? { msg: "El pronombre *I* siempre va en mayúscula, también en *I'm*, *I've*, *I'll*.", sample: m[0].trim() } : null;
  },
  moveOnNoTo(text) {
    const m = text.match(/\bmov(e|es|ed|ing)\s+on\s+(?!to\b)(the|my|our|a|an|next|another)\b[^.!?]{0,20}/i);
    return m ? { msg: "Falta *to*: *move on to the next step*.", sample: m[0] } : null;
  },
  untilDeadline(text) {
    const m = text.match(/\b(finish|complete|send|submit|deliver|have|get|done|ready)\b[^.!?]{0,30}\buntil\s+(tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|noon|the end)/i);
    return m ? { msg: "¿Es un plazo límite? Entonces usa *by* (*by Friday*). *Until* indica duración.", sample: m[0] } : null;
  },
  runOutOfProblem(text) {
    const m = text.match(/\bran out of (a|an|some)?\s*(problem|issue|error|delay|difficulty)/i);
    return m ? { msg: "Para «toparse con un problema» se usa *run into*. *Run out of* = quedarse sin algo.", sample: m[0] } : null;
  },
  perfectWithPastTime(text) {
    const s = sentencesOf(text).find((x) => /\b(have|has|'ve)\s+(\w+\s+){0,3}?\w+(ed|en|ne|ght|t)\b/i.test(x) && /\b(yesterday|last (week|month|year|night|summer|term)|\d+ (days?|weeks?|months?|years?) ago|in (19|20)\d\d)\b/i.test(x) && !/\bsince\b/i.test(x));
    return s ? { msg: "Con un momento terminado (*last month, yesterday, ago*) usa Past Simple, no Present Perfect.", sample: s } : null;
  },
  teamHave(text) {
    const m = text.match(/\b(the|our|my) (team|group|class|company)\s+have\s+\w+/i);
    return m ? { msg: "En inglés americano, *team / group* van en singular: *The team has…* (en Reino Unido se acepta *have*).", sample: m[0], soft: true } : null;
  },
  wellPositioned(text) {
    const m = text.match(/\bwell positioned\b/i);
    return m ? { msg: "Escribe *well-positioned* con guion, sobre todo delante de un sustantivo.", sample: m[0], soft: true } : null;
  },
  // «Vivo aquí desde 2020» → *I live here since 2020*: present tense for something that continues.
  presentSince(text) {
    const since = /\bsince\b/i;
    const forDuration = /\bfor\s+(a|one|two|three|four|five|six|seven|eight|nine|ten|\d+|many|several|a few)\s+(years?|months?|weeks?|days?)\b/i;
    const presentSimple = /\b(I|we|you|they|he|she)\s+(live|lives|work|works|study|studies|know|knows)\b/i;
    // "I'm here for two weeks" (a visit) is fine, so be + place only counts with *since*.
    const presentBe = /\b(I am|I'm|we are|we're|he is|she is|he's|she's|they are|they're)\s+(here|in|at|married)\b/i;
    const s = sentencesOf(text).find((x) => !/\b(have|has|had)\b|'ve\b|'s been\b/i.test(x)
      && (((since.test(x) || forDuration.test(x)) && presentSimple.test(x)) || (since.test(x) && presentBe.test(x))));
    return s ? { msg: "Para algo que empezó en el pasado y sigue ahora, usa Present Perfect: *I've lived here since 2020*, no *I live here since 2020*.", sample: s } : null;
  },
  sinceDuration(text) {
    const m = text.match(/\bsince\s+(a|one|two|three|four|five|six|seven|eight|nine|ten|\d+|many|several|a few)\s+(years?|months?|weeks?|days?)\b/i);
    return m ? { msg: "Con una duración usa *for* (*for five years*). *Since* va con el punto de inicio (*since 2020*, *since I was a child*).", sample: m[0] } : null;
  },
  tagIsntItAll(text) {
    const m = text.match(/\b(you|we|they|I|he|she)\b[^.!?,]*,\s*isn't it\?/i);
    return m ? { msg: "La question tag cambia con cada frase: *You live here, don't you?* · *She's coming, isn't she?* *Isn't it?* solo encaja con *it is*.", sample: m[0] } : null;
  },
  tagAuxMismatch(text) {
    const past = text.match(/\b(went|was|were|had|saw|met|came|made|took|got|said|told|\w+ed)\b[^.!?]*,\s*(don't|doesn't)\s+(you|he|she|they|we)\?/i);
    if (past) return { msg: "La tag copia el tiempo del verbo: con Past Simple usa *didn't*: *You went to the meetup, didn't you?*", sample: past[0], soft: true };
    const perfect = text.match(/\b(have|has|'ve)\s+\w+[^.!?]*,\s*(didn't|did)\s+(you|he|she|they|we)\?/i);
    return perfect ? { msg: "Con Present Perfect la tag usa *have/has*: *You've been there, haven't you?*", sample: perfect[0], soft: true } : null;
  },
  indirectQuestion(text) {
    const m = text.match(/\b(tell me|know|wonder|ask you|explain)\s+(where|what|when|who|how|why|which)\s+(is|are|was|were|do|does|did)\s+(the|it|he|she|they|you|we|this|that)\b[^.!?]*/i);
    return m ? { msg: "Después de *Could you tell me…?* el orden es de afirmación: *Could you tell me where the café is?*, no *where is the café*.", sample: m[0], soft: true } : null;
  },
  justPosition(text) {
    const m = text.match(/\b(have|has|'ve|'s)\s+(\w+ed|sent|done|seen|made|written|got|taken|read|heard|met|found|left|begun)\s+just\b/i);
    return m ? { msg: "*Just* va entre el auxiliar y el participio: *I've just sent you the photos*.", sample: m[0] } : null;
  },
  makeFriendsDo(text) {
    const m = text.match(/\b(do|does|did|doing|done)\s+(a lot of\s+|lots of\s+|many\s+|some\s+|new\s+)*friends\b/i);
    return m ? { msg: "«Hacer amigos» es *make friends*: *I made a lot of friends*, no *did friends*.", sample: m[0] } : null;
  },
  knowMeet(text) {
    const m = text.match(/\b(knew|know)\s+(him|her|them|\w+)\s+(yesterday|last\s+\w+|at\s+(a|an|the)\s+\w+|in\s+(19|20)\d\d)\b/i);
    return m ? { msg: "«Conocer» a alguien por primera vez es *meet* (*I met Priya at the event*). *Know* es conocer a alguien desde hace tiempo.", sample: m[0], soft: true } : null;
  },
  // --- Módulo 3 (tecnología) ---
  // «Si pulsas, se abrirá» → *If you will tap*: no *will* tras if.
  ifWill(text) {
    const m = text.match(/\bif\s+(I|you|we|they|he|she|it|the\s+\w+|my\s+\w+|someone|somebody)\s+will\b/i);
    return m ? { msg: "Tras *if* va el presente simple, no *will*: *If you tap the icon, the app opens.*", sample: m[0] } : null;
  },
  forToInfinitive(text) {
    const m = text.match(/\bfor\s+to\s+[a-z]+/i);
    return m ? { msg: "«Para + verbo» es *to* + verbo (*to send*) o *for* + -ing (*for sending*), nunca *for to*.", sample: m[0] } : null;
  },
  // *login* (sustantivo) frente a *log in* (verbo); igual con back up / set up / log out.
  loginVerb(text) {
    const m = text.match(/\b(I|you|we|they|to|please|can|could|will|don't|never|always)\s+(login|logout|backup|setup)\b/i);
    return m ? { msg: "Como verbo se escribe en dos palabras: *log in*, *log out*, *back up*, *set up*. En una palabra son sustantivos (*my login*, *a backup*).", sample: m[0] } : null;
  },
  couldTo(text) {
    const m = text.match(/\b(could|can|would|will|should)\s+(you\s+|I\s+|we\s+)?to\s+[a-z]+/i);
    return m ? { msg: "Tras *could / can / would* va el verbo base, sin *to*: *Could you give me access?*", sample: m[0] } : null;
  },
  mindTo(text) {
    const m = text.match(/\bmind\s+to\s+[a-z]+/i);
    return m ? { msg: "*Would you mind* se combina con -ing: *Would you mind sending the request?*", sample: m[0] } : null;
  },
  noImperative(text) {
    const m = text.match(/(^|[.!?]\s+|\n)no\s+(share|click|open|use|send|give|tell|forget|close|delete|download|install)\b/i);
    return m ? { msg: "La prohibición se forma con *Don't* + verbo base: *Don't share your password.*", sample: m[0].trim() } : null;
  },
  whyDontTo(text) {
    const m = text.match(/\bwhy\s+(don't|do not)\s+(you|we|I)\s+to\s+[a-z]+/i);
    return m ? { msg: "Tras *Why don't you* va el verbo base, sin *to*: *Why don't you mute them?*", sample: m[0] } : null;
  },
  uncountable(text) {
    const m = text.match(/\b(advices|informations|softwares|feedbacks|stuffs|knowledges|furnitures)\b/i);
    return m ? { msg: "Estas palabras son incontables y no llevan -s: *advice, information, software, feedback*.", sample: m[0] } : null;
  },
  makeDoList(text) {
    const m = text.match(/\b(do|did|doing)\s+(a|my|the|your)\s+(to-do\s+)?list\b/i);
    return m ? { msg: "«Hacer una lista» es *make a list*, no *do a list*.", sample: m[0] } : null;
  },
  unlessNot(text) {
    const m = text.match(/\bunless\s+(you|I|we|they|he|she|it|\w+)\s+(don't|doesn't|didn't|do not|does not|won't|can't)\b/i);
    return m ? { msg: "*Unless* ya significa «si no»: no añadas otro negativo. *Unless you click the link, you're safe.*", sample: m[0] } : null;
  },
  doubleNegative(text) {
    const m = text.match(/\b(don't|do not|never)\s+(never|nobody|nothing|no one|nowhere)\b/i);
    return m ? { msg: "En inglés estándar basta un solo negativo: *Never share…* o *Don't ever share…*", sample: m[0] } : null;
  },
  onceWill(text) {
    const m = text.match(/\b(once|as soon as)\s+[^.!?,]{0,40}\bwill\b/i);
    return m ? { msg: "Tras *once / as soon as* va el presente simple, no *will*: *Once the menu opens, select…*", sample: m[0] } : null;
  },
  atTheEnd(text) {
    const m = text.match(/\bat the end\s*,|\bat first\s*,/i);
    return m ? { msg: "Para el último paso usa *Finally* y para el primero *First*. *At the end* y *At first* tienen otro sentido.", sample: m[0], soft: true } : null;
  },
  afterOf(text) {
    const m = text.match(/\bafter of\b/i);
    return m ? { msg: "«Después de eso» es *after that*; *after* no lleva *of*.", sample: m[0] } : null;
  },
  enterApp(text) {
    const m = text.match(/\benter\s+(in|into|to)\b|\benter\s+(the|your|my)\s+(app|settings|menu|website|site|account)\b/i);
    return m ? { msg: "«Entrar en una app» es *open the app* o *go to*. *Enter* se usa para introducir datos (*enter the code*).", sample: m[0], soft: true } : null;
  },
  // --- Módulo 4 (problemas prácticos) ---
  tooMuchAdj(text) {
    const m = text.match(/\btoo\s+much\s+(slow|fast|big|small|long|short|strong|weak|old|new|good|bad|loud|quiet|bright|dark|hot|cold|warm|cheap|expensive|heavy|light|reliable|stable|safe|easy|difficult|hard|complicated|high|low|full|clear|powerful)\b/i);
    return m ? { msg: "«Demasiado lento» es *too slow*: con adjetivos, *too* va sin *much*. *Too much* va con sustantivos incontables (*too much noise*).", sample: m[0] } : null;
  },
  enoughBeforeAdj(text) {
    const m = text.match(/\benough\s+(slow|fast|big|small|long|short|strong|weak|old|new|good|bad|loud|quiet|bright|dark|hot|cold|warm|cheap|expensive|heavy|light|reliable|stable|safe|easy|difficult|hard|complicated|high|low|full|clear|powerful)\b(?!\s+(time|space|memory|power|money|storage|data|signal|light|room|battery|people|chairs|cables?|plugs?|outlets?))/i);
    return m ? { msg: "Con adjetivos, *enough* va detrás: *strong enough*, *long enough*. Con sustantivos, delante: *enough time*.", sample: m[0] } : null;
  },
  keepTo(text) {
    const m = text.match(/\bkeep(s|ing)?\s+to\s+(crash|freeze|fail|disconnect|drop|stop|show|happen|break|restart|flicker|beep|pop|ask|switch|turn|lose)\b/i);
    return m ? { msg: "*Keep* se combina con -ing: *it keeps crashing*, no *keeps to crash*.", sample: m[0] } : null;
  },
  doesntS(text) {
    const m = text.match(/\b(doesn't|does not|didn't|did not)\s+(works|turns|starts|loads|opens|charges|connects|responds|prints|lasts|reaches|stops|fits|shows)\b/i);
    return m ? { msg: "Después de *doesn't / didn't* el verbo va sin -s: *it doesn't work*.", sample: m[0] } : null;
  },
  explainMe(text) {
    const m = text.match(/\bexplain(s|ed|ing)?\s+(me|us|him|her|them)\b/i);
    return m ? { msg: "«Explícame» es *explain it to me*: primero lo que se explica y después *to* + persona.", sample: m[0] } : null;
  },
  messageTells(text) {
    const m = text.match(/\b(message|screen|error|it|the app|the system)\s+(tells|told)\s+(that|me that)?\s*(the|it|my|your|there|you)\b/i);
    return m && !/\btells\s+(me|you|us|him|her|them)\s+to\b/i.test(m[0]) ? { msg: "Para citar un mensaje se usa *say*: *it says the disk is full*. *Tell* necesita a quién.", sample: m[0], soft: true } : null;
  },
  askFor(text) {
    const m = text.match(/\bask(s|ed|ing)?\s+(a|an|the|my|your)\s+(refund|replacement|repair|discount|new one|exchange)\b/i);
    return m ? { msg: "«Pedir algo» es *ask for* + cosa: *I asked for a refund*. Sin *for*, *ask* significa «preguntar».", sample: m[0] } : null;
  },
  returnMoney(text) {
    const m = text.match(/\breturn\s+(me\s+|us\s+)?(the|my|our)\s+money\b/i);
    return m ? { msg: "Para el dinero se usa *refund*: *Could you refund me?* / *Can I get a refund?* *Return* es devolver el producto.", sample: m[0] } : null;
  },
  mightTo(text) {
    const m = text.match(/\b(might|may|should|must)\s+to\s+[a-z]+/i);
    return m ? { msg: "Tras *might / may / should* va el verbo base, sin *to*: *we might use my laptop*.", sample: m[0] } : null;
  },
  doubtsQuestions(text) {
    const m = text.match(/\b(any|some|have|has|had)\s+(more\s+|further\s+|other\s+)?doubts\b/i);
    return m ? { msg: "«Si tiene alguna duda» es *if you have any questions*. *Doubts* suena a desconfianza.", sample: m[0], soft: true } : null;
  },
  aHour(text) {
    const m = text.match(/\ba\s+(hour|hours|honest|honour|honor|heir)\b/i);
    return m ? { msg: "La h de *hour* es muda: suena a vocal, así que va con *an*: *an hour*.", sample: m[0] } : null;
  },
};

export function runChecks(text, ids = []) {
  return ids.map((id) => {
    const fn = CHECKS[id];
    if (!fn) return null;
    const r = fn(text);
    return r ? { id, ...r } : null;
  }).filter(Boolean);
}

export function wordCount(text) {
  return (text.trim().match(/[A-Za-zÀ-ÿ0-9'’-]+/g) || []).length;
}
