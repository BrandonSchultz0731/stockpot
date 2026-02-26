import { StorageLocation, type ShelfLife } from './enums';

/**
 * Calculate an expiration date from shelf life data and a storage location.
 * Falls back through Pantry → Fridge → Freezer if the given location has no data.
 */
export function calculateExpirationDate(
  shelfLife: ShelfLife | undefined | null,
  storageLocation?: string | null,
): Date | null {
  if (!shelfLife) return null;

  let days: number | undefined;

  if (storageLocation) {
    days = shelfLife[storageLocation as StorageLocation];
  }

  // Fallback order: Pantry → Fridge → Freezer
  if (days === undefined) days = shelfLife[StorageLocation.Pantry];
  if (days === undefined) days = shelfLife[StorageLocation.Fridge];
  if (days === undefined) days = shelfLife[StorageLocation.Freezer];

  if (days === undefined || days <= 0) return null;

  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/** Format a Date as an ISO date string (YYYY-MM-DD). */
export function formatISODate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
