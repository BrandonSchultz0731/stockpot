import { PantryStatus, RecipeIngredient } from '@shared/enums';
import { convertToBase } from './unit-conversion';

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

    // Resolve the needed base quantity — prefer AI-normalized values,
    // fall back to static conversion of the ingredient's own quantity/unit
    let neededQty = ing.baseQuantity;
    let neededUnit = ing.baseUnit;
    if (!neededQty || !neededUnit) {
      const fallback = convertToBase(ing.quantity, ing.unit);
      if (fallback) {
        neededQty = fallback.quantity;
        neededUnit = fallback.baseUnit;
      }
    }

    if (!neededQty || !neededUnit) {
      return { ...ing, pantryStatus: PantryStatus.Enough };
    }

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
