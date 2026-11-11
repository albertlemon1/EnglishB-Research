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
};
