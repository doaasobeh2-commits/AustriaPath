export const examBank = {
  writing: [],
  images: [],
  planning: [],
};

export function getStatus(item) {
  const today = new Date();
  const lastDate = item.lastConfirmed ? new Date(item.lastConfirmed) : null;

  if (!lastDate) return "new";

  const diffDays = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));

  if (item.confirmations >= 5 && diffDays <= 180) {
    return "hot";
  }

  if (diffDays > 365) {
    return "archived";
  }

  if (diffDays > 180) {
    return "old";
  }

  return "active";
}

export function sortByImportance(items) {
  return [...items]
    .map((item) => ({
      ...item,
      status: getStatus(item),
    }))
    .sort((a, b) => {
      if (a.status === "archived" && b.status !== "archived") return 1;
      if (a.status !== "archived" && b.status === "archived") return -1;

      return (b.confirmations || 0) - (a.confirmations || 0);
    });
}