import { PantryStatus, RecipeIngredient } from '@shared/enums';
import { convertToBase, resolveBaseQuantity, buildPantryMap } from './unit-conversion';

interface PantryEntry {
  foodCacheId: string;
  quantity: number;
  unit: string;
}

export function enrichPantryStatus(
  ingredients: RecipeIngredient[],
  pantryItems: PantryEntry[],
): RecipeIngredient[] {
  const pantryMap = buildPantryMap(pantryItems);

  return ingredients.map((ing) => {
    if (!pantryMap.has(ing.foodCacheId)) {
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
