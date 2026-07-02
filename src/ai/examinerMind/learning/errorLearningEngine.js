const STORAGE_KEY = "austriaPathAIErrorLog";

export function saveAIError(entry) {
  try {
    const oldLogs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

    const log = {
      id: Date.now(),
      createdAt: new Date().toISOString(),
      type: "ai_error_log",
      ...entry,
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([log, ...oldLogs].slice(0, 500))
    );
  } catch (error) {
    console.error("AI Error Log failed:", error);
  }
}

export function getAIErrorLog() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}