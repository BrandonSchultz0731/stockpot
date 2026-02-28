import { PantryStatus } from './enums';

export interface PantryStatusCounts {
  none: number;
  low: number;
  enough: number;
}

export function countByPantryStatus(
  items: { pantryStatus?: PantryStatus }[],
): PantryStatusCounts {
  return items.reduce(
    (acc, i) => {
      if (!i.pantryStatus || i.pantryStatus === PantryStatus.None) acc.none++;
      else if (i.pantryStatus === PantryStatus.Low) acc.low++;
      else acc.enough++;
      return acc;
    },
    { none: 0, low: 0, enough: 0 },
  );
}
