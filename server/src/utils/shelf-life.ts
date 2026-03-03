import { StorageLocation, ShelfLife } from '@shared/enums';

/**
 * Parse a raw AI response object into a validated ShelfLife,
 * extracting only valid StorageLocation keys with positive numeric values.
 */
export function parseShelfLife(raw: unknown): ShelfLife | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  const obj = raw as Record<string, unknown>;
  const shelfLife: ShelfLife = {};

  for (const loc of Object.values(StorageLocation)) {
    const val = Number(obj[loc]);
    if (Number.isFinite(val) && val > 0) {
      shelfLife[loc] = Math.round(val);
    }
  }

  return Object.keys(shelfLife).length > 0 ? shelfLife : undefined;
}
