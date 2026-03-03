import { formatPantryForPrompt, buildPantryFoodItems, mapResolvedIngredients, buildRecipeData, ParsedRecipe } from './recipe-builder';
import { UnitOfMeasure, RecipeSource } from '@shared/enums';

const pantryItems = [
  { foodCacheId: 'fc1', displayName: 'Chicken Breast', quantity: 2, unit: 'lb' },
  { foodCacheId: 'fc2', displayName: 'Rice', quantity: 500, unit: 'g' },
];

describe('formatPantryForPrompt', () => {
  it('formats pantry items as newline-separated string', () => {
    expect(formatPantryForPrompt(pantryItems)).toBe(
      'Chicken Breast (2 lb)\nRice (500 g)',
    );
  });

  it('returns empty string for empty array', () => {
    expect(formatPantryForPrompt([])).toBe('');
  });
});

describe('buildPantryFoodItems', () => {
  it('maps to foodCacheId + displayName pairs', () => {
    expect(buildPantryFoodItems(pantryItems)).toEqual([
      { foodCacheId: 'fc1', displayName: 'Chicken Breast' },
      { foodCacheId: 'fc2', displayName: 'Rice' },
    ]);
  });
});

describe('mapResolvedIngredients', () => {
  it('maps raw ingredients with resolved foodCacheIds', () => {
    const raw = [
      { name: 'Chicken', quantity: 1, unit: 'lb', baseQuantity: 453, baseUnit: 'g' },
      { name: 'Rice', quantity: 2, unit: 'cup', notes: 'rinsed' },
    ];
    const resolvedMap = new Map([
      ['chicken', 'fc1'],
      ['rice', 'fc2'],
    ]);

    const result = mapResolvedIngredients(raw, resolvedMap);

    expect(result).toEqual([
      {
        name: 'Chicken',
        quantity: 1,
        unit: 'lb',
        baseQuantity: 453,
        baseUnit: 'g',
        foodCacheId: 'fc1',
      },
      {
        name: 'Rice',
        quantity: 2,
        unit: 'cup',
        baseQuantity: 0,
        baseUnit: UnitOfMeasure.Count,
        notes: 'rinsed',
        foodCacheId: 'fc2',
      },
    ]);
  });

  it('omits notes when not present', () => {
    const result = mapResolvedIngredients(
      [{ name: 'Salt', quantity: 1, unit: 'tsp' }],
      new Map(),
    );
    expect(result[0]).not.toHaveProperty('notes');
  });
});

describe('buildRecipeData', () => {
  const parsed: ParsedRecipe = {
    title: 'Test Recipe',
    description: 'A test',
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    totalTimeMinutes: 30,
    servings: 4,
    difficulty: 'Easy',
    cuisine: 'Italian',
    mealType: 'Dinner',
    ingredients: [{ name: 'Salt', quantity: 1, unit: 'tsp' }],
    steps: ['step 1'],
    tags: ['quick'],
    dietaryFlags: [],
    nutrition: { calories: 200 },
  };

  it('builds recipe data with overrides', () => {
    const result = buildRecipeData(parsed, {
      userId: 'u1',
      source: RecipeSource.AI,
      mealType: 'Lunch',
      servings: 2,
    });

    expect(result.userId).toBe('u1');
    expect(result.source).toBe(RecipeSource.AI);
    expect(result.mealType).toBe('Lunch');
    expect(result.servings).toBe(4); // parsed.servings takes precedence over fallback
    expect(result.title).toBe('Test Recipe');
  });

  it('falls back to overrides.servings when parsed.servings is undefined', () => {
    const { servings: _, ...parsedNoServings } = parsed;
    const result = buildRecipeData(parsedNoServings, {
      userId: 'u1',
      source: RecipeSource.AI,
      servings: 2,
    });
    expect(result.servings).toBe(2);
  });

  it('uses parsed.mealType when override.mealType is not set', () => {
    const result = buildRecipeData(parsed, {
      userId: 'u1',
      source: RecipeSource.AI,
    });
    expect(result.mealType).toBe('Dinner');
  });

  it('includes sourceUrl when provided', () => {
    const result = buildRecipeData(parsed, {
      userId: 'u1',
      source: RecipeSource.Website,
      sourceUrl: 'https://example.com',
    });
    expect(result.sourceUrl).toBe('https://example.com');
  });

  it('omits sourceUrl when not provided', () => {
    const result = buildRecipeData(parsed, {
      userId: 'u1',
      source: RecipeSource.AI,
    });
    expect(result).not.toHaveProperty('sourceUrl');
  });
});
