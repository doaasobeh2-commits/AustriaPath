/**
 * Placement-only AI turn evaluation.
 * Does NOT modify shared /ai/completions behavior.
 * Uses aiPlacementLibrary models read-only. No ExaminerMind / council.
 */

import { getPlacementModel } from "../../../src/data/aiPlacementLibrary.js";
import { getPlacementBildAssessmentPack } from "../../../src/data/placementBildAssessmentPacks.js";
import {
  buildPlanningEvidenceLedger,
  getPlacementPlanningMove,
  getPlacementPlanningPack,
  planningTopicsFromLedger,
  selectNextPlanningMove,
} from "../../../src/data/placementPlanningPacks.js";
import { AppError } from "../middleware/errorHandler.js";
import { env } from "../config/env.js";
import { withAuthorizedPlacementUsage } from "./placementEntitlementService.js";

export const PLACEMENT_MAX_FOLLOWUPS = 2;
export const PLACEMENT_EVAL_METHOD = "placement-ai-turn-v1";

const BANDS = new Set(["weak", "medium", "strong"]);
const FOLLOW_UP_SOURCES = new Set([
  "followUpRules",
  "examinerQuestions",
  "missingTopic",
]);

function normalizeText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/\s+/g, " ")
    .trim();
}

function sectionTranscript(conversation = []) {
  return normalizeText(
    (Array.isArray(conversation) ? conversation : [])
      .map((turn) => turn?.transcript || "")
      .join(" ")
  );
}

function isImageLocationQuestion(question) {
  const text = normalizeText(question);
  return /\bwo\b|wo befinden|an welchem ort|where are|where is/.test(text);
}

function isImageActionQuestion(question) {
  const text = normalizeText(question);
  return /was (machen|tun)|womit .*beschaftigt|welche aktivitat|what are .*doing|what .*doing/.test(
    text
  );
}

function imageFollowUpDimension(question) {
  const text = normalizeText(question);
  if (isImageLocationQuestion(text)) return "location";
  if (isImageActionQuestion(text)) return "action";
  if (/was sehen|wer ist|wer sind|wie viele personen|what do you see|who is|who are/.test(text)) {
    return "basic_description";
  }
  if (/\bwarum\b|\bweshalb\b|grund|folge|why|reason|consequence/.test(text)) {
    return "reasoning";
  }
  if (/heimat|herkunftsland|vergleich|bei uns|home country|compare/.test(text)) {
    return "comparison";
  }
  if (/erfahrung|erlebt|schon einmal|bei ihnen|experience|have you ever/.test(text)) {
    return "experience";
  }
  if (/meinung|wie finden|was halten|wie wirkt|wichtig|think|opinion|how does .*feel/.test(text)) {
    return "opinion";
  }
  return "other";
}

function sectionHasDimensionEvidence(dimension, conversation = []) {
  const text = sectionTranscript(conversation);
  if (dimension === "location") return hasImageLocationEvidence(conversation);
  if (dimension === "action") return hasImageActionEvidence(conversation);
  if (dimension === "basic_description") {
    return text.split(" ").filter(Boolean).length >= 5;
  }
  if (dimension === "reasoning") {
    return /\b(weil|deshalb|daher|denn|der grund|because|therefore|the reason)\b/.test(
      text
    );
  }
  if (dimension === "comparison") {
    return /\b(in meiner heimat|in meinem herkunftsland|bei uns|im vergleich|in my home country|compared with)\b/.test(
      text
    );
  }
  if (dimension === "experience") {
    return /\b(ich habe .*erlebt|ich war schon|meine erfahrung|bei mir|i have experienced|i have been|my experience)\b/.test(
      text
    );
  }
  if (dimension === "opinion") {
    return /\b(ich finde|ich denke|meiner meinung nach|fur mich|i think|in my opinion|for me)\b/.test(
      text
    );
  }
  return false;
}

function hasImageLocationEvidence(conversation = []) {
  const text = sectionTranscript(conversation);
  return /\b(im|in der|in einer|in einem|auf dem|auf der|an einem|an der|bei der|beim|inside|at the|in a|in the)\s+[a-z]/.test(
    text
  );
}

function hasImageActionEvidence(conversation = []) {
  const text = sectionTranscript(conversation);
  return /\b(machen|tun|arbeiten|spielen|kochen|essen|trinken|sprechen|reden|kaufen|verkaufen|bezahlen|warten|lesen|schreiben|lernen|eroffnen|offnen|beantragen|beraten|sitzen|stehen|gehen|fahren|doing|working|playing|cooking|eating|talking|buying|paying|waiting|reading|writing|learning|opening|applying|sitting|standing|walking)\b/.test(
    text
  );
}

const COVERAGE = Object.freeze({
  NOT_COVERED: "not_covered",
  PARTIAL: "partial",
  SUFFICIENT: "sufficient",
});

function coverageState(text, { mention, sufficient }) {
  if (sufficient.test(text)) return COVERAGE.SUFFICIENT;
  if (mention.test(text)) return COVERAGE.PARTIAL;
  return COVERAGE.NOT_COVERED;
}

function matchesBildPatterns(text, patterns = []) {
  return patterns.some((pattern) => {
    try {
      return new RegExp(normalizeText(pattern), "i").test(text);
    } catch {
      return false;
    }
  });
}

export function getBildEvidenceCoverage(pack, conversation = []) {
  const text = sectionTranscript(conversation);
  const result = {};
  for (const evidence of pack?.referenceEvidence || []) {
    const sufficient = matchesBildPatterns(text, evidence.sufficient || []);
    const partial = matchesBildPatterns(text, evidence.mention || []);
    result[evidence.id] = sufficient
      ? COVERAGE.SUFFICIENT
      : partial
        ? COVERAGE.PARTIAL
        : COVERAGE.NOT_COVERED;
  }
  return result;
}

