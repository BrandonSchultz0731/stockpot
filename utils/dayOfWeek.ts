/**
 * Returns today's day-of-week using JS-native convention (0=Sunday … 6=Saturday).
 */
export function getTodayDayOfWeek(): number {
  return new Date().getDay();
}

/**
 * Returns the most recent Sunday (or today if Sunday) as "YYYY-MM-DD".
 */
export function getCurrentWeekStartDate(): string {
  const now = new Date();
  const daysSinceSunday = now.getDay();
  const sunday = new Date(now);
  sunday.setDate(now.getDate() - daysSinceSunday);
  const y = sunday.getFullYear();
  const m = String(sunday.getMonth() + 1).padStart(2, '0');
  const d = String(sunday.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the next occurrence of `startDayOfWeek` on or after today as "YYYY-MM-DD".
 * Uses JS-native convention (0=Sunday … 6=Saturday).
 */
export function getWeekStartDateForDay(startDayOfWeek: number): string {
  const now = new Date();
  const todayDow = now.getDay();
  const daysUntil = (startDayOfWeek - todayDow + 7) % 7;
  const target = new Date(now);
  target.setDate(now.getDate() + daysUntil);
  const y = target.getFullYear();
  const m = String(target.getMonth() + 1).padStart(2, '0');
  const d = String(target.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns an array of 7 day-of-week indices starting from `startDayOfWeek`, each mod 7.
 * E.g. orderedDaysFrom(3) → [3, 4, 5, 6, 0, 1, 2]  (Wed → Tue)
 */
export function orderedDaysFrom(startDayOfWeek: number): number[] {
  return Array.from({ length: 7 }, (_, i) => (startDayOfWeek + i) % 7);
}
