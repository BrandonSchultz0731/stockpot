/**
 * Converts JS Date.getDay() (0=Sun..6=Sat) to the backend DayOfWeek enum (0=Mon..6=Sun).
 */
export function getTodayDayOfWeek(): number {
  const jsDay = new Date().getDay();
  return (jsDay + 6) % 7;
}

/**
 * Returns the Monday-based week start date for today as "YYYY-MM-DD".
 * E.g. if today is Thursday 2026-02-26, returns "2026-02-23" (Monday).
 */
export function getCurrentWeekStartDate(): string {
  const now = new Date();
  const daysSinceMonday = getTodayDayOfWeek();
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysSinceMonday);
  const y = monday.getFullYear();
  const m = String(monday.getMonth() + 1).padStart(2, '0');
  const d = String(monday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