export function getEligibleBildFollowUps(pack, conversation = [], semanticCovered = []) {
  if (!pack) return [];
  const coverage = getBildEvidenceCoverage(pack, conversation);
  const alreadyAskedTexts = new Set(
    (Array.isArray(conversation) ? conversation : [])
      .map((turn) => normalizeText(turn?.question || ""))
      .filter(Boolean)
  );
  const askedIntents = new Set(
    (Array.isArray(conversation) ? conversation : [])
      .map((turn) => pack.followUpBank.find(
        (question) => normalizeText(question.question) === normalizeText(turn?.question || "")
      )?.intent)
      .filter(Boolean)
  );
  const providerCovered = new Set(
    (Array.isArray(semanticCovered) ? semanticCovered : [])
      .map((item) => normalizeText(item))
      .filter(Boolean)
  );
  const evidencePriority = new Map(
    (pack.referenceEvidence || []).map((item) => [item.id, item.priority ?? 9])
  );

  return pack.followUpBank
    .filter((question) => !alreadyAskedTexts.has(normalizeText(question.question)))
    .filter((question) => !askedIntents.has(question.intent))
    .filter((question) => !providerCovered.has(normalizeText(question.intent)))
    .filter((question) => coverage[question.intent] !== COVERAGE.SUFFICIENT)
    .filter((question) => (question.prerequisites || []).every(
      (intent) => coverage[intent] === COVERAGE.SUFFICIENT
    ))
    .map((question, index) => ({ ...question, index, evidenceState: coverage[question.intent] }))
    .sort((a, b) => {
      const partialDelta = Number(b.evidenceState === COVERAGE.PARTIAL) - Number(a.evidenceState === COVERAGE.PARTIAL);
      if (partialDelta) return partialDelta;
      const priorityDelta = (evidencePriority.get(a.intent) ?? 9) - (evidencePriority.get(b.intent) ?? 9);
      return priorityDelta || a.index - b.index;
    })
    .map(({ index, evidenceState, ...question }) => question);
}

export function selfQuestionTopic(question) {
  const text = normalizeText(question);
  if (/wie heissen|name/.test(text)) return "name";
  if (/wie ist das in ihrem heimatland/.test(text)) return "comparison";
  if (/woher|herkunft|heimat/.test(text)) return "origin";
  if (/wie lange leben.*osterreich/.test(text)) return "residence_duration";
  if (/wo wohnen/.test(text)) return "residence";
  if (/was machen sie (?:dort|bei der arbeit) genau?|was machen sie bei der arbeit/.test(text)) return "work_details";
  if (/gefallt ihnen ihre arbeit|wie finden sie ihre arbeit/.test(text)) return "work_opinion";
  if (/arbeiten sie.*kurs|arbeit oder/.test(text)) return "current_activity";
  if (/was arbeiten/.test(text)) return "work";
  if (/kurs|ausbildung|studium/.test(text)) return "course_education";
  if (/gern zusammen/.test(text)) return "family_detail";
  if (/familie oder kinder|familie|kinder/.test(text)) return "family";
  if (/wie oft machen|mit wem machen/.test(text)) return "hobby_detail";
  if (/freizeit|hobby|wochenende/.test(text)) return "leisure";
  if (/normalerweise an einem tag|morgens und abends|normalerweise morgens|normaler tag/.test(text)) return "daily_routine";
  if (/am anfang in osterreich|in osterreich erlebt|erfahrungen.*osterreich/.test(text)) return "past_experience";
  if (/deutschlernen schwierig|beim deutschlernen schwierig/.test(text)) return "german_difficulty";
  if (/hilft ihnen (?:beim lernen|dabei)/.test(text)) return "learning_strategy";
  if (/warum lernen sie deutsch|deutsch.*zukunft wichtig/.test(text)) return "german_reason";
  if (/seit wann lernen sie deutsch/.test(text)) return "german_duration";
  if (/beruflich.*zukunft|spater arbeiten|welche arbeit.*spater machen/.test(text)) return "professional_goal";
  if (/in zukunft.*machen/.test(text)) return "future_plan";
  if (/warum mochten sie das|warum denken sie so/.test(text)) return "reason";
  if (/beispiel nennen/.test(text)) return "example";
  if (/gut leben und.*dazugehoren/.test(text)) return "integration_opinion";
  return null;
}

