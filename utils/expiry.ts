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
 * Returns a human-readable expiry label.
 * Examples: "Expired", "Today", "2d left", "1w left"
 */
export function getExpiryLabel(expirationDate: string | null): string | null {
  const days = daysUntilExpiry(expirationDate);
  if (days === null) return null;
  if (days < 0) return 'Expired';
  if (days === 0) return 'Today';
  if (days === 1) return '1d left';
  if (days <= 7) return `${days}d left`;
  const weeks = Math.floor(days / 7);
  if (weeks <= 4) return `${weeks}w left`;
  const months = Math.floor(days / 30);
  return `${months}mo left`;
}
