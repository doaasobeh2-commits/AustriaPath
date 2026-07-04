/**
 * Maps catalog content / blueprints to legacy UI part shapes.
 *
 * @module exam-platform/adapters/blueprintPartsMapper
 */

import { findCatalogEntry } from "../modelCatalogService.js";

function normalizeQuestions(questions = []) {
  return questions.map((q) => ({
    q: q.q || q.frage || q.question || "",
    options: q.options || ["Antwort schreiben"],
    answer: q.a || q.answer || q.correct || "",
  }));
}

function getText(item) {
  if (!item) return "";
  if (typeof item.task === "string") return item.task;
  if (Array.isArray(item.task)) return item.task.join("\n");
  return item.text || item.content || "";
}

/**
 * @param {import('../contracts.js').ModelCatalogEntry} catalogEntry
 * @param {import('../contracts.js').BlueprintSection} section
 */
export function catalogEntryToUiParts(catalogEntry, section) {
  const content = catalogEntry?.contentRef?.content || {};
  const level = catalogEntry?.level || "B1";
  const platformSectionIndex = section.sectionIndex;

  if (content.kind === "writing" || section.skill === "writing") {
    const email = content.emails?.[0];
    return [
      {
        type: "writing",
        label: "Schreiben",
        title: email?.title || content.title || "E-Mail schreiben",
        instruction: "Schreiben Sie eine E-Mail. Bearbeiten Sie alle Punkte.",
        taskPoints: email?.task || content.task || [],
        modelId: catalogEntry.id,
        platformSectionIndex,
        platformSkill: "writing",
      },
    ];
  }

  if (section.skill === "reading" && content.teil1 && content.teil2) {
    return [
      {
        type: "reading_cloze",
        label: "Lesen",
        title: `${content.title || "Lesen"} · Teil 1`,
        instruction: content.teil1.title,
        text: content.teil1.text,
        options: content.teil1.options || {},
        answers: content.teil1.answers || {},
        modelId: catalogEntry.id,
        platformSectionIndex,
        platformSkill: "reading",
        platformPart: "teil1",
      },
      {
        type: "reading_ads",
        label: "Lesen",
        title: `${content.title || "Lesen"} · Teil 2`,
        instruction: content.teil2.intro,
        imageUrl: content.teil2.image,
        questions: normalizeQuestions(content.teil2.questions || []),
        modelId: catalogEntry.id,
        platformSectionIndex,
        platformSkill: "reading",
        platformPart: "teil2",
      },
    ];
  }

  if (section.skill === "reading") {
    return [
      {
        type: "reading",
        label: "Lesen",
        title: content.title || "Lesen",
        instruction: "Lesen Sie den Text und beantworten Sie die Fragen.",
        text: getText(content),
        questions: normalizeQuestions(content.questions || content.fragen || []),
        modelId: catalogEntry.id,
        platformSectionIndex,
        platformSkill: "reading",
      },
    ];
  }

  if (section.skill === "listening") {
    return [
      {
        type: "listening",
        label: "Hören",
        title: content.title || "Hören",
        instruction: "Hören Sie den Text und beantworten Sie die Fragen.",
        audioText: content.audioText || content.text || content.content || "",
        questions: normalizeQuestions(content.questions || content.parts?.[0]?.questions || []),
        modelId: catalogEntry.id,
        platformSectionIndex,
        platformSkill: "listening",
      },
    ];
  }

  if (section.skill === "self_introduction") {
    return [
      {
        type: "self_intro",
        label: "Sprechen",
        title: content.title || "Selbstvorstellung",
        instruction: content.studentPreview || content.prompt || "Bitte stellen Sie sich kurz vor.",
        points: content.requiredTopics || content.questions || [],
        modelId: catalogEntry.id,
        platformSectionIndex,
        platformSkill: "self_introduction",
      },
    ];
  }

  if (section.skill === "picture_description") {
    return [
      {
        type: "image",
        label: level === "B2" ? "Grafikbeschreibung" : "Bildbeschreibung",
        title: content.title || "Bildbeschreibung",
        instruction:
          content.studentPreview ||
          "Beschreiben Sie das Bild. Sagen Sie auch Ihre Meinung oder Erfahrung.",
        imageUrl: content.imageUrl || content.src || content.url || content.image || "",
        points: content.requiredTopics || content.points || [],
        modelId: catalogEntry.id,
        platformSectionIndex,
        platformSkill: "picture_description",
      },
    ];
  }

  if (section.skill === "planning" || section.skill === "discussion") {
    return [
      {
        type: section.skill === "discussion" ? "roleplay" : "planning",
        label: section.skill === "discussion" ? "Diskussion" : "Planung",
        title: content.title || "Planung",
        instruction: content.situation || content.studentPreview || getText(content),
        points: content.points || content.followUps || [],
        modelId: catalogEntry.id,
        platformSectionIndex,
        platformSkill: section.skill,
      },
    ];
  }

  return [
    {
      type: "writing",
      label: section.skill,
      title: content.title || section.skill,
      instruction: getText(content),
      modelId: catalogEntry.id,
      platformSectionIndex,
      platformSkill: section.skill,
    },
  ];
}