export function getSelfTopicCoverage(conversation = []) {
  const text = sectionTranscript(conversation);
  const state = (mention, sufficient = mention) => coverageState(text, { mention, sufficient });
  return {
    name: state(/\b(name|heiss\w*)\b/, /\b(?:ich\s+)?(?:heisse|name)\s+(?!ist\b)[a-z]{2,}|\bmein name ist\s+[a-z]{2,}/),
    origin: state(/\b(komme|kommen|herkunft|heimat)\b/, /\b(?:ich\s+)?komm\w*\s+(?:aus\s+)?[a-z]{3,}|\b(?:herkunft|heimat)(?:sland)?\s+(?:ist\s+)?[a-z]{3,}/),
    residence: state(/\b(wohn\w*|leb\w*|wohnort)\b/, /\b(?:ich\s+)?(?:wohn\w*|leb\w*)\s+(?:seit\s+[^,.]+\s+)?(?:in\s+)?[a-z]{3,}|\bwohnort\s+(?:ist\s+)?[a-z]{3,}/),
    residence_duration: state(/\bseit\b/, /\bseit\s+(?:\d+|ein\w*|zwei|drei|vier|funf|sechs|sieben|acht|neun|zehn)\s+(?:tag\w*|monat\w*|jahr\w*)\b/),
    current_activity: state(/\b(arbeit\w*|beruf\w*|job|kurs|schule|ausbildung|studier\w*|beschaftigt|arbeitslos|arbeitssuchend)\b/, /\b(?:arbeite|arbeiten)\s+(?!manchmal\b|gelegentlich\b)[^,.]+|\bvon beruf bin ich\s+[^,.]+|\b(?:bin|ist)\s+[^,.]{2,80}\bbeschaftigt\b|\b(?:mache|besuche|gehe|studiere?)\b[^,.]*(?:kurs|schule|ausbildung|studium|universitat)\b|\bdeutschkurs\b|\b(?:bin|ist)\s+(?:arbeitslos|arbeitssuchend)\b/),
    work: state(/\b(arbeit\w*|beruf\w*|job|beschaftigt|arbeitslos|arbeitssuchend)\b/, /\b(?:arbeite|arbeiten)\s+(?!manchmal\b|gelegentlich\b)(?:(?:als|bei|in|im|auf)\s+)?[^,.]+|\bvon beruf bin ich\s+[^,.]+|\bmein beruf ist\s+[^,.]+|\b(?:bin|ist)\s+[^,.]{2,80}\bbeschaftigt\b|\b(?:bin|ist)\s+(?:arbeitslos|arbeitssuchend)\b/),
    occupation: state(/\b(beruf|job|arbeite)\b/, /\b(?:arbeite|tatig)\s+als\s+[^,.]+|\bvon beruf bin ich\s+[^,.]+|\bmein beruf ist\s+[^,.]+/),
    work_details: state(/\b(kontrollier\w*|bereit\w*|bedien\w*|verkauf\w*|liefer\w*|reparier\w*|organisier\w*|betreu\w*|pflege\w*)\b/),
    course_education: state(/\b(kurs|schule|ausbildung|studier\w*|studium|universitat)\b/, /\b(?:mache|besuche|gehe|bin|studiere?)\s+(?:in|auf|an|einen?|einer?)?\s*[^,.]*(?:kurs|schule|ausbildung|studium|universitat)\b|\bdeutschkurs\b/),
    family: state(/\b(familie|verheiratet|kind\w*|sohn|tochter|ehemann|ehefrau|partner)\b/, /\b(?:bin|ist)\s+verheiratet\b|\b(?:habe|hat|mit)\s+(?:\w+\s+){0,3}(?:kind\w*|sohn|tochter)\b|\b(?:mein|meine)\s+(?:ehemann|ehefrau|partner)\b/),
    children: state(/\b(kind\w*|sohn|tochter)\b/, /\b(?:habe|hat|mit)\s+(?:\w+\s+){0,3}(?:kind\w*|sohn|tochter)\b/),
    family_detail: state(/\b(?:mit mein\w* (?:familie|kind\w*)|zusammen)\b[^,.]*(?:spiele|mache|gehe|esse|koche|fahre|besuche|sehe)|\b(?:spiele|mache|gehe|esse|koche|fahre)\b[^,.]*\bzusammen\b/),
    leisure: state(/\b(hobby|hobbys|freizeit|wochenende|sport|fussball|schach|wandern|schwimmen)\b/, /\b(?:in meiner freizeit|am wochenende|nach der arbeit)\s+(?:\w+\s+){0,5}(?:spiele|mache|gehe|lese|treffe|trainiere|fahre)\b|\b(?:spiele|mache|lese|trainiere|wandere|schwimme)\s+(?:gern\s+|oft\s+|regelmassig\s+)?[^,.]+/),
    hobby_detail: state(/\b(oft|regelmassig|jede\w*|einmal|zweimal|mit mein\w*|mit freund\w*|allein)\b/),
    german_learning: state(/\b(deutsch|deutschkurs|sprache)\b/, /\b(?:lerne|lernen|ubere|besuche)\b[^,.]*\bdeutsch|\bdeutschkurs\b/),
    german_duration: state(/\bseit\b[^,.]*\bdeutsch|\bdeutsch\b[^,.]*\bseit\b/, /\bseit\s+(?:\d+|ein\w*|zwei|drei|vier|funf|sechs|sieben|acht|neun|zehn)\s+(?:tag\w*|monat\w*|jahr\w*)\b[^,.]*\bdeutsch|\bdeutsch\b[^,.]*\bseit\s+(?:\d+|ein\w*|zwei|drei|vier|funf|sechs|sieben|acht|neun|zehn)\s+(?:tag\w*|monat\w*|jahr\w*)\b/),
    german_reason: state(/\bdeutsch\b[^,.]*(?:weil|damit|fur|um)\b|(?:weil|damit|um)\b[^,.]*\bdeutsch\b/),
    german_difficulty: state(/\b(?:deutsch|lernen|sprechen|verstehen)\b[^,.]*(?:schwierig|schwer|problem)|(?:schwierig|schwer)\b[^,.]*\b(?:deutsch|lernen|sprechen|verstehen)\b/),
    learning_strategy: state(/\b(?:hilft|lerne|ubere)\b[^,.]*(?:lesen|horen|sprechen|app|kurs|fernsehen|podcast|freunde|karten)/),
    daily_routine: state(/\b(?:morgens|vormittags|mittags|nachmittags|abends|jeden tag|normalerweise)\b[^,.]+/),
    past_experience: state(/\b(?:am anfang|fruher|damals|als ich|habe .* erlebt|war .* neu|war .* schwierig)\b/),
    future_plan: state(/\b(zukunft|plan\w*|spater|mochte|werde|will)\b/, /\b(?:spater|in zukunft|nachste\w* jahr)\b[^,.]*(?:mochte|werde|will)|\b(?:mochte|will|werde)\b[^,.]*(?:machen|lernen|studieren|arbeiten|leben|ziehen|kaufen)/),
    professional_goal: state(/\b(?:beruflich|karriere|ausbildung|teamleiter|selbststandig)\b[^,.]*(?:ziel|mochte|will|werde|machen)|\b(?:mochte|will)\b[^,.]*\b(?:arbeiten|ausbildung|teamleiter|selbststandig)\b/),
    reason: state(/\b(weil|denn|deshalb|daher|darum|damit|um zu)\b/),
    example: state(/\b(zum beispiel|beispielsweise|etwa)\b/),
    comparison: state(/\b(im vergleich|anders als|genauso wie|mehr als|weniger als|in meiner heimat|in meinem heimatland|bei uns)\b/),
    opinion: state(/\b(ich finde|ich denke|ich glaube|meiner meinung nach|fur mich)\b/),
    integration_opinion: state(/\b(?:dazugehor\w*|zugehor\w*|integra\w*|gut leben)\b[^,.]*(?:wichtig|muss|sollte|braucht)|\b(?:wichtig|muss|sollte|braucht)\b[^,.]*(?:dazugehor\w*|zugehor\w*|integra\w*)/),
    work_opinion: state(/\b(?:arbeit|job|beruf)\b[^,.]*(?:gefallt|gern|gut|schlecht|interessant)|\b(?:gefallt|mag)\b[^,.]*(?:arbeit|job|beruf)/),
    // Compatibility aliases retained for existing internal consumers.
    future: state(/\b(zukunft|plan\w*|spater|mochte|werde|will)\b/, /\b(?:spater|in zukunft)\b[^,.]*(?:mochte|werde|will)|\b(?:mochte|will|werde)\b[^,.]*(?:machen|lernen|studieren|arbeiten|leben)/),
    german: state(/\b(deutsch|deutschkurs|sprache)\b/, /\b(?:lerne|lernen)\s+deutsch\s+(?:weil|damit|fur|um)\b|\bdeutsch\s+(?:ist|brauche ich)\s+[^,.]+/),
  };
}

