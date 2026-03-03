import { RecipeIngredient } from '@shared/enums';
import {
  normalizeUnit,
  COUNT_UNITS,
  resolveBaseQuantity,
  convertFromBase,
} from './unit-conversion';

interface PantryItem {
  id: string;
  displayName: string;
  quantity: number;
  unit: string;
  foodCacheId: string;
}

export interface CookDeductionResult {
  recipeIngredientName: string;
  pantryItemId: string | null;
  pantryItemName: string;
  currentQuantity: number;
  currentUnit: string;
  deductQuantity: number;
  deductUnit: string;
  notes: string;
  needsAiConversion: boolean;
  /** Original recipe quantity — populated for AI items so the conversion prompt can reference it */
  recipeQuantity?: number;
  /** Original recipe unit — populated for AI items */
  recipeUnit?: string;
}

/**
 * Deterministically compute pantry deductions for a cooked recipe.
 *
 * For each recipe ingredient:
 * 1. Match pantry item by foodCacheId
 * 2. Same unit → direct deduction
 * 3. Same unit category → convert via base quantities
 * 4. Incompatible units → flag for AI conversion
 */
export function computeCookDeductions(
  ingredients: RecipeIngredient[],
  pantryItems: PantryItem[],
): CookDeductionResult[] {
  // Group pantry items by foodCacheId
  const pantryByFood = new Map<string, PantryItem[]>();
  for (const item of pantryItems) {
    const existing = pantryByFood.get(item.foodCacheId) ?? [];
    existing.push(item);
    pantryByFood.set(item.foodCacheId, existing);
  }

  return ingredients.map((ing) => {
    const candidates = pantryByFood.get(ing.foodCacheId);

    // No pantry match
    if (!candidates?.length) {
      return {
        recipeIngredientName: ing.name,
        pantryItemId: null,
        pantryItemName: ing.name,
        currentQuantity: 0,
        currentUnit: ing.unit,
        deductQuantity: 0,
        deductUnit: ing.unit,
        notes: 'Not in pantry',
        needsAiConversion: false,
      };
    }

    // Pick best pantry item: prefer exact unit match, then same category, then highest quantity
    const best = pickBestPantryItem(ing, candidates);
    const normRecipe = normalizeUnit(ing.unit);
    const normPantry = normalizeUnit(best.unit);

    // Same unit → direct deduction
    if (normRecipe === normPantry) {
      const deduct = Math.min(ing.quantity, best.quantity);
      return {
        recipeIngredientName: ing.name,
        pantryItemId: best.id,
        pantryItemName: best.displayName,
        currentQuantity: best.quantity,
        currentUnit: best.unit,
        deductQuantity: round(deduct),
        deductUnit: best.unit,
        notes: '',
        needsAiConversion: false,
      };
    }

    // Different count unit types (e.g. clove vs head) — need AI
    const recipeIsCount = COUNT_UNITS.has(normRecipe);
    const pantryIsCount = COUNT_UNITS.has(normPantry);
    if (recipeIsCount && pantryIsCount && normRecipe !== normPantry) {
      return {
        recipeIngredientName: ing.name,
        pantryItemId: best.id,
        pantryItemName: best.displayName,
        currentQuantity: best.quantity,
        currentUnit: best.unit,
        deductQuantity: 0,
        deductUnit: best.unit,
        notes: `Cannot convert ${ing.unit} to ${best.unit}`,
        needsAiConversion: true,
        recipeQuantity: ing.quantity,
        recipeUnit: ing.unit,
      };
    }

    // Same unit category → convert via base quantities
    const ingBase = resolveBaseQuantity(ing);
    const pantryBase = resolveBaseQuantity({ quantity: best.quantity, unit: best.unit });

    if (ingBase && pantryBase && ingBase.baseUnit === pantryBase.baseUnit) {
      // Both are in the same category — convert recipe qty to pantry unit
      const recipeInPantryUnit = convertFromBase(ingBase.quantity, ingBase.baseUnit, best.unit);
      if (recipeInPantryUnit != null) {
        const deduct = Math.min(round(recipeInPantryUnit), best.quantity);
        return {
          recipeIngredientName: ing.name,
          pantryItemId: best.id,
          pantryItemName: best.displayName,
          currentQuantity: best.quantity,
          currentUnit: best.unit,
          deductQuantity: round(deduct),
          deductUnit: best.unit,
          notes: `Converted ${ing.quantity} ${ing.unit} → ${round(recipeInPantryUnit)} ${best.unit}`,
          needsAiConversion: false,
        };
      }
    }

    // Cross-category (e.g. volume vs weight) — need AI
    return {
      recipeIngredientName: ing.name,
      pantryItemId: best.id,
      pantryItemName: best.displayName,
      currentQuantity: best.quantity,
      currentUnit: best.unit,
      deductQuantity: 0,
      deductUnit: best.unit,
      notes: `Cannot convert ${ing.unit} to ${best.unit}`,
      needsAiConversion: true,
      recipeQuantity: ing.quantity,
      recipeUnit: ing.unit,
    };
  });
}

function pickBestPantryItem(
  ing: RecipeIngredient,
  candidates: PantryItem[],
): PantryItem {
  const normRecipe = normalizeUnit(ing.unit);

  // Prefer exact unit match
  const exactMatch = candidates.find(
    (c) => normalizeUnit(c.unit) === normRecipe,
  );
  if (exactMatch) return exactMatch;

  // Prefer same unit category
  const ingBase = resolveBaseQuantity(ing);
  if (ingBase) {
    const sameCat = candidates.find((c) => {
      const cBase = resolveBaseQuantity({ quantity: c.quantity, unit: c.unit });
      return cBase && cBase.baseUnit === ingBase.baseUnit;
    });
    if (sameCat) return sameCat;
  }

  // Fallback: highest quantity
  return candidates.reduce((best, c) => (c.quantity > best.quantity ? c : best));
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