/**
 * @param {import('../contracts.js').ExamBlueprint} blueprint
 * @param {import('../contracts.js').ModelCatalogEntry[]} catalog
 */
export function blueprintToUiParts(blueprint, catalog) {
  /** @type {Record<string, unknown>[]} */
  const parts = [];

  blueprint.sections.forEach((section) => {
    const entry = findCatalogEntry(catalog, section.modelId);
    if (!entry) return;
    parts.push(...catalogEntryToUiParts(entry, section));
  });

  return parts.map((part, index) => ({
    ...part,
    id: `${part.modelId}-${index}`,
    examiner: {
      examType: "OEIF",
      level: blueprint.targetLevel,
      sectionIndex: part.platformSectionIndex,
    },
  }));
}

/**
 * @param {Record<string, unknown>[]} parts
 */
export function groupPartsByPlatformSection(parts) {
  /** @type {Record<number, Record<string, unknown>[]>} */
  const groups = {};
  parts.forEach((part) => {
    const idx = part.platformSectionIndex ?? 0;
    if (!groups[idx]) groups[idx] = [];
    groups[idx].push(part);
  });
  return groups;
}

/**
 * @param {Record<string, unknown>[]} sectionParts
 * @param {Record<string, string>} uiAnswers
 * @param {number} uiStepOffset
 */
export function buildSectionAnswerFromUiParts(sectionParts, uiAnswers, uiStepOffset = 0) {
  const first = sectionParts[0];
  const skill = first.platformSkill || "writing";
  const sectionIndex = first.platformSectionIndex ?? 0;
  const modelId = first.modelId || "unknown";

  /** @type {Record<string, string>} */
  const mcqAnswers = {};
  let freeText = "";

  sectionParts.forEach((part, partIndex) => {
    const step = uiStepOffset + partIndex;

    if (part.type === "writing") {
      freeText = uiAnswers[`${step}-writing`] || uiAnswers[part.type] || "";
    }

    if (part.type === "reading_cloze") {
      Object.keys(part.options || part.answers || {}).forEach((gap) => {
        mcqAnswers[gap] = uiAnswers[`${step}-gap-${gap}`] || "";
      });
    }

    if (part.type === "reading_ads" || part.type === "reading") {
      (part.questions || []).forEach((_, qIndex) => {
        mcqAnswers[`${step}-q-${qIndex}`] = uiAnswers[`${step}-q-${qIndex}`] || "";
        mcqAnswers[qIndex] = uiAnswers[`${step}-q-${qIndex}`] || mcqAnswers[qIndex];
      });
    }

    if (part.type === "listening") {
      (part.questions || []).forEach((q, qIndex) => {
        const val = uiAnswers[`${step}-q-${qIndex}`] || "";
        mcqAnswers[String(qIndex)] = val;
        mcqAnswers[`p0-q${qIndex}`] = val;
      });
    }

    if (part.type === "self_intro" || part.type === "image" || part.type === "planning" || part.type === "roleplay") {
      freeText =
        uiAnswers[`${step}-writing`] ||
        uiAnswers[part.type] ||
        uiAnswers[`${step}-speech`] ||
        freeText;
    }
  });

  return {
    sectionIndex,
    skill,
    modelId,
    freeText: freeText || undefined,
    mcqAnswers: Object.keys(mcqAnswers).length ? mcqAnswers : undefined,
  };
}

/**
 * @param {Record<string, unknown>} part
 */
export function buildSectionContentFromUiPart(part) {
  if (part.type === "reading_cloze") {
    return {
      type: "reading_cloze",
      answers: part.answers || {},
      text: part.text,
      options: part.options,
    };
  }

  if (part.type === "reading_ads") {
    return {
      type: "reading_ads",
      questions: (part.questions || []).map((q) => ({
        q: q.q,
        a: q.answer || q.a,
      })),
    };
  }

  if (part.type === "listening") {
    return {
      questions: (part.questions || []).map((q) => ({
        q: q.q,
        a: q.answer || q.a,
      })),
    };
  }

  if (part.type === "reading") {
    return {
      questions: (part.questions || []).map((q, index) => ({
        id: index,
        q: q.q,
        a: q.answer || q.a,
      })),
    };
  }

  return {
    prompt: part.instruction || part.title,
    taskPoints: part.taskPoints || part.points,
  };
}

/**
 * @param {Record<string, unknown>[]} sectionParts
 */
export function buildSectionContentFromUiParts(sectionParts) {
  if (sectionParts.length === 1) {
    return buildSectionContentFromUiPart(sectionParts[0]);
  }

  const first = sectionParts[0];
  if (first.type === "reading_cloze") {
    return {
      type: "reading_cloze",
      answers: first.answers || {},
    };
  }

  return buildSectionContentFromUiPart(first);
}

export function partTypeToSkill(type = "") {
  const map = {
    writing: "writing",
    reading: "reading",
    reading_cloze: "reading",
    reading_ads: "reading",
    listening: "listening",
    self_intro: "self_introduction",
    image: "picture_description",
    planning: "planning",
    roleplay: "planning",
  };
  return map[type] || "writing";
}
