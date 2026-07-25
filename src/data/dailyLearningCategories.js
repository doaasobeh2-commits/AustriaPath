/** Category groups for daily card rotation (3 per day, diverse). */

export const DAILY_SLOT_GROUPS = {
  communication: new Set(["Schreiben", "Connector", "Vocabulary"]),
  scene: new Set(["Bildbeschreibung", "Grafikbeschreibung"]),
  dialogue: new Set(["Planung"]),
  mixed: new Set(["Meinung", "Diskussion", "Grammar"]),
};

export const DAILY_SLOT_ORDER = ["communication", "scene", "mixed"];

export function getDailySlotGroup(category) {
  for (const [group, categories] of Object.entries(DAILY_SLOT_GROUPS)) {
    if (categories.has(category)) return group;
  }
  if (category === "Planung") return "dialogue";
  return "mixed";
}
