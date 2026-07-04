import { Brain } from "./core/brain.js";
import { ExamModes } from "./modes/examModes.js";

const brain = new Brain();

export async function runExaminerMind({
  answerText = "",
  taskAnswered = true,
  level = "B1",
  examType = "OEIF",
  sectionIndex = 0,
  currentSection = null,
  mode = ExamModes.AI_EXAM,
  saveToProfile = true,
}) {
  return brain.think(
    {
      answerText,
      taskAnswered,
      level,
      examType,
      sectionIndex,
      currentSection,
      saveToProfile,
    },
    mode
  );
}