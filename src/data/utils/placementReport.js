/**
 * Placement-only learner report + personalized plan (presentation layer).
 * Does NOT re-score or change final level / skillBands.
 */

import {
  getPlacementBildAssessmentPackByKey,
  getPlacementBildReportTopic,
} from "../placementBildAssessmentPacks.js";
import {
  getPlacementPlanningPack,
  getPlacementPlanningReportTopic,
} from "../placementPlanningPacks.js";

export const PLACEMENT_AREA_ORDER = [
  "selbstvorstellung",
  "bildbeschreibung",
  "lesenHoeren",
  "planung",
];

const AREA_LABELS = {
  selbstvorstellung: "Selbstvorstellung",
  bildbeschreibung: "Bildbeschreibung",
  lesenHoeren: "Hören",
  hoeren: "Hören",
  planung: "Planung",
};

const BAND_LEARNER = {
  weak: {
    label: "Noch unsicher",
    short: "braucht gezielte Übung",
  },
  medium: {
    label: "Solide Grundlage",
    short: "kann mit mehr Training sicherer werden",
  },
  strong: {
    label: "Stark",
    short: "gut gelungen — weiter festigen",
  },
};

const LEVEL_EXPLANATIONS = {
  A2: "Sie können sich in einfachen Alltagssituationen verständigen. Kurze, klare Sätze und wichtige persönliche Angaben gelingen Ihnen bereits.",
  "A2+": "Sie bewegen sich sicher im A2-Bereich und beginnen, etwas ausführlicher zu sprechen. Mit gezieltem Training erreichen Sie bald stabile B1-Strukturen.",
  "B1-": "Sie nähern sich dem B1-Niveau. Sie können schon mehr begründen und längere Antworten geben — diese Sicherheit sollte jetzt gefestigt werden.",
  B1: "Sie können die meisten Alltagsthemen selbstständig bewältigen: sich vorstellen, beschreiben, zuhören und gemeinsam planen.",
  "B1+": "Ihr B1 ist stark. Sie argumentieren schon klarer und können komplexere Aufgaben angehen. Ideal, um Richtung B2 zu trainieren.",
  "B2-": "Sie zeigen bereits B2-nahe Leistungen. Differenzierte Meinungen und längere Gespräche gelingen Ihnen weitgehend sicher.",
};

const SELF_TOPICS = {
  name: { label: "Name", aliases: /\b(name|heiss\w*)\b/ },
  origin: { label: "Herkunft", aliases: /\b(herkunft|woher|heimat|komm\w* aus)\b/ },
  residence: { label: "Wohnort", aliases: /\b(wohnort|wo wohn|leb\w* in)\b/ },
  residence_duration: { label: "Aufenthaltsdauer", aliases: /\b(wie lange|aufenthaltsdauer|seit wann.*osterreich)\b/ },
  work: { label: "Arbeit oder Ausbildung", aliases: /\b(arbeit|beruf|job|ausbildung|kurs|studium|tatigkeit)\b/ },
  work_details: { label: "Berufliche Tätigkeit", aliases: /\b(arbeitsaufgabe|berufliche tatigkeit|was machen.*arbeit|arbeit.*genau)\b/ },
  family: { label: "Familie", aliases: /\b(familie|kinder|kind|verheiratet)\b/ },
  leisure: { label: "Freizeit", aliases: /\b(freizeit|hobb|wochenende)\b/ },
  german_learning: { label: "Deutschlernen", aliases: /\b(deutschlernen|deutsch lernen|deutschkurs)\b/ },
  german_reason: { label: "Grund für Deutschlernen", aliases: /\b(grund.*deutsch|warum.*deutsch|deutsch.*grund)\b/ },
  german_difficulty: { label: "Schwierigkeiten beim Deutschlernen", aliases: /\b(schwierig\w*.*deutsch|deutsch.*schwierig|problem.*deutsch)\b/ },
  learning_strategy: { label: "Lernstrategie", aliases: /\b(lernstrategie|hilft.*lernen|wie.*lern)\b/ },
  daily_routine: { label: "Tagesablauf", aliases: /\b(tagesablauf|normaler tag|morgens.*abends)\b/ },
  past_experience: { label: "Erfahrung in Österreich", aliases: /\b(erfahrung.*osterreich|anfang.*osterreich)\b/ },
  future_plan: { label: "Zukunftspläne", aliases: /\b(zukunft|zukunftsplan|plane|pläne|spater.*machen)\b/ },
  professional_goal: { label: "Berufliche Ziele", aliases: /\b(berufliche?\w* ziel\w*|karriere|spater.*arbeit|zukunft.*beruf)\b/ },
  reason: { label: "Begründung", aliases: /\b(begrundung|grund|warum)\b/ },
  example: { label: "Beispiel", aliases: /\b(beispiel)\b/ },
  comparison: { label: "Vergleich", aliases: /\b(vergleich|heimatland|bei uns)\b/ },
  opinion: { label: "Eigene Meinung", aliases: /\b(meinung|ich finde|ich denke)\b/ },
  integration_opinion: { label: "Meinung zum Leben in Österreich", aliases: /\b(integration|zugehor|dazugehor|gut leben.*osterreich)\b/ },
};

