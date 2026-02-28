import { PantryStatus, RecipeIngredient } from '@shared/enums';
import { enrichPantryStatus } from './enrich-pantry';

function makeIngredient(overrides: Partial<RecipeIngredient> = {}): RecipeIngredient {
  return {
    name: 'Flour',
    quantity: 2,
    unit: 'cup',
    baseQuantity: 250,
    baseUnit: 'g',
    ...overrides,
  };
}

describe('enrichPantryStatus', () => {
  it('marks ingredient as None when not in pantry at all', () => {
    const ingredients = [makeIngredient({ foodCacheId: 'flour-id' })];
    const pantryItems: any[] = [];

    const result = enrichPantryStatus(ingredients, pantryItems);
    expect(result[0].pantryStatus).toBe(PantryStatus.None);
  });

  it('marks ingredient as None when it has no foodCacheId', () => {
    const ingredients = [makeIngredient({ foodCacheId: undefined })];
    const pantryItems = [{ foodCacheId: 'flour-id', quantity: 1000, unit: 'g' }];

    const result = enrichPantryStatus(ingredients, pantryItems);
    expect(result[0].pantryStatus).toBe(PantryStatus.None);
  });

  it('marks ingredient as Enough when pantry has sufficient quantity', () => {
    const ingredients = [makeIngredient({ foodCacheId: 'flour-id', baseQuantity: 250, baseUnit: 'g' })];
    const pantryItems = [{ foodCacheId: 'flour-id', quantity: 500, unit: 'g' }];

    const result = enrichPantryStatus(ingredients, pantryItems);
    expect(result[0].pantryStatus).toBe(PantryStatus.Enough);
  });

  it('marks ingredient as Low when pantry has insufficient quantity', () => {
    const ingredients = [makeIngredient({ foodCacheId: 'flour-id', baseQuantity: 250, baseUnit: 'g' })];
    const pantryItems = [{ foodCacheId: 'flour-id', quantity: 100, unit: 'g' }];

    const result = enrichPantryStatus(ingredients, pantryItems);
    expect(result[0].pantryStatus).toBe(PantryStatus.Low);
  });

  it('sums multiple pantry entries for the same foodCacheId', () => {
    const ingredients = [makeIngredient({ foodCacheId: 'flour-id', baseQuantity: 500, baseUnit: 'g' })];
    const pantryItems = [
      { foodCacheId: 'flour-id', quantity: 200, unit: 'g' },
      { foodCacheId: 'flour-id', quantity: 400, unit: 'g' },
    ];

    const result = enrichPantryStatus(ingredients, pantryItems);
    expect(result[0].pantryStatus).toBe(PantryStatus.Enough);
  });

  it('converts pantry units before comparison (lb → g)', () => {
    const ingredients = [makeIngredient({ foodCacheId: 'flour-id', baseQuantity: 250, baseUnit: 'g' })];
    const pantryItems = [{ foodCacheId: 'flour-id', quantity: 1, unit: 'lb' }];

    const result = enrichPantryStatus(ingredients, pantryItems);
    // 1 lb = 453.592g >= 250g
    expect(result[0].pantryStatus).toBe(PantryStatus.Enough);
  });

  it('defaults to Enough when pantry unit cannot be converted to recipe baseUnit', () => {
    const ingredients = [makeIngredient({ foodCacheId: 'ketchup-id', baseQuantity: 272, baseUnit: 'g' })];
    // Pantry has "2 bottles" which converts to count, but recipe needs grams
    const pantryItems = [{ foodCacheId: 'ketchup-id', quantity: 2, unit: 'bottle' }];

    const result = enrichPantryStatus(ingredients, pantryItems);
    expect(result[0].pantryStatus).toBe(PantryStatus.Enough);
  });

  it('does not include inPantry field in output', () => {
    const ingredients = [makeIngredient({ foodCacheId: 'flour-id' })];
    const pantryItems = [{ foodCacheId: 'flour-id', quantity: 500, unit: 'g' }];

    const result = enrichPantryStatus(ingredients, pantryItems);
    expect(result[0]).not.toHaveProperty('inPantry');
  });
});
