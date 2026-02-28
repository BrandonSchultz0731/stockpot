import { PantryStatus, RecipeIngredient } from '@shared/enums';
import { convertToBase, resolveBaseQuantity } from './unit-conversion';

interface PantryEntry {
  foodCacheId: string;
  quantity: number;
  unit: string;
}

export function enrichPantryStatus(
  ingredients: RecipeIngredient[],
  pantryItems: PantryEntry[],
): RecipeIngredient[] {
  const pantryMap = new Map<string, { quantity: number; unit: string }[]>();
  for (const item of pantryItems) {
    const existing = pantryMap.get(item.foodCacheId) ?? [];
    existing.push({ quantity: Number(item.quantity), unit: item.unit });
    pantryMap.set(item.foodCacheId, existing);
  }

  return ingredients.map((ing) => {
    if (!ing.foodCacheId || !pantryMap.has(ing.foodCacheId)) {
      return { ...ing, pantryStatus: PantryStatus.None };
    }

    const resolved = resolveBaseQuantity(ing);
    if (!resolved) {
      return { ...ing, pantryStatus: PantryStatus.Enough };
    }
    const { quantity: neededQty, baseUnit: neededUnit } = resolved;

    const pantryEntries = pantryMap.get(ing.foodCacheId)!;
    let available = 0;
    let anyConverted = false;

    for (const entry of pantryEntries) {
      const converted = convertToBase(entry.quantity, entry.unit);
      if (converted && converted.baseUnit === neededUnit) {
        available += converted.quantity;
        anyConverted = true;
      }
    }

    if (!anyConverted) {
      return { ...ing, pantryStatus: PantryStatus.Enough };
    }

    const status =
      available >= neededQty ? PantryStatus.Enough : PantryStatus.Low;
    return { ...ing, pantryStatus: status };
  });
}