function normalizeSemanticText(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function canonicalSelfTopic(value) {
  const text = normalizeSemanticText(value);
  if (!text) return null;
  if (SELF_TOPICS[text]) return text;
  if (/\b(berufliche?\w* ziel\w*|karriere|spater.*arbeit|beruflich.*zukunft)\b/.test(text)) {
    return "professional_goal";
  }
  if (/\b(zukunft|zukunftsplan|plane|spater.*machen)\b/.test(text)) {
    return "future_plan";
  }
  return Object.entries(SELF_TOPICS).find(([, topic]) => topic.aliases.test(text))?.[0] || null;
}

function semanticSelfCoverage(evals = []) {
  const transcript = normalizeSemanticText(
    evals.map((ev) => ev?.transcript || "").filter(Boolean).join(" ")
  );
  const covered = new Set();
  const mark = (id, pattern) => { if (pattern.test(transcript)) covered.add(id); };
  mark("name", /\b(?:ich heisse|mein name ist|ich name)\s+[a-z]{2,}/);
  mark("origin", /\b(?:ich\s+)?komm\w*\s+(?:aus\s+)?[a-z]{3,}/);
  mark("residence", /\b(?:ich\s+)?(?:wohn\w*|leb\w*)\s+(?:in\s+)?[a-z]{3,}/);
  mark("residence_duration", /\bseit\s+(?:\d+|ein\w*|zwei|drei|vier|funf|sechs|sieben|acht|neun|zehn)\s+(?:monat\w*|jahr\w*)/);
  mark("work", /\b(?:arbeite|arbeiten|tatig|ausbildung|deutschkurs|studiere|studium|arbeitslos|arbeitssuchend)\b/);
  mark("work_details", /\b(kontrollier\w*|bereit\w*|bedien\w*|verkauf\w*|liefer\w*|reparier\w*|organisier\w*|betreu\w*|pflege\w*)\b/);
  mark("family", /\b(familie|verheiratet|kind\w*|sohn|tochter|ehemann|ehefrau|partner)\b/);
  mark("leisure", /\b(?:freizeit|wochenende|hobby)\b[^.]*|\b(?:spiele|lese|trainiere|wandere|schwimme)\b[^.]*/);
  mark("german_learning", /\b(?:lerne|lernen|ubere|besuche)\b[^.]*\bdeutsch|\bdeutschkurs\b/);
  mark("german_reason", /\bdeutsch\b[^.]*(?:weil|damit|fur|um zu)\b|(?:weil|damit|um zu)\b[^.]*\bdeutsch\b/);
  mark("german_difficulty", /\b(?:deutsch|lernen|sprechen|verstehen)\b[^.]*(?:schwierig|schwer|problem)/);
  mark("learning_strategy", /\b(?:hilft|lerne|ubere)\b[^.]*(?:lesen|horen|sprechen|app|kurs|podcast|freunde)/);
  mark("daily_routine", /\b(?:morgens|vormittags|mittags|nachmittags|abends|jeden tag|normalerweise)\b[^.]+/);
  mark("past_experience", /\b(?:am anfang|fruher|damals|als ich)\b[^.]*(?:osterreich|hier)/);
  mark("future_plan", /\b(?:spater|in zukunft|nachstes jahr)\b[^.]*(?:mochte|werde|will)|\b(?:mochte|will|werde)\b[^.]*(?:machen|lernen|studieren|arbeiten|leben)/);
  mark("professional_goal", /\b(?:beruflich|karriere)\b[^.]*(?:mochte|will|werde|ziel)|\b(?:mochte|will)\b[^.]*\b(?:arbeiten|ausbildung|selbststandig)\b/);
  mark("reason", /\b(weil|denn|deshalb|daher|darum|damit|um zu)\b/);
  mark("example", /\b(zum beispiel|beispielsweise|etwa)\b/);
  mark("comparison", /\b(im vergleich|anders als|genauso wie|in meiner heimat|in meinem heimatland|bei uns)\b/);
  mark("opinion", /\b(ich finde|ich denke|ich glaube|meiner meinung nach|fur mich)\b/);
  mark("integration_opinion", /\b(dazugehor\w*|zugehor\w*|integra\w*|gut leben)\b[^.]*(?:wichtig|muss|sollte|braucht)/);
  return covered;
}

function selfAssessmentOpportunities(evals = []) {
  const assessed = new Set();
  for (const ev of evals) {
    const id = canonicalSelfTopic(ev?.question);
    if (id) assessed.add(id);
  }
  return assessed;
}

function hadSelfAssessmentOpportunity(id, assessed) {
  if (assessed.has(id)) return true;
  if (["future_plan", "professional_goal"].includes(id)) {
    return assessed.has("future_plan") || assessed.has("professional_goal");
  }
  if (["work", "work_details"].includes(id)) {
    return assessed.has("work") || assessed.has("work_details");
  }
  if (["german_learning", "german_reason", "german_difficulty", "learning_strategy"].includes(id)) {
    return assessed.has(id);
  }
  return false;
}

function normalizeBand(band) {
  const key = String(band || "")
    .toLowerCase()
    .trim();
  if (key === "schwach" || key === "weak") return "weak";
  if (key === "mittel" || key === "medium") return "medium";
  if (key === "stark" || key === "strong") return "strong";
  return null;
}

export function areaLabel(skill) {
  return AREA_LABELS[skill] || skill;
}

/** Weekly Plan uses hoeren, not lesenHoeren */
export function mapFocusForWeeklyPlan(skill) {
  if (skill === "lesenHoeren") return "hoeren";
  return skill;
}

export function mapFocusListForWeeklyPlan(skills = []) {
  const seen = new Set();
  const out = [];
  for (const s of skills) {
    const mapped = mapFocusForWeeklyPlan(s);
    if (!mapped || seen.has(mapped)) continue;
    seen.add(mapped);
    out.push(mapped);
  }
  return out;
}

/**
 * Sanitize turnEvidence into learner-safe topic summary only.
 * @param {Record<string, Array<object>>} turnEvidence
 * @param {Record<string, string>} skillBands
 */
export function buildEvidenceSummary(turnEvidence = {}, skillBands = {}) {
  const summary = {};

  for (const skillKey of PLACEMENT_AREA_ORDER) {
    const libKey =
      skillKey === "lesenHoeren"
        ? "hoeren"
        : skillKey;
    const evals =
      turnEvidence[skillKey] ||
      turnEvidence[libKey] ||
      [];
    const covered = new Set();
    const missing = new Set();
    const coveredTopicIds = new Set();
    const missingTopicIds = new Set();
    const bildPackKeys = new Set();
    const listeningModels = new Map();
    const listeningQuestionResults = new Map();
    const planningPackIds = new Set();
    const transcripts = [];

    const selfSemanticCovered = skillKey === "selbstvorstellung"
      ? semanticSelfCoverage(evals)
      : new Set();
    const selfAssessedTopics = skillKey === "selbstvorstellung"
      ? selfAssessmentOpportunities(evals)
      : new Set();

    for (const ev of evals) {
      if (skillKey === "bildbeschreibung") {
        const pack = getPlacementBildAssessmentPackByKey(ev?.bildAssessmentPackKey);
        if (pack) {
          bildPackKeys.add(pack.key);
          for (const t of ev?.coveredTopics || []) {
            const topic = getPlacementBildReportTopic(pack, t);
            if (!topic) continue;
            coveredTopicIds.add(topic.id);
            covered.add(topic.label);
          }
          for (const t of ev?.missingTopics || []) {
            const topic = getPlacementBildReportTopic(pack, t);
            if (!topic) continue;
            missingTopicIds.add(topic.id);
            missing.add(topic.label);
          }
        }
        // Legacy Bild evidence without a resolvable closed pack is omitted.
        // It must never fall back to stale routed-model topics.
      } else if (skillKey === "selbstvorstellung") {
        for (const t of ev?.coveredTopics || []) {
          const id = canonicalSelfTopic(t);
          if (id) coveredTopicIds.add(id);
        }
        for (const t of ev?.missingTopics || []) {
          const id = canonicalSelfTopic(t);
          if (id && hadSelfAssessmentOpportunity(id, selfAssessedTopics)) {
            missingTopicIds.add(id);
          }
        }
      } else if (skillKey === "lesenHoeren" && ev?.listeningResult?.questionResults) {
        const modelId = String(ev?.listeningModel?.id || ev?.modelId || "").trim();
        if (modelId) listeningModels.set(modelId, {
          id: modelId,
          title: String(ev?.listeningModel?.title || "").trim(),
          level: String(ev?.listeningModel?.level || ev?.modelLevel || "").trim(),
          difficulty: String(ev?.listeningModel?.difficulty || "").trim(),
          audioRef: ev?.listeningModel?.audioRef || null,
        });
        for (const result of ev.listeningResult.questionResults) {
          const questionId = String(result?.questionId || "").trim();
          const question = String(result?.question || "").trim();
          if (!questionId || !question) continue;
          listeningQuestionResults.set(questionId, {
            questionId,
            question,
            isCorrect: Boolean(result?.isCorrect),
          });
          (result?.isCorrect ? covered : missing).add(question);
        }
      } else if (skillKey === "planung") {
        const pack = getPlacementPlanningPack(ev?.planningPackId || ev?.modelId);
        if (!pack || ev?.planningPackId !== pack.scenarioId) continue;
        planningPackIds.add(pack.scenarioId);
        for (const id of ev?.coveredTopics || []) {
          const topic = getPlacementPlanningReportTopic(pack, id);
          if (!topic) continue;
          coveredTopicIds.add(topic.id);
          covered.add(topic.label);
        }
        for (const id of ev?.missingTopics || []) {
          const topic = getPlacementPlanningReportTopic(pack, id);
          if (!topic) continue;
          missingTopicIds.add(topic.id);
          missing.add(topic.label);
        }
      } else {
        for (const t of ev?.coveredTopics || []) {
          const s = String(t || "").trim();
          if (s) covered.add(s);
        }
        for (const t of ev?.missingTopics || []) {
          const s = String(t || "").trim();
          if (s) missing.add(s);
        }
      }
      if (ev?.transcript) {
        transcripts.push({
          question: String(ev.question || "").trim().slice(0, 300),
          transcript: String(ev.transcript || "").trim().slice(0, 3000),
          inputMode:
            ev.inputMode === "voice_transcript" ? "voice_transcript" : "typed",
        });
      }
    }

    if (skillKey === "selbstvorstellung") {
      for (const id of selfSemanticCovered) coveredTopicIds.add(id);
      for (const id of coveredTopicIds) missingTopicIds.delete(id);
      for (const id of coveredTopicIds) covered.add(SELF_TOPICS[id]?.label || id);
      for (const id of missingTopicIds) missing.add(SELF_TOPICS[id]?.label || id);
    }

    // Topics that appear covered later should not stay as missing
    for (const c of covered) missing.delete(c);
    for (const c of coveredTopicIds) missingTopicIds.delete(c);

    summary[skillKey] = {
      band: normalizeBand(skillBands[skillKey]) || null,
      coveredTopics: [...covered].slice(0, 12),
      missingTopics: [...missing].slice(0, 12),
      ...(["selbstvorstellung", "bildbeschreibung", "planung"].includes(skillKey)
        ? {
            coveredTopicIds: [...coveredTopicIds].slice(0, 12),
            missingTopicIds: [...missingTopicIds].slice(0, 12),
          }
        : {}),
      ...(skillKey === "bildbeschreibung"
        ? { bildAssessmentPackKeys: [...bildPackKeys] }
        : {}),
      ...(skillKey === "lesenHoeren"
        ? {
            listeningModels: [...listeningModels.values()],
            listeningQuestionResults: [...listeningQuestionResults.values()],
          }
        : {}),
      ...(skillKey === "planung"
        ? { planningPackIds: [...planningPackIds] }
        : {}),
      transcripts: transcripts.slice(0, 6),
    };
  }

  return summary;
}

function bandRank(band) {
  const n = normalizeBand(band);
  if (n === "weak") return 0;
  if (n === "medium") return 1;
  if (n === "strong") return 2;
  return 3;
}

function prioritizeSkills(skillBands = {}) {
  return [...PLACEMENT_AREA_ORDER].sort((a, b) => {
    const d = bandRank(skillBands[a]) - bandRank(skillBands[b]);
    if (d !== 0) return d;
    return PLACEMENT_AREA_ORDER.indexOf(a) - PLACEMENT_AREA_ORDER.indexOf(b);
  });
}

function taskForSkill(level, skill, band, missingTopics = []) {
  const label = areaLabel(skill);
  const miss = missingTopics.slice(0, 3);
  const missHint = miss.length
    ? ` Achten Sie besonders auf: ${miss.join(", ")}.`
    : "";

  const n = normalizeBand(band);
  if (skill !== "planung" && (n === "weak" || n === "medium")) {
    return miss.length
      ? `${level}: ${label} gezielt mit den tatsächlich offenen Punkten üben.${missHint}`
      : `${level}: ${label} mit einer kurzen Aufgabe auf diesem Schwierigkeitsniveau festigen.`;
  }
  if (n === "weak") {
    const base = {
      selbstvorstellung: `${level}: Selbstvorstellung mit Name, Herkunft, Wohnort, Arbeit/Kurs und Freizeit üben (1 Minute), dann 2–3 Nachfragen.${missHint}`,
      bildbeschreibung: `${level}: Bildbeschreibung üben — Personen, Ort und Handlung klar nennen.${missHint}`,
      lesenHoeren: `${level}: Kurze Hörtexte 2× hören, Stichworte notieren und in ganzen Sätzen antworten.${missHint}`,
      planung: `${level}: Einfaches Planungsgespräch: Vorschlag, Zeit, Ort, Zustimmung und Entscheidung.${missHint}`,
    };
    return base[skill] || `${level}: ${label} gezielt üben.${missHint}`;
  }

  if (n === "medium") {
    const base = {
      selbstvorstellung: `${level}: Selbstvorstellung etwas länger machen und Gründe nennen (weil/deshalb).${missHint}`,
      bildbeschreibung: `${level}: Bild beschreiben und kurz Meinung + eigene Erfahrung ergänzen.${missHint}`,
      lesenHoeren: `${level}: Hören mit Detailfragen üben und Antworten begründen.${missHint}`,
      planung: `${level}: Planung mit Begründung, Alternative und klarer Entscheidung üben.${missHint}`,
    };
    return base[skill] || `${level}: ${label} vertiefen.${missHint}`;
  }

  const base = {
    selbstvorstellung: `${level}: Selbstvorstellung kurz wiederholen und flüssig halten (Wartung).`,
    bildbeschreibung: `${level}: Eine Bildbeschreibung freier und flüssiger wiederholen.`,
    lesenHoeren: `${level}: Ein kurzes Hörtraining zur Festigung.`,
    planung: `${level}: Ein kurzes Planungsgespräch zur Festigung.`,
  };
  return base[skill] || `${level}: ${label} kurz festigen.`;
}

/**
 * Deterministic personalized study plan (Placement-specific).
 * Does not call placementEngine.buildStudyPlan.
 */
export function buildDeterministicPlacementStudyPlan({
  level,
  skillBands = {},
  evidenceSummary = {},
}) {
  const ordered = prioritizeSkills(skillBands);
  const weakOrMedium = ordered.filter((s) => {
    const b = normalizeBand(skillBands[s]);
    return b === "weak" || b === "medium";
  });
  const focus = (weakOrMedium.length ? weakOrMedium : ordered).slice(0, 3);
  while (focus.length < 3) {
    const next = ordered.find((s) => !focus.includes(s));
    if (!next) break;
    focus.push(next);
  }

  const days = ["Tag 1", "Tag 3", "Tag 5"];
  const plan = focus.map((skill, i) => ({
    day: days[i],
    focus: mapFocusForWeeklyPlan(skill),
    skill,
    task: taskForSkill(
      level,
      skill,
      skillBands[skill],
      evidenceSummary[skill]?.missingTopics || []
    ),
  }));

  plan.push({
    day: "Tag 7",
    focus: "prüfungsvorbereitung",
    skill: "prüfungsvorbereitung",
    task: `${level}: Kurze Wiederholung der fokussierten Themen und eine kleine Sprechprobe (2–3 Minuten).`,
  });

  return plan;
}

function buildAreaBreakdown(skillBands, evidenceSummary) {
  return PLACEMENT_AREA_ORDER.map((skill) => {
    const band = normalizeBand(skillBands[skill]);
    const learner = BAND_LEARNER[band] || {
      label: "Noch keine Einschätzung",
      short: "",
    };
    const ev = evidenceSummary[skill] || {};
    const listeningTitle = skill === "lesenHoeren"
      ? ev.listeningModels?.find((item) => item?.title)?.title
      : null;
    const summary = skill === "lesenHoeren" && ev.listeningQuestionResults?.length
      ? `${learner.short}${listeningTitle ? ` in der Hörübung „${listeningTitle}“` : " in der ausgewählten Hörübung"}.`
      : learner.short;
    return {
      skill,
      label: areaLabel(skill),
      band,
      performanceLabel: learner.label,
      summary,
      coveredTopics: ev.coveredTopics || [],
      missingTopics: ev.missingTopics || [],
    };
  });
}

function buildRecommendations(level, skillBands, evidenceSummary) {
  const recs = [];
  const seen = new Set();
  const add = (text) => {
    const key = normalizeSemanticText(text);
    if (!key || seen.has(key)) return;
    seen.add(key);
    recs.push(text);
  };
  const ordered = prioritizeSkills(skillBands);

  for (const skill of ordered) {
    const band = normalizeBand(skillBands[skill]);
    const miss = evidenceSummary[skill]?.missingTopics || [];
    if (band === "weak") {
      add(
        miss.length
          ? `${areaLabel(skill)}: Zuerst die fehlenden Punkte üben (${miss.slice(0, 3).join(", ")}).`
          : `${areaLabel(skill)}: Täglich 5–10 Minuten mit einfachem Aufbau üben.`
      );
    } else if (miss.length) {
      add(`${areaLabel(skill)}: Die noch offenen Punkte gezielt üben (${miss.slice(0, 3).join(", ")}).`);
    }
  }

  const strong = ordered.filter((s) =>
    normalizeBand(skillBands[s]) === "strong" &&
    hasEvidenceForSkill(s, evidenceSummary[s])
  );
  if (strong.length) {
    add(
      `Stärken beibehalten: ${strong.map(areaLabel).join(", ")} — kurz wiederholen, nicht vernachlässigen.`
    );
  }

  if (!recs.length) {
    recs.push(`${level}: Regelmäßig kurze Sprechübungen machen und den Wochenplan nutzen.`);
  }

  return recs.slice(0, 6);
}

function hasEvidenceForSkill(skill, evidence = {}) {
  if (skill === "selbstvorstellung") {
    return Boolean(evidence.transcripts?.length || evidence.coveredTopicIds?.length);
  }
  if (skill === "bildbeschreibung") {
    return Boolean(evidence.bildAssessmentPackKeys?.length && evidence.coveredTopicIds?.length);
  }
  if (skill === "lesenHoeren") {
    return Boolean(evidence.listeningQuestionResults?.length);
  }
  if (skill === "planung") {
    return Boolean(evidence.planningPackIds?.length && evidence.transcripts?.length);
  }
  return true;
}

/**
 * Deterministic learner-facing report from finalized Placement result.
 */
export function buildDeterministicLearnerReport({
  level,
  skillBands = {},
  strengths = [],
  weaknesses = [],
  evidenceSummary = {},
}) {
  const areas = buildAreaBreakdown(skillBands, evidenceSummary);
  const studyPlan = buildDeterministicPlacementStudyPlan({
    level,
    skillBands,
    evidenceSummary,
  });
  const evidenceStrengths = strengths.filter((skill) =>
    normalizeBand(skillBands[skill]) === "strong" &&
    hasEvidenceForSkill(skill, evidenceSummary[skill])
  );
  const improvementSkills = [...new Set([
    ...weaknesses,
    ...PLACEMENT_AREA_ORDER.filter((skill) =>
      (evidenceSummary[skill]?.missingTopics || []).length > 0
    ),
  ])];

  return {
    level,
    levelExplanation:
      LEVEL_EXPLANATIONS[level] ||
      `Ihr Ergebnis ist ${level}. Trainieren Sie gezielt die Bereiche mit dem größten Übungsbedarf.`,
    areas,
    strengths: evidenceStrengths.map((s) => ({
      skill: s,
      label: areaLabel(s),
      text: `${areaLabel(s)} war in diesem Test eine Stärke.`,
    })),
    improvements: improvementSkills.map((s) => ({
      skill: s,
      label: areaLabel(s),
      text: weaknesses.includes(s)
        ? `${areaLabel(s)} sollte priorisiert geübt werden.`
        : `${areaLabel(s)} ist insgesamt tragfähig; einzelne Punkte können noch gezielt verbessert werden.`,
      missingTopics: evidenceSummary[s]?.missingTopics || [],
    })),
    recommendations: buildRecommendations(level, skillBands, evidenceSummary),
    studyPlan,
    transcripts: PLACEMENT_AREA_ORDER.flatMap((skill) =>
      (evidenceSummary[skill]?.transcripts || []).map((turn) => ({
        skill,
        label: areaLabel(skill),
        ...turn,
      }))
    ),
  };
}

/**
 * Assemble persistable profile: learner fields + optional internal scoring bag.
 * Final level / bands come only from the already-finalized historical result.
 */
export function assemblePlacementLearnerProfile({
  historicalResult,
  turnEvidence = {},
}) {
  const level = historicalResult.level;
  const skillBands = { ...(historicalResult.skillBands || {}) };
  const evidenceSummary = buildEvidenceSummary(turnEvidence, skillBands);
  const learnerReport = buildDeterministicLearnerReport({
    level,
    skillBands,
    strengths: historicalResult.strengths || [],
    weaknesses: historicalResult.weaknesses || [],
    evidenceSummary,
  });

  const focusAreas = historicalResult.focusAreas || [];
  const recommendedFocus = mapFocusListForWeeklyPlan(
    historicalResult.recommendedFocus || focusAreas
  );

  return {
    level,
    selectedStartLevel: historicalResult.selectedStartLevel,
    date: historicalResult.date || new Date().toISOString(),
    skillBands,
    strengths: historicalResult.strengths || [],
    weaknesses: historicalResult.weaknesses || [],
    focusAreas,
    recommendedFocus,
    studyPlan: learnerReport.studyPlan,
    learnerReport,
    evidenceSummary,
    reportGeneratedAt: new Date().toISOString(),
    reportSource: "deterministic",
    // Internal compatibility — never render in learner UI
    internal: {
      skillScores: historicalResult.skillScores,
      placementScore: historicalResult.placementScore,
      bandScoreMapping: historicalResult.bandScoreMapping,
      scoringMethod: historicalResult.scoringMethod,
      modelsUsed: historicalResult.modelsUsed,
    },
  };
}

/**
 * Merge AI polish into profile without changing level/bands.
 * @param {object} profile
 * @param {object} polished — { levelExplanation?, areas?, strengths?, improvements?, recommendations?, studyPlan? }
 */
export function applyPolishedLearnerReport(profile, polished) {
  if (!profile || !polished) return profile;

  const base = profile.learnerReport || {};
  const nextReport = {
    ...base,
    level: profile.level,
    levelExplanation:
      typeof polished.levelExplanation === "string" && polished.levelExplanation.trim()
        ? polished.levelExplanation.trim()
        : base.levelExplanation,
    areas: Array.isArray(polished.areas) && polished.areas.length
      ? polishAreas(base.areas, polished.areas, profile.skillBands)
      : base.areas,
    strengths: Array.isArray(polished.strengths) && polished.strengths.length
      ? polishList(base.strengths, polished.strengths, profile.strengths)
      : base.strengths,
    improvements: Array.isArray(polished.improvements) && polished.improvements.length
      ? polishList(base.improvements, polished.improvements, profile.weaknesses)
      : base.improvements,
    recommendations: mergeGroundedRecommendations(
      base.recommendations,
      polished.recommendations
    ),
    studyPlan:
      Array.isArray(polished.studyPlan) && polished.studyPlan.length
        ? polished.studyPlan.slice(0, 6).map((item, i) => ({
            day: item.day || base.studyPlan?.[i]?.day || `Tag ${i + 1}`,
            focus: mapFocusForWeeklyPlan(
              item.focus || item.skill || base.studyPlan?.[i]?.focus
            ),
            skill: item.skill || base.studyPlan?.[i]?.skill,
            task: String(item.task || base.studyPlan?.[i]?.task || "").trim(),
          }))
        : base.studyPlan,
  };

  return {
    ...profile,
    studyPlan: nextReport.studyPlan,
    learnerReport: nextReport,
    reportGeneratedAt: new Date().toISOString(),
    reportSource: "ai",
  };
}

function mergeGroundedRecommendations(baseRecommendations = [], polishedRecommendations = []) {
  return baseRecommendations.map(String).filter(Boolean).slice(0, 8);
}

function polishAreas(baseAreas = [], polishedAreas = [], skillBands = {}) {
  const bySkill = new Map(polishedAreas.map((a) => [a.skill, a]));
  return baseAreas.map((area) => {
    const p = bySkill.get(area.skill);
    if (!p) return area;
    return area;
  });
}

function polishList(baseList = [], polishedList = [], allowedSkills = []) {
  const allowed = new Set(allowedSkills);
  const bySkill = new Map(
    polishedList.filter((x) => allowed.has(x.skill)).map((x) => [x.skill, x])
  );
  return baseList.map((item) => {
    const p = bySkill.get(item.skill);
    if (!p) return item;
    return item;
  });
}

/** Payload safe to send to Placement report AI (no internals) */
export function buildPlacementReportAiInput(profile) {
  return {
    productType: "placement_test",
    level: profile.level,
    skillBands: profile.skillBands,
    strengths: profile.strengths,
    weaknesses: profile.weaknesses,
    focusAreas: profile.focusAreas,
    evidenceSummary: profile.evidenceSummary,
    deterministicReport: {
      levelExplanation: profile.learnerReport?.levelExplanation,
      areas: profile.learnerReport?.areas,
      recommendations: profile.learnerReport?.recommendations,
      studyPlan: profile.learnerReport?.studyPlan,
    },
  };
}
