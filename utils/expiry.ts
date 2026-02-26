export type ExpiryStatus = 'expired' | 'soon' | 'good' | 'none';

/**
 * Returns the number of days until expiration (negative if already expired).
 * Returns null if no expiration date provided.
 */
export function daysUntilExpiry(expirationDate: string | null): number | null {
  if (!expirationDate) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expirationDate + 'T00:00:00');
  return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Returns a status based on how close the item is to expiring.
 * - 'expired': past expiration or today
 * - 'soon': 1–5 days remaining
 * - 'good': more than 5 days remaining
 * - 'none': no expiration date
 */
export function getExpiryStatus(expirationDate: string | null): ExpiryStatus {
  const days = daysUntilExpiry(expirationDate);
  if (days === null) return 'none';
  if (days <= 0) return 'expired';
  if (days <= 5) return 'soon';
  return 'good';
}

/**
 * Returns a human-readable expiry label in natural language.
 * Examples: "today", "in 5 days", "in 2 weeks", "3 months ago"
 */
export function getExpiryLabel(expirationDate: string | null): string | null {
  const days = daysUntilExpiry(expirationDate);
  if (days === null) return null;

  const absDays = Math.abs(days);
  const label = formatDayCount(absDays);

  if (days === 0) return 'today';
  return days > 0 ? `in ${label}` : `${label} ago`;
}

function formatDayCount(days: number): string {
  if (days === 1) return '1 day';
  if (days < 14) return `${days} days`;
  const weeks = Math.floor(days / 7);
  if (weeks < 9) return weeks === 1 ? '1 week' : `${weeks} weeks`;
  const months = Math.round(days / 30.44);
  if (months < 12) return months === 1 ? '1 month' : `${months} months`;
  const years = Math.round(days / 365.25);
  return years === 1 ? '1 year' : `${years} years`;
}
