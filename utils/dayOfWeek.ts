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
 * Returns the first occurrence of `startDayOfWeek` on or after today whose 7-day range
 * [start, start+6] does not overlap with any existing plan's 7-day range.
 * Bumps forward by 7 days until a non-overlapping slot is found.
 */
export function getNextAvailableWeekStart(
  startDayOfWeek: number,
  existingPlanWeekStarts: string[],
): string {
  const now = new Date();
  const todayDow = now.getDay();
  const daysUntil = (startDayOfWeek - todayDow + 7) % 7;
  const candidate = new Date(now);
  candidate.setDate(now.getDate() + daysUntil);

  const MS_PER_DAY = 24 * 60 * 60 * 1000;
  const existingRanges = existingPlanWeekStarts.map((d) => {
    const start = new Date(d + 'T00:00:00').getTime();
    return { start, end: start + 6 * MS_PER_DAY };
  });

  for (let i = 0; i < 52; i++) {
    const cStart = new Date(
      candidate.getFullYear(),
      candidate.getMonth(),
      candidate.getDate(),
    ).getTime();
    const cEnd = cStart + 6 * MS_PER_DAY;

    const hasOverlap = existingRanges.some(
      (r) => cStart <= r.end && r.start <= cEnd,
    );

    if (!hasOverlap) {
      const y = candidate.getFullYear();
      const m = String(candidate.getMonth() + 1).padStart(2, '0');
      const d = String(candidate.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }

    candidate.setDate(candidate.getDate() + 7);
  }

  // Fallback — should never happen
  return getWeekStartDateForDay(startDayOfWeek);
}

/**
 * Returns an array of 7 day-of-week indices starting from `startDayOfWeek`, each mod 7.
 * E.g. orderedDaysFrom(3) → [3, 4, 5, 6, 0, 1, 2]  (Wed → Tue)
 */
export function orderedDaysFrom(startDayOfWeek: number): number[] {
  return Array.from({ length: 7 }, (_, i) => (startDayOfWeek + i) % 7);
}
