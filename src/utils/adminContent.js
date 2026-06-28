const ADMIN_KEY = "austriaPathAdminData";

export function getAdminItems() {
  try {
    const data = JSON.parse(localStorage.getItem(ADMIN_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export function getPublishedAdminItems({ type, level } = {}) {
  return getAdminItems().filter((item) => {
    const isPublished = item.status === "published";
    const matchType = type ? String(item.type).toLowerCase() === String(type).toLowerCase() : true;
    const matchLevel = level ? item.level === level : true;

    return isPublished && matchType && matchLevel;
  });
}

export function getAdminItemsByType(type, level) {
  return getPublishedAdminItems({ type, level });
}