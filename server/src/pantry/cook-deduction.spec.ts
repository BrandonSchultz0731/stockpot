import { computeCookDeductions } from './cook-deduction';
import type { RecipeIngredient } from '@shared/enums';

function makeIngredient(overrides: Partial<RecipeIngredient> & { name: string; foodCacheId: string }): RecipeIngredient {
  return {
    quantity: 1,
    unit: 'count',
    baseQuantity: 0,
    baseUnit: 'count',
    ...overrides,
  };
}

describe('computeCookDeductions', () => {
  it('should directly deduct when same unit and same foodCacheId', () => {
    const ingredients = [makeIngredient({ name: 'Chicken Breast', quantity: 1, unit: 'lb', baseQuantity: 453.592, baseUnit: 'g', foodCacheId: 'fc-1' })];
    const pantry = [{ id: 'pi-1', displayName: 'Chicken Breast', quantity: 2, unit: 'lb', foodCacheId: 'fc-1' }];

    const result = computeCookDeductions(ingredients, pantry);

    expect(result).toHaveLength(1);
    expect(result[0].pantryItemId).toBe('pi-1');
    expect(result[0].deductQuantity).toBe(1);
    expect(result[0].deductUnit).toBe('lb');
    expect(result[0].needsAiConversion).toBe(false);
    expect(result[0].notes).toBe('');
  });

  it('should convert same-category different units (oz → lb)', () => {
    const ingredients = [makeIngredient({ name: 'Butter', quantity: 8, unit: 'oz', baseQuantity: 226.796, baseUnit: 'g', foodCacheId: 'fc-2' })];
    const pantry = [{ id: 'pi-2', displayName: 'Butter', quantity: 2, unit: 'lb', foodCacheId: 'fc-2' }];

    const result = computeCookDeductions(ingredients, pantry);

    expect(result).toHaveLength(1);
    expect(result[0].pantryItemId).toBe('pi-2');
    expect(result[0].deductQuantity).toBe(0.5);
    expect(result[0].deductUnit).toBe('lb');
    expect(result[0].needsAiConversion).toBe(false);
    expect(result[0].notes).toContain('Converted');
  });

  it('should return pantryItemId null when no pantry match', () => {
    const ingredients = [makeIngredient({ name: 'Saffron', quantity: 1, unit: 'tsp', baseQuantity: 4.929, baseUnit: 'ml', foodCacheId: 'fc-99' })];
    const pantry = [{ id: 'pi-1', displayName: 'Chicken', quantity: 2, unit: 'lb', foodCacheId: 'fc-1' }];

    const result = computeCookDeductions(ingredients, pantry);

    expect(result).toHaveLength(1);
    expect(result[0].pantryItemId).toBeNull();
    expect(result[0].deductQuantity).toBe(0);
    expect(result[0].needsAiConversion).toBe(false);
    expect(result[0].notes).toBe('Not in pantry');
  });

  it('should flag incompatible count units (clove vs head) as needsAiConversion', () => {
    const ingredients = [makeIngredient({ name: 'Garlic', quantity: 3, unit: 'clove', baseQuantity: 3, baseUnit: 'count', foodCacheId: 'fc-3' })];
    const pantry = [{ id: 'pi-3', displayName: 'Garlic', quantity: 1, unit: 'head', foodCacheId: 'fc-3' }];

    const result = computeCookDeductions(ingredients, pantry);

    expect(result).toHaveLength(1);
    expect(result[0].pantryItemId).toBe('pi-3');
    expect(result[0].deductQuantity).toBe(0);
    expect(result[0].needsAiConversion).toBe(true);
    expect(result[0].recipeQuantity).toBe(3);
    expect(result[0].recipeUnit).toBe('clove');
  });

  it('should flag cross-category (cup vs lb) as needsAiConversion', () => {
    const ingredients = [makeIngredient({ name: 'Flour', quantity: 2, unit: 'cup', baseQuantity: 473.176, baseUnit: 'ml', foodCacheId: 'fc-4' })];
    const pantry = [{ id: 'pi-4', displayName: 'Flour', quantity: 5, unit: 'lb', foodCacheId: 'fc-4' }];

    const result = computeCookDeductions(ingredients, pantry);

    expect(result).toHaveLength(1);
    expect(result[0].pantryItemId).toBe('pi-4');
    expect(result[0].deductQuantity).toBe(0);
    expect(result[0].needsAiConversion).toBe(true);
    expect(result[0].recipeQuantity).toBe(2);
    expect(result[0].recipeUnit).toBe('cup');
  });

  it('should cap deduction at current pantry quantity', () => {
    const ingredients = [makeIngredient({ name: 'Eggs', quantity: 6, unit: 'count', baseQuantity: 6, baseUnit: 'count', foodCacheId: 'fc-5' })];
    const pantry = [{ id: 'pi-5', displayName: 'Eggs', quantity: 3, unit: 'count', foodCacheId: 'fc-5' }];

    const result = computeCookDeductions(ingredients, pantry);

    expect(result).toHaveLength(1);
    expect(result[0].deductQuantity).toBe(3); // capped at available
    expect(result[0].needsAiConversion).toBe(false);
  });

  it('should pick best pantry item when multiple exist', () => {
    const ingredients = [makeIngredient({ name: 'Olive Oil', quantity: 2, unit: 'tbsp', baseQuantity: 29.574, baseUnit: 'ml', foodCacheId: 'fc-6' })];
    const pantry = [
      { id: 'pi-6a', displayName: 'Olive Oil', quantity: 1, unit: 'bottle', foodCacheId: 'fc-6' },
      { id: 'pi-6b', displayName: 'Olive Oil', quantity: 500, unit: 'ml', foodCacheId: 'fc-6' },
    ];

    const result = computeCookDeductions(ingredients, pantry);

    expect(result).toHaveLength(1);
    // Should pick pi-6b (same volume category as tbsp)
    expect(result[0].pantryItemId).toBe('pi-6b');
    expect(result[0].needsAiConversion).toBe(false);
    expect(result[0].notes).toContain('Converted');
  });

  it('should return empty results for empty inputs', () => {
    expect(computeCookDeductions([], [])).toEqual([]);
    expect(computeCookDeductions([], [{ id: 'pi-1', displayName: 'X', quantity: 1, unit: 'count', foodCacheId: 'fc-1' }])).toEqual([]);
  });

  it('should handle multiple ingredients with mixed scenarios', () => {
    const ingredients = [
      makeIngredient({ name: 'Chicken', quantity: 1, unit: 'lb', baseQuantity: 453.592, baseUnit: 'g', foodCacheId: 'fc-1' }),
      makeIngredient({ name: 'Garlic', quantity: 3, unit: 'clove', baseQuantity: 3, baseUnit: 'count', foodCacheId: 'fc-3' }),
      makeIngredient({ name: 'Cilantro', quantity: 1, unit: 'bunch', baseQuantity: 1, baseUnit: 'count', foodCacheId: 'fc-missing' }),
    ];
    const pantry = [
      { id: 'pi-1', displayName: 'Chicken Breast', quantity: 2, unit: 'lb', foodCacheId: 'fc-1' },
      { id: 'pi-3', displayName: 'Garlic', quantity: 1, unit: 'head', foodCacheId: 'fc-3' },
    ];

    const result = computeCookDeductions(ingredients, pantry);

    expect(result).toHaveLength(3);
    // Chicken: direct match
    expect(result[0].pantryItemId).toBe('pi-1');
    expect(result[0].needsAiConversion).toBe(false);
    // Garlic: incompatible count units
    expect(result[1].pantryItemId).toBe('pi-3');
    expect(result[1].needsAiConversion).toBe(true);
    // Cilantro: not in pantry
    expect(result[2].pantryItemId).toBeNull();
    expect(result[2].needsAiConversion).toBe(false);
  });

  it('should handle unit alias normalization (e.g. "pounds" → "lb")', () => {
    const ingredients = [makeIngredient({ name: 'Beef', quantity: 2, unit: 'pounds', baseQuantity: 907.184, baseUnit: 'g', foodCacheId: 'fc-7' })];
    const pantry = [{ id: 'pi-7', displayName: 'Beef', quantity: 3, unit: 'lb', foodCacheId: 'fc-7' }];

    const result = computeCookDeductions(ingredients, pantry);

    expect(result).toHaveLength(1);
    expect(result[0].pantryItemId).toBe('pi-7');
    expect(result[0].deductQuantity).toBe(2);
    expect(result[0].needsAiConversion).toBe(false);
  });
});
