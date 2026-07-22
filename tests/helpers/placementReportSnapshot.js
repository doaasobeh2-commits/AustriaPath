export function placementReportSnapshot(overrides = {}) {
  return {
    level: "B1",
    date: "2026-07-22T12:00:00.000Z",
    skillBands: {
      selbstvorstellung: "strong",
      bildbeschreibung: "medium",
      lesenHoeren: "strong",
      planung: "medium",
    },
    learnerReport: {
      levelExplanation: "Sie zeigen insgesamt sichere Kenntnisse auf dem Niveau B1.",
      areas: [
        { skill: "selbstvorstellung", label: "Selbstvorstellung", performanceLabel: "stark", summary: "Klare persönliche Angaben.", missingTopics: [] },
        { skill: "bildbeschreibung", label: "Bildbeschreibung", performanceLabel: "solide", summary: "Das Bild wurde verständlich beschrieben.", missingTopics: ["Begründung"] },
        { skill: "lesenHoeren", label: "Hören", performanceLabel: "stark", summary: "Die Hörfragen wurden sicher verstanden.", missingTopics: [] },
        { skill: "planung", label: "Planung", performanceLabel: "solide", summary: "Die Planung war nachvollziehbar.", missingTopics: ["Alternative"] },
      ],
      strengths: [{ skill: "selbstvorstellung", text: "Persönliche Informationen klar ausdrücken." }],
      improvements: [{ skill: "planung", text: "Alternativen genauer vergleichen." }],
      recommendations: ["Begründungen und Alternativen regelmäßig üben."],
      transcripts: [{ skill: "planung", label: "Planung", question: "Was ist unser Plan?", transcript: "Wir treffen uns am Samstag." }],
      studyPlan: [{ day: "Tag 1", skill: "planung", focus: "Alternativen", task: "Zwei Lösungen vergleichen." }],
    },
    ...overrides,
  };
}
