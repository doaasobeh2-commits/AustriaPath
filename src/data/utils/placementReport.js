/**
 * Placement-only learner report + personalized plan (presentation layer).
 * Does NOT re-score or change final level / skillBands.
 */

import {
  getPlacementBildAssessmentPackByKey,
  getPlacementBildReportTopic,
} from "../placementBildAssessmentPacks.js";

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
    const transcripts = [];

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

    // Topics that appear covered later should not stay as missing
    for (const c of covered) missing.delete(c);
    for (const c of coveredTopicIds) missingTopicIds.delete(c);

    summary[skillKey] = {
      band: normalizeBand(skillBands[skillKey]) || null,
      coveredTopics: [...covered].slice(0, 12),
      missingTopics: [...missing].slice(0, 12),
      ...(skillKey === "bildbeschreibung"
        ? {
            coveredTopicIds: [...coveredTopicIds].slice(0, 12),
            missingTopicIds: [...missingTopicIds].slice(0, 12),
            bildAssessmentPackKeys: [...bildPackKeys],
          }
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
    return {
      skill,
      label: areaLabel(skill),
      band,
      performanceLabel: learner.label,
      summary: learner.short,
      coveredTopics: ev.coveredTopics || [],
      missingTopics: ev.missingTopics || [],
    };
  });
}

function buildRecommendations(level, skillBands, evidenceSummary) {
  const recs = [];
  const ordered = prioritizeSkills(skillBands);

  for (const skill of ordered) {
    const band = normalizeBand(skillBands[skill]);
    const miss = evidenceSummary[skill]?.missingTopics || [];
    if (band === "weak") {
      recs.push(
        miss.length
          ? `${areaLabel(skill)}: Zuerst die fehlenden Punkte üben (${miss.slice(0, 3).join(", ")}).`
          : `${areaLabel(skill)}: Täglich 5–10 Minuten mit einfachem Aufbau üben.`
      );
    } else if (band === "medium") {
      recs.push(
        `${areaLabel(skill)}: Antworten etwas länger machen und mit weil/deshalb begründen.`
      );
    }
  }

  const strong = ordered.filter((s) => normalizeBand(skillBands[s]) === "strong");
  if (strong.length) {
    recs.push(
      `Stärken beibehalten: ${strong.map(areaLabel).join(", ")} — kurz wiederholen, nicht vernachlässigen.`
    );
  }

  if (!recs.length) {
    recs.push(`${level}: Regelmäßig kurze Sprechübungen machen und den Wochenplan nutzen.`);
  }

  return recs.slice(0, 6);
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

  return {
    level,
    levelExplanation:
      LEVEL_EXPLANATIONS[level] ||
      `Ihr Ergebnis ist ${level}. Trainieren Sie gezielt die Bereiche mit dem größten Übungsbedarf.`,
    areas,
    strengths: strengths.map((s) => ({
      skill: s,
      label: areaLabel(s),
      text: `${areaLabel(s)} war in diesem Test eine Stärke.`,
    })),
    improvements: weaknesses.map((s) => ({
      skill: s,
      label: areaLabel(s),
      text: `${areaLabel(s)} sollte priorisiert geübt werden.`,
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
    recommendations: Array.isArray(polished.recommendations) &&
      polished.recommendations.length
      ? polished.recommendations.map((r) => String(r)).filter(Boolean).slice(0, 8)
      : base.recommendations,
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

function polishAreas(baseAreas = [], polishedAreas = [], skillBands = {}) {
  const bySkill = new Map(polishedAreas.map((a) => [a.skill, a]));
  return baseAreas.map((area) => {
    const p = bySkill.get(area.skill);
    if (!p) return area;
    return {
      ...area,
      band: normalizeBand(skillBands[area.skill]) || area.band,
      performanceLabel:
        typeof p.performanceLabel === "string" && p.performanceLabel.trim()
          ? p.performanceLabel.trim()
          : area.performanceLabel,
      summary:
        typeof p.summary === "string" && p.summary.trim()
          ? p.summary.trim()
          : area.summary,
      coveredTopics: area.coveredTopics,
      missingTopics: area.missingTopics,
    };
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
    return {
      ...item,
      text:
        typeof p.text === "string" && p.text.trim() ? p.text.trim() : item.text,
      missingTopics: item.missingTopics,
    };
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
