export const getDaysColor = (days: number | null) => {
  if (days === null)
    return { color: "text-gray-500", bgColor: "bg-gray-500/10" };
  if (days < 7) return { color: "text-danger", bgColor: "bg-danger/10" };
  if (days < 30) return { color: "text-warning", bgColor: "bg-warning/10" };
  return { color: "text-success", bgColor: "bg-success/10" };
};
