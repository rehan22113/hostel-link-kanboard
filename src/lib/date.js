// Returns true if the deadline (ISO date string) is before today.
export function isOverdue(deadline) {
  if (!deadline) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) return false;
  return due < today;
}

// Short human label like "Jul 30".
export function formatDeadline(deadline) {
  if (!deadline) return null;
  const due = new Date(deadline);
  if (Number.isNaN(due.getTime())) return null;
  return due.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
