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