export function getPlanningIntentCoverage(conversation = []) {
  const text = sectionTranscript(conversation);
  const hasDate = /\b(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|wochenende|morgen|ubernachste|nachste woche|\d{1,2}\.\s*(?:januar|februar|marz|april|mai|juni|juli|august|september|oktober|november|dezember))\b/.test(text);
  const hasReason = /\b(weil|denn|deshalb|daher|darum|zu teuer|zu weit|keine zeit|arbeiten muss)\b/.test(text);
  const hasAlternative = /\b(lieber|stattdessen|alternativ|anderer vorschlag|wir konnen|konnten wir)\b/.test(text);
  const hasRejection = /\b(nein|nicht gut|passt nicht|zu teuer|zu weit|lieber nicht|dagegen)\b/.test(text);
  return {
    date: hasDate ? COVERAGE.SUFFICIENT : COVERAGE.NOT_COVERED,
    reason: hasReason ? COVERAGE.SUFFICIENT : COVERAGE.NOT_COVERED,
    alternative: hasAlternative ? COVERAGE.SUFFICIENT : COVERAGE.NOT_COVERED,
    rejection: hasRejection ? COVERAGE.SUFFICIENT : COVERAGE.NOT_COVERED,
  };
}

function planningQuestionIntent(question) {
  const text = normalizeText(question);
  if (/\bwann\b|welcher tag|datum/.test(text)) return "date";
  if (/anderen vorschlag|alternative/.test(text)) return "alternative";
  return null;
}

export function isRedundantImageFollowUp(question, conversation = []) {
  const normalized = normalizeText(question);
  if (!normalized) return true;
  const dimension = imageFollowUpDimension(question);
  const advancedDimensions = ["reasoning", "comparison", "opinion"].filter(
    (item) => sectionHasDimensionEvidence(item, conversation)
  ).length;
  const advancedInterpretation = /\b(grafik|entwicklung|trend|aussage|zeigt|stellt dar|schlussfolger)\b/.test(
    sectionTranscript(conversation)
  );
  if (
    (dimension === "location" || dimension === "action" || dimension === "basic_description") &&
    advancedInterpretation &&
    advancedDimensions >= 2
  ) return true;
  const alreadyAsked = (Array.isArray(conversation) ? conversation : []).some(
    (turn) => normalizeText(turn?.question || "") === normalized
  );
  if (alreadyAsked) return true;
  const dimensionAlreadyAsked = (Array.isArray(conversation) ? conversation : []).some(
    (turn) =>
      imageFollowUpDimension(turn?.question || "") === dimension &&
      dimension !== "other"
  );
  if (dimensionAlreadyAsked) return true;
  if (sectionHasDimensionEvidence(dimension, conversation)) {
    return true;
  }
  return false;
}

