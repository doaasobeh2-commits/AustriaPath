/**
 * Placement-only AI turn evaluation.
 * Does NOT modify shared /ai/completions behavior.
 * Uses aiPlacementLibrary models read-only. No ExaminerMind / council.
 */

import { getPlacementModel } from "../../../src/data/aiPlacementLibrary.js";
import { getPlacementBildAssessmentPack } from "../../../src/data/placementBildAssessmentPacks.js";
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

function selfQuestionTopic(question) {
  const text = normalizeText(question);
  if (/wie heissen|name/.test(text)) return "name";
  if (/woher|herkunft|heimat/.test(text)) return "origin";
  if (/wo wohnen|wie lange leben.*osterreich/.test(text)) return "residence";
  if (/beruflich|arbeiten sie|arbeit oder|ausbildung/.test(text)) return "work";
  if (/familie|kinder/.test(text)) return "family";
  if (/hobby|freizeit|wochenende/.test(text)) return "leisure";
  if (/zukunft|erreichen|beruflichen ziele/.test(text)) return "future";
  if (/deutschlernen|deutsch lernen|sprache.*zukunft/.test(text)) return "german";
  return null;
}

export function getSelfTopicCoverage(conversation = []) {
  const text = sectionTranscript(conversation);
  return {
    name: coverageState(text, {
      mention: /\b(name|heiss\w*)\b/,
      sufficient: /\b(?:ich\s+)?(?:heisse|name)\s+(?!ist\b)[a-z]{2,}|\bmein name ist\s+[a-z]{2,}/,
    }),
    origin: coverageState(text, {
      mention: /\b(komme|kommen|herkunft|heimat)\b/,
      sufficient: /\b(?:ich\s+)?komm\w*\s+(?:aus\s+)?[a-z]{3,}|\b(?:herkunft|heimat)(?:sland)?\s+(?:ist\s+)?[a-z]{3,}/,
    }),
    residence: coverageState(text, {
      mention: /\b(wohn\w*|leb\w*|wohnort)\b/,
      sufficient: /\b(?:ich\s+)?(?:wohn\w*|leb\w*)\s+(?:seit\s+[^,.]+\s+)?(?:in\s+)?[a-z]{3,}|\bwohnort\s+(?:ist\s+)?[a-z]{3,}/,
    }),
    work: coverageState(text, {
      mention: /\b(arbeit\w*|beruf\w*|job|beschaftigt|ausbildung|studier\w*)\b/,
      sufficient: /\b(?:arbeite|arbeiten)\s+(?!manchmal\b|gelegentlich\b)(?:(?:als|bei|in|im|auf)\s+)?[^,.]+|\bvon beruf bin ich\s+[^,.]+|\b(?:bin|ist)\s+(?!nicht\b)[^,.]{2,80}\bbeschaftigt\b|\bmein beruf ist\s+[^,.]+/,
    }),
    family: coverageState(text, {
      mention: /\b(familie|verheiratet|kind\w*|sohn|tochter|ehemann|ehefrau|partner)\b/,
      sufficient: /\b(?:bin|ist)\s+verheiratet\b|\b(?:habe|hat)\s+(?:\w+\s+){0,2}(?:kind\w*|sohn|tochter)\b|\b(?:mit\s+)?(?:mein\w*\s+)?(?:ein\w*|zwei|drei|vier|\d+)?\s*(?:kind\w*|sohn|tochter)\b|\b(?:mein|meine)\s+(?:ehemann|ehefrau|partner)\s+[^,.]+/,
    }),
    leisure: coverageState(text, {
      mention: /\b(hobby|hobbys|freizeit|wochenende|sport|fussball|schach)\b/,
      sufficient: /\b(?:in meiner freizeit|am wochenende|nach der arbeit)\s+(?:\w+\s+){0,4}(?:spiele|mache|gehe|lese|treffe|trainiere|fahre)\b|\b(?:spiele|mache|lese|trainiere)\s+(?:gern|oft|regelmassig)?\s*[^,.]+/,
    }),
    future: coverageState(text, {
      mention: /\b(zukunft|plan\w*|ziel\w*|spater|mochte|werde)\b/,
      sufficient: /\b(?:spater|in zukunft)\s+(?:\w+\s+){0,3}(?:mochte|werde|will)\s+[^,.]+|\b(?:mein ziel|meine plane?)\s+(?:ist|sind)\s+[^,.]+/,
    }),
    german: coverageState(text, {
      mention: /\b(deutsch|deutschkurs|sprache)\b/,
      sufficient: /\b(?:lerne|lernen)\s+deutsch\s+(?:weil|damit|fur|um)\b|\bdeutsch\s+(?:ist|brauche ich)\s+[^,.]+/,
    }),
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
    const planningIntent = planningQuestionIntent(text);
    if (planningIntent && planningCoverage[planningIntent] === "sufficient") continue;
    if (seen.has(key)) continue;
    seen.add(key);
    allowed.push(text);
  }

  return allowed;
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

  if (followUpCount >= PLACEMENT_MAX_FOLLOWUPS) {
    needsFollowUp = false;
  }

  if (needsFollowUp) {
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

  return {
    productType: "placement_test",
    modelId: model.id,
    skill: model.skill,
    modelLevel: model.level,
    band,
    coveredTopics,
    missingTopics,
    needsFollowUp,
    followUpQuestion,
    ...(model.skill === "bildbeschreibung" ? { followUpQuestionId } : {}),
    followUpSource,
    notes,
    evaluationMethod: PLACEMENT_EVAL_METHOD,
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

  const model = getPlacementModel(modelId);
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
  const safeConversation = (Array.isArray(conversation) ? conversation : [])
    .slice(-6)
    .map((turn) => ({
      question: String(turn?.question || "").trim().slice(0, 300),
      transcript: String(turn?.transcript || "").trim().slice(0, 3000),
      inputMode: turn?.inputMode === "voice_transcript" ? "voice_transcript" : "typed",
    }))
    .filter((turn) => turn.transcript);
  const currentTurn = {
    question: String(currentQuestion || "").trim().slice(0, 300),
    transcript: text.slice(0, 3000),
    inputMode: inputMode === "voice_transcript" ? "voice_transcript" : "typed",
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
  const model = getPlacementModel(modelId);
  if (!model) throw new Error("model not found");
  const imageContext = model.skill === "bildbeschreibung"
    ? sanitizeSelectedImageContext(selectedImage)
    : null;
  return sanitizePlacementEvaluation(
    raw || {}, model, followUpCount, conversation, imageContext
  );
}