function sanitizeDynamicImageQuestion(value) {
  const text = String(value || "").trim().replace(/\s+/g, " ");
  if (text.length < 8 || text.length > 240) return null;
  if ((text.match(/\?/g) || []).length !== 1 || !text.endsWith("?")) return null;
  if (/https?:\/\/|```|systemprompt|system prompt|entwicklernachricht/i.test(text)) {
    return null;
  }
  return text;
}

/**
 * Closed set of learner-facing follow-up questions for a model.
 * Only examinerQuestions — followUpRules govern selection, not invent text.
 * @param {object} model
 * @returns {string[]}
 */
export function buildAllowedFollowUps(model, conversation = []) {
  const planningPack = model?.skill === "planung" ? getPlacementPlanningPack(model.id) : null;
  if (planningPack) {
    const next = selectNextPlanningMove(planningPack, conversation);
    return next ? [next.text] : [];
  }
  const allowed = [];
  const seen = new Set();
  const alreadyAsked = new Set(
    (Array.isArray(conversation) ? conversation : [])
      .map((turn) => normalizeText(turn?.question || ""))
      .filter(Boolean)
  );
  const selfCoverage = model?.skill === "selbstvorstellung"
    ? getSelfTopicCoverage(conversation)
    : {};
  const askedSelfIntents = new Set(
    (Array.isArray(conversation) ? conversation : [])
      .map((turn) => selfQuestionTopic(turn?.question || ""))
      .filter(Boolean)
  );
  const latestSelfTranscript = normalizeText(
    (Array.isArray(conversation) ? conversation.at(-1)?.transcript : "") || ""
  );
  const likelyMisunderstoodProfessionalGoal =
    latestSelfTranscript.split(" ").filter(Boolean).length >= 3 &&
    selfCoverage.professional_goal === COVERAGE.NOT_COVERED &&
    [selfCoverage.name, selfCoverage.origin, selfCoverage.residence, selfCoverage.work]
      .includes(COVERAGE.SUFFICIENT);
  const planningCoverage = model?.skill === "planung"
    ? getPlanningIntentCoverage(conversation)
    : {};

  for (const q of model?.examinerQuestions || []) {
    const text = String(q || "").trim();
    if (!text) continue;
    const key = normalizeText(text);
    if (alreadyAsked.has(key)) continue;
    const topic = selfQuestionTopic(text);
    if (topic && selfCoverage[topic] === "sufficient") continue;
    const isSafeProfessionalRephrase =
      topic === "professional_goal" &&
      key === normalizeText("Welche Arbeit möchten Sie später machen?") &&
      alreadyAsked.has(normalizeText("Was möchten Sie beruflich in Zukunft machen?")) &&
      likelyMisunderstoodProfessionalGoal;
    if (
      topic === "professional_goal" &&
      key === normalizeText("Welche Arbeit möchten Sie später machen?") &&
      !isSafeProfessionalRephrase
    ) continue;
    if (topic && askedSelfIntents.has(topic)) {
      if (!isSafeProfessionalRephrase) continue;
    }
    if (model?.skill === "selbstvorstellung" && topic) {
      if (topic === "work_details" && selfCoverage.work !== COVERAGE.SUFFICIENT) continue;
      if (topic === "family_detail" && selfCoverage.family !== COVERAGE.SUFFICIENT) continue;
      if (topic === "hobby_detail" && selfCoverage.leisure !== COVERAGE.SUFFICIENT) continue;
      if (topic === "german_duration" && selfCoverage.german_learning !== COVERAGE.SUFFICIENT) continue;
      if (topic === "work_opinion" && selfCoverage.work !== COVERAGE.SUFFICIENT) continue;
      if (topic === "learning_strategy" && selfCoverage.german_learning !== COVERAGE.SUFFICIENT) continue;
      if (topic === "reason" && ![selfCoverage.future_plan, selfCoverage.professional_goal, selfCoverage.integration_opinion, selfCoverage.opinion].includes(COVERAGE.SUFFICIENT)) continue;
      if (topic === "example" && ![selfCoverage.reason, selfCoverage.opinion, selfCoverage.past_experience].includes(COVERAGE.SUFFICIENT)) continue;
      if (topic === "comparison" && ![selfCoverage.opinion, selfCoverage.integration_opinion, selfCoverage.past_experience].includes(COVERAGE.SUFFICIENT)) continue;
    }
    const planningIntent = planningQuestionIntent(text);
    if (planningIntent && planningCoverage[planningIntent] === "sufficient") continue;
    if (seen.has(key)) continue;
    seen.add(key);
    allowed.push(text);
  }

  if (model?.skill !== "selbstvorstellung") return allowed;
  return allowed.sort((a, b) => {
    const aState = selfCoverage[selfQuestionTopic(a)];
    const bState = selfCoverage[selfQuestionTopic(b)];
    return Number(bState === COVERAGE.PARTIAL) - Number(aState === COVERAGE.PARTIAL);
  });
}

export function getRecommendedSelfFollowUp(model, conversation = []) {
  if (model?.skill !== "selbstvorstellung") return null;
  return buildAllowedFollowUps(model, conversation)[0] || null;
}

/**
 * Pick an allowed follow-up that best matches a proposed string, or null.
 * Never invents a replacement.
 * @param {string|null|undefined} proposed
 * @param {string[]} allowed
 */
export function matchAllowedFollowUp(proposed, allowed = []) {
  const prop = normalizeText(proposed || "");
  if (!prop || !allowed.length) return null;

  for (const q of allowed) {
    if (normalizeText(q) === prop) return q;
  }

  for (const q of allowed) {
    const n = normalizeText(q);
    if (n.length >= 12 && (prop.includes(n) || n.includes(prop))) return q;
  }

  return null;
}

/**
 * Validate/normalize model JSON into the public Placement evaluate schema.
 * Rejects invented follow-ups; never invents replacements.
 * @param {object} raw
 * @param {object} model
 * @param {number} followUpCount
 */
export function sanitizePlacementEvaluation(
  raw,
  model,
  followUpCount = 0,
  conversation = [],
  selectedImageContext = null
) {
  const planningPack = model?.skill === "planung" ? getPlacementPlanningPack(model.id) : null;
  const bildPack = model?.skill === "bildbeschreibung"
    ? getPlacementBildAssessmentPack(
        selectedImageContext?.catalogLevel,
        selectedImageContext?.catalogId
      )
    : null;
  const eligibleBildQuestions = getEligibleBildFollowUps(
    bildPack, conversation, raw?.coveredTopics
  );
  const allowed = model?.skill === "bildbeschreibung"
    ? eligibleBildQuestions.map((item) => item.question)
    : buildAllowedFollowUps(model, conversation);
  if (!BANDS.has(raw?.band)) {
    throw new AppError(
      "AI_INVALID_RESPONSE",
      "KI-Antwort enthält keine gültige Bewertung.",
      502
    );
  }
  const band = raw.band;

  const validBildTopicIds = bildPack
    ? new Set(bildPack.referenceEvidence.map((item) => item.id))
    : null;
  const sanitizeTopics = (topics) => {
    const values = Array.isArray(topics)
      ? topics.map((t) => String(t).trim()).filter(Boolean)
      : [];
    const valid = validBildTopicIds
      ? values.filter((topic) => validBildTopicIds.has(topic))
      : model?.skill === "bildbeschreibung"
        ? []
        : values;
    return [...new Set(valid)].slice(0, 20);
  };
  const coveredTopics = sanitizeTopics(raw?.coveredTopics);
  const missingTopics = sanitizeTopics(raw?.missingTopics);
  const notes = Array.isArray(raw?.notes)
    ? raw.notes.map((t) => String(t)).filter(Boolean).slice(0, 8)
    : [];

  let needsFollowUp = Boolean(raw?.needsFollowUp);
  let followUpQuestion = null;
  let followUpQuestionId = null;
  let followUpSource = null;

  if (!planningPack && followUpCount >= PLACEMENT_MAX_FOLLOWUPS) {
    needsFollowUp = false;
  }

  if (planningPack) {
    const currentMove = getPlacementPlanningMove(
      planningPack,
      conversation.at(-1)?.moveId
    );
    const providerMoveId = String(
      raw?.nextMoveId || raw?.followUpQuestionId || ""
    ).trim();
    const nextMove = currentMove?.closing
      ? null
      : selectNextPlanningMove(planningPack, conversation, providerMoveId);
    needsFollowUp = Boolean(nextMove);
    followUpQuestion = nextMove?.text || null;
    followUpQuestionId = nextMove?.id || null;
    followUpSource = nextMove
      ? (providerMoveId === nextMove.id ? "examinerQuestions" : "deterministicPlanningFallback")
      : null;
  } else if (needsFollowUp) {
    const proposedCandidates = [raw, ...(Array.isArray(raw?.followUpCandidates) ? raw.followUpCandidates : [])];
    let matchedBildQuestion = null;
    let matched = null;
    if (model?.skill === "bildbeschreibung") {
      matchedBildQuestion = proposedCandidates
        .map((candidate) => {
          const id = String(candidate?.followUpQuestionId || candidate?.id || "").trim();
          const question = String(candidate?.followUpQuestion || candidate?.question || "").trim();
          return eligibleBildQuestions.find(
            (item) => item.id === id && item.question === question
          ) || null;
        })
        .find(Boolean) || eligibleBildQuestions[0] || null;
      matched = matchedBildQuestion?.question || null;
    } else {
      const textCandidates = [
        raw?.followUpQuestion,
        ...(Array.isArray(raw?.followUpCandidates) ? raw.followUpCandidates : []),
      ];
      matched = textCandidates
        .map((question) => matchAllowedFollowUp(question, allowed))
        .find(Boolean) || null;
    }
    if (matched) {
      followUpQuestion = matched;
      followUpQuestionId = matchedBildQuestion?.id || null;
      const claimed = String(raw?.followUpSource || "");
      followUpSource = FOLLOW_UP_SOURCES.has(claimed)
        ? claimed
        : "examinerQuestions";
    } else {
      needsFollowUp = false;
      followUpQuestion = null;
      followUpQuestionId = null;
      followUpSource = null;
    }
  }

  const planningLedger = planningPack
    ? buildPlanningEvidenceLedger(planningPack, conversation)
    : null;
  const planningTopics = planningPack
    ? planningTopicsFromLedger(planningPack, planningLedger)
    : null;
  return {
    productType: "placement_test",
    modelId: model.id,
    skill: model.skill,
    modelLevel: model.level,
    band,
    coveredTopics: planningTopics?.coveredTopics || coveredTopics,
    missingTopics: planningTopics?.missingTopics || missingTopics,
    needsFollowUp,
    followUpQuestion,
    ...(["bildbeschreibung", "planung"].includes(model.skill) ? { followUpQuestionId } : {}),
    followUpSource,
    notes,
    evaluationMethod: PLACEMENT_EVAL_METHOD,
    ...(planningPack ? {
      planningPackId: planningPack.scenarioId,
      planningEvidenceLedger: planningLedger,
      planningComplete: Boolean(getPlacementPlanningMove(planningPack, conversation.at(-1)?.moveId)?.closing),
    } : {}),
    ...(model.skill === "bildbeschreibung" && bildPack
      ? { bildAssessmentPackKey: bildPack.key }
      : {}),
  };
}

/**
 * Learner-safe factual image context for Bildbeschreibung evaluation.
 * Never includes vocab lists, model answers, tips, or pool metadata.
 */
export function sanitizeSelectedImageContext(raw) {
  if (!raw || typeof raw !== "object") return null;
  const catalogLevel = String(raw.catalogLevel || "").trim();
  const catalogId = Number(raw.catalogId);
  const imagePath = String(raw.imagePath || "").trim();
  const title = String(raw.title || "").trim().slice(0, 120);
  const sceneDescription = String(raw.sceneDescription || "")
    .trim()
    .slice(0, 800);

  if (!catalogLevel || !Number.isFinite(catalogId) || catalogId <= 0) return null;
  if (!imagePath || !sceneDescription) return null;

  // Reject accidental helper fields if a client ever sends them
  return {
    catalogLevel,
    catalogId,
    imagePath: imagePath.slice(0, 240),
    title,
    sceneDescription,
  };
}

export function buildExaminerSystemPrompt(
  model,
  allowedFollowUps,
  selectedImageContext = null,
  conversation = []
) {
  const isBild = model?.skill === "bildbeschreibung";
  const isSelf = model?.skill === "selbstvorstellung";
  const planningPack = model?.skill === "planung" ? getPlacementPlanningPack(model.id) : null;
  const bildPack = isBild
    ? getPlacementBildAssessmentPack(
        selectedImageContext?.catalogLevel,
        selectedImageContext?.catalogId
      )
    : null;
  const modelPayload = {
    id: model.id,
    skill: model.skill,
    level: model.level,
    difficulty: model.difficulty,
    requiredTopics: isBild ? [] : model.requiredTopics || [],
    examinerQuestions: isBild ? [] : model.examinerQuestions || [],
    followUpRules: isBild ? [] : model.followUpRules || [],
    benchmarkMarkers: isBild ? {} : model.benchmarkMarkers || {},
  };

  if (isBild && selectedImageContext) {
    modelPayload.prompt =
      "Der Lernende beschreibt das ausgewählte Placement-Bild. Bewerte nur gegen selectedImage.";
  } else {
    modelPayload.prompt = model.prompt;
  }
  if (isSelf) modelPayload.semanticEvidence = getSelfTopicCoverage(conversation);
  if (planningPack) {
    modelPayload.requiredTopics = [];
    modelPayload.examinerQuestions = [];
    modelPayload.followUpRules = [];
    modelPayload.planningPack = {
      scenarioId: planningPack.scenarioId,
      level: planningPack.level,
      learnerTask: planningPack.learnerTask,
      evidenceLedger: buildPlanningEvidenceLedger(planningPack, conversation),
      allowedNextMoves: planningPack.moves
        .filter((move) => !conversation.some((turn) => turn?.moveId === move.id))
        .map(({ id, text }) => ({ id, text })),
      finalMoveId: planningPack.finalMoveId,
    };
  }

  const lines = [
    "Du bist ausschließlich der AustriaPath Placement-Prüfer für EIN Placement-Modell.",
    "Du bewertest nur die aktuelle Lernenden-Antwort gegen die bereitgestellten Modellfelder.",
    "Bewerte dabei die GESAMTE bisherige Skill-Unterhaltung, nicht nur die letzte Antwort.",
    "voice_transcript ist automatische Spracherkennung und kann einzelne Erkennungsfehler enthalten. Behandle den Text als Evidenz, aber bestrafe wahrscheinliche Transkriptionsfehler nicht als Sprachfehler.",
    "Du darfst KEINE neuen Szenarien oder nicht belegten Bilddetails erfinden.",
    "selectedLevel / Startniveau darf die Bewertung NICHT beeinflussen — nur die Antwort und die Modellfelder.",
    "Antworte NUR mit einem JSON-Objekt (kein Markdown), Schema:",
    '{"band":"weak|medium|strong","coveredTopics":[],"missingTopics":[],"needsFollowUp":boolean,"followUpQuestionId":string|null,"followUpQuestion":string|null,"followUpCandidates":[],"followUpSource":"examinerQuestions|followUpRules|missingTopic"|null,"notes":[]}',
    isBild
      ? "band: weak/medium/strong nur anhand der Antwort und der evidenceStates des ausgewählten Assessment-Packs."
      : "band: weak/medium/strong nur anhand der Antwort vs requiredTopics und benchmarkMarkers.",
  ];

  if (isBild && selectedImageContext) {
    lines.push(
      "BILDFRAGEN SIND GESCHLOSSEN. Du darfst keine Frage erfinden, umformulieren, paraphrasieren oder aus einem anderen Bild oder Modell übernehmen.",
      "Bei needsFollowUp=true müssen followUpQuestionId UND followUpQuestion exakt demselben Eintrag in eligibleFollowUps entsprechen.",
      "coveredTopics und missingTopics dürfen bei Bildbeschreibung nur evidence-unit IDs aus evidenceStates enthalten.",
      "Wenn keine eligibleFollowUps-Frage nützlich ist: needsFollowUp=false. Ein freier Nachfrageplatz ist kein Grund für eine Frage.",
      "Bewerte Grammatik getrennt von semantischer Abdeckung. Verständliche unvollkommene Formen zählen als Bild-Evidenz.",
      "referenceAnswer ist nur eine semantische Referenz und niemals ein Pflichttext. Akzeptiere andere richtige Wörter, sichtbare Details, Satzfolgen und Paraphrasen.",
      "B2: Ursache und Folge sind getrennte Dimensionen. Eine vorhandene Ursache sperrt keine Folgenfrage und umgekehrt.",
      "Aktueller geschlossener assessmentPack:",
      JSON.stringify({
        key: bildPack?.key,
        title: bildPack?.title,
        referenceAnswer: bildPack?.referenceAnswer,
        evidenceStates: getBildEvidenceCoverage(bildPack, conversation),
        eligibleFollowUps: allowedFollowUps,
      })
    );
  } else {
    lines.push(
      "needsFollowUp=true nur wenn eine Nachfrage sinnvoll ist UND followUpQuestion EXAKT einer erlaubten Frage entspricht.",
      "Prüfe die GESAMTE Antwortgeschichte semantisch und frage nichts, was bereits ausdrücklich oder sinngemäß beantwortet wurde.",
      "followUpRules und fehlende requiredTopics dürfen nur helfen, eine erlaubte examinerQuestions-Frage auszuwählen.",
      "Wenn keine erlaubte Nachfrage passt: needsFollowUp=false und followUpQuestion=null.",
      "examinerQuestions ist eine Fragenbank/Evidenzhilfe, keine abzuarbeitende Checkliste. Das kluge Auslassen einer redundanten Frage darf die Bewertung nie senken.",
      "Ordne jedes requiredTopic semantisch als not_covered, partially_covered oder sufficiently_covered ein. Frage nie dieselbe Information mit anderer Formulierung erneut.",
      "Bei A2: einfache Klärung oder ein konkretes Detail; kurze sinnvolle Antworten genügen. Bei B1: Gründe, Beispiele, Erfahrung sowie Vergangenheit/Zukunft und verbundene Antworten fördern. Bei B2: passende Meinung mit Begründung, Vergleich, Ursache/Folge oder Abstraktion nur wenn die bisherige Antwort das trägt.",
      "Bevorzuge genau eine hochwertige Nachfrage. Vertiefe ein bereits genanntes Thema nur, wenn dadurch neue CEFR-Evidenz entsteht; wechsle sonst zu einem unbedeckten Thema.",
      "Erlaubte followUpQuestion-Werte (geschlossen — nur diese Texte):",
      JSON.stringify(allowedFollowUps)
    );
  }

  if (isSelf) {
    lines.push(
      "SELBSTVORSTELLUNG: semanticEvidence ist eine Evidenzkarte, keine Pflichtliste. Grammatik und semantische Abdeckung getrennt bewerten; verständliche fehlerhafte Formen zählen als kommunizierte Information.",
      "Priorität: (1) eine wichtige partial-Angabe klären, (2) ein wichtiges not_covered-Thema fragen, (3) bei starken Grundlagen mit genau einer neuen Dimension vertiefen: Grund, Beispiel, Erfahrung, Zukunft, Vergleich oder Meinung.",
      "Frage nur, wenn zusätzliche Bewertungsevidenz nützlich ist. Ein freier Frageplatz allein ist kein Grund; dann needsFollowUp=false.",
      "Wenn die letzte Antwort klar nicht zur gestellten Frage passt und die Absicht not_covered bleibt, ist höchstens eine einfachere erlaubte Umformulierung derselben Absicht zulässig. Keine zweite Umformulierung und keine Schleife.",
      "Ein Grund und ein Beispiel in der Antwort sperren allgemeine Warum-/Beispielfragen. Bereits genannte Kinder, Tätigkeit, Hobby oder Deutschlern-Grund sperren die jeweilige allgemeine Wiederholungsfrage."
    );
  }
  if (planningPack) {
    lines.push(
      "PLANUNG IST GESCHLOSSEN. nextMoveId darf nur eine ID aus planningPack.allowedNextMoves sein; erfinde niemals Fragetext oder Themen-IDs.",
      "Bewerte kommunikative Wirksamkeit, Interaktion, Vorschläge/Reaktionen, Gründe/Alternativen, Kohärenz, Sprache und niveaugerechtes Problemlösen über die gesamte Unterhaltung.",
      "Faktische Themenabdeckung wird serverseitig aus dem geschlossenen Evidence-Ledger bestimmt. coveredTopics/missingTopics des Providers werden für Planung ignoriert.",
      "Eine Antwort kann mehrere Evidenzdimensionen abdecken. Off-topic-Inhalt erfüllt das aktuelle Frageziel nicht.",
      "Bei der Abschlussfrage ist die Bewertung eine konsolidierte Gesamtbewertung der vollständigen Planung."
    );
  }

  if (isBild && selectedImageContext) {
    lines.push(
      "BILDBESCHREIBUNG — verbindliche Szene:",
      "Bewerte die Antwort AUSSCHLIESSLICH gegen selectedImage (title + sceneDescription).",
      "Ignoriere jedes model.imagePrompt vollständig — es gehört möglicherweise zu einer anderen Szene.",
      "Wortlisten, Modellantworten oder alternative Formulierungen sind KEINE Pflicht.",
      "Eine gültige Beschreibung mit anderen Wörtern darf nicht bestraft werden, wenn die sichtbare Szene korrekt erfasst ist.",
      "selectedImage:",
      JSON.stringify(selectedImageContext)
    );
  }

  lines.push(
    "Bisherige Skill-Unterhaltung (Fragen und Lernenden-Transkripte):",
    JSON.stringify(conversation)
  );

  lines.push("Aktuelles Modell:", JSON.stringify(modelPayload));
  return lines.join("\n");
}

async function callOpenAiJson({ system, user }) {
  if (!env.openaiApiKey) {
    throw new AppError(
      "AI_UNAVAILABLE",
      "KI-Prüfer ist derzeit nicht verfügbar.",
      503
    );
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: env.openaiModel,
      temperature: 0.2,
      max_tokens: 500,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new AppError(
      "OPENAI_UPSTREAM_ERROR",
      "AI-Dienst vorübergehend nicht verfügbar.",
      502
    );
  }

  const content = data.choices?.[0]?.message?.content || "";
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new AppError(
      "AI_INVALID_RESPONSE",
      "KI-Antwort war ungültig.",
      502
    );
  }

  try {
    return JSON.parse(jsonMatch[0]);
  } catch {
    throw new AppError(
      "AI_INVALID_RESPONSE",
      "KI-Antwort war ungültig.",
      502
    );
  }
}

/**
 * @param {{ userId: string, attemptId: string, idempotencyKey: string, productType: string, modelId: string, answerText: string, followUpCount?: number, selectedImage?: object }} input
 */
export async function evaluatePlacementTurn({
  userId,
  attemptId,
  idempotencyKey,
  productType,
  modelId,
  answerText,
  followUpCount = 0,
  conversation = [],
  currentQuestion = null,
  currentMoveId = null,
  inputMode = "typed",
  selectedImage = null,
}) {
  if (productType !== "placement_test") {
    throw new AppError(
      "VALIDATION_ERROR",
      "Nur productType placement_test ist erlaubt.",
      400
    );
  }

  const model = getPlacementModel(modelId) || getPlacementPlanningPack(modelId);
  if (!model || model.service !== "placement") {
    throw new AppError("VALIDATION_ERROR", "Unbekanntes Placement-Modell.", 400);
  }

  const text = String(answerText || "").trim();
  if (text.length < 8) {
    throw new AppError(
      "VALIDATION_ERROR",
      "Antwort ist zu kurz für die Auswertung.",
      400
    );
  }

  let imageContext = null;
  if (model.skill === "bildbeschreibung") {
    imageContext = sanitizeSelectedImageContext(selectedImage);
    if (!imageContext) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Bildkontext fehlt für die Bildbeschreibung-Auswertung.",
        400
      );
    }
    if (!getPlacementBildAssessmentPack(imageContext.catalogLevel, imageContext.catalogId)) {
      throw new AppError(
        "VALIDATION_ERROR",
        "Für dieses Bild ist kein geschlossenes Assessment-Pack freigegeben.",
        400
      );
    }
  }

  const count = Math.max(0, Number(followUpCount) || 0);
  const conversationLimit = model.skill === "planung" ? 12 : 6;
  const safeConversation = (Array.isArray(conversation) ? conversation : [])
    .slice(-conversationLimit)
    .map((turn) => ({
      question: String(turn?.question || "").trim().slice(0, 300),
      transcript: String(turn?.transcript || "").trim().slice(0, 3000),
      inputMode: turn?.inputMode === "voice_transcript" ? "voice_transcript" : "typed",
      moveId: String(turn?.moveId || "").trim().slice(0, 120) || null,
    }))
    .filter((turn) => turn.transcript);
  const currentTurn = {
    question: String(currentQuestion || "").trim().slice(0, 300),
    transcript: text.slice(0, 3000),
    inputMode: inputMode === "voice_transcript" ? "voice_transcript" : "typed",
    moveId: String(currentMoveId || "").trim().slice(0, 120) || null,
  };
  const fullConversation = [...safeConversation, currentTurn];

  const imagePack = imageContext
    ? getPlacementBildAssessmentPack(imageContext.catalogLevel, imageContext.catalogId)
    : null;
  const allowedFollowUps = imagePack
    ? getEligibleBildFollowUps(imagePack, fullConversation)
    : buildAllowedFollowUps(model, fullConversation);
  const system = buildExaminerSystemPrompt(
    model,
    allowedFollowUps,
    imageContext,
    fullConversation
  );
  const userMsg = [
    "Lernenden-Antwort (Transkription/Text):",
    text,
    `Bisherige Nachfragen in diesem Skill: ${count} (Maximum ${PLACEMENT_MAX_FOLLOWUPS}).`,
    count >= PLACEMENT_MAX_FOLLOWUPS
      ? "Keine weitere Nachfrage erlaubt."
      : "Nachfrage nur wenn nötig und nur aus der erlaubten Liste.",
  ].join("\n");

  return withAuthorizedPlacementUsage(
    {
      userId,
      attemptId,
      operation: "turn",
      idempotencyKey,
      requestPayload: {
        productType,
        modelId,
        answerText: text,
        followUpCount: count,
        conversation: safeConversation,
        currentQuestion: currentTurn.question,
        inputMode: currentTurn.inputMode,
        selectedImage: imageContext,
      },
    },
    async (q) => {
      const raw = await callOpenAiJson({ system, user: userMsg });
      const evaluation = sanitizePlacementEvaluation(
        raw,
        model,
        count,
        fullConversation,
        imageContext
      );
      await q(
        `INSERT INTO ai_completion_logs
           (user_id, mode, service_type, model_name, credits_charged, success)
         VALUES ($1, 'conversational'::ai_gateway_mode, 'placement_test', $2, 0, TRUE)`,
        [userId, env.openaiModel]
      );
      return {
        ...evaluation,
        creditsUsed: 0,
        creditsRemaining: null,
      };
    }
  );
}

/** Test helper: dry sanitize without OpenAI */
export function evaluatePlacementTurnOffline({
  modelId,
  raw,
  followUpCount = 0,
  conversation = [],
  selectedImage = null,
}) {
  const model = getPlacementModel(modelId) || getPlacementPlanningPack(modelId);
  if (!model) throw new Error("model not found");
  const imageContext = model.skill === "bildbeschreibung"
    ? sanitizeSelectedImageContext(selectedImage)
    : null;
  return sanitizePlacementEvaluation(
    raw || {}, model, followUpCount, conversation, imageContext
  );
}
