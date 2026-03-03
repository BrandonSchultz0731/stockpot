import { UnitOfMeasure, RecipeIngredient, RecipeSource } from '@shared/enums';

interface PantryItem {
  foodCacheId: string;
  displayName: string;
  quantity: number;
  unit: string;
}

/** Shape of a raw ingredient from AI response, before resolution. */
export interface ParsedIngredient {
  name: string;
  quantity: number;
  unit: string;
  baseQuantity?: number;
  baseUnit?: string;
  notes?: string;
}

/** Shape of a parsed recipe from AI response. */
export interface ParsedRecipe {
  title: string;
  description?: string;
  prepTimeMinutes?: number;
  cookTimeMinutes?: number;
  totalTimeMinutes?: number;
  servings?: number;
  difficulty?: string;
  cuisine?: string;
  mealType?: string;
  ingredients: ParsedIngredient[];
  steps: string[];
  tags?: string[];
  dietaryFlags?: string[];
  nutrition?: Record<string, number>;
  dayOfWeek?: number;
}

/** Format pantry items as a newline-separated string for AI prompts. */
export function formatPantryForPrompt(pantryItems: PantryItem[]): string {
  return pantryItems
    .map((item) => `${item.displayName} (${item.quantity} ${item.unit})`)
    .join('\n');
}

/** Map pantry items to the shape needed by resolveIngredientNames. */
export function buildPantryFoodItems(
  pantryItems: PantryItem[],
): { foodCacheId: string; displayName: string }[] {
  return pantryItems.map((item) => ({
    foodCacheId: item.foodCacheId,
    displayName: item.displayName,
  }));
}

/** Map raw AI ingredient objects to RecipeIngredient[] with resolved foodCacheIds. */
export function mapResolvedIngredients(
  rawIngredients: ParsedIngredient[],
  resolvedMap: Map<string, string>,
): RecipeIngredient[] {
  return rawIngredients.map((ing) => ({
    name: ing.name,
    quantity: ing.quantity,
    unit: ing.unit,
    baseQuantity: ing.baseQuantity ?? 0,
    baseUnit: ing.baseUnit ?? UnitOfMeasure.Count,
    ...(ing.notes ? { notes: ing.notes } : {}),
    foodCacheId: resolvedMap.get(ing.name.toLowerCase()),
  }));
}

/** Build a plain recipe data object suitable for recipeRepo.create(). */
export function buildRecipeData(
  parsed: ParsedRecipe,
  overrides: {
    userId: string;
    source: RecipeSource;
    mealType?: string;
    servings?: number;
    sourceUrl?: string | null;
  },
): Record<string, unknown> {
  return {
    userId: overrides.userId,
    title: parsed.title,
    description: parsed.description,
    prepTimeMinutes: parsed.prepTimeMinutes,
    cookTimeMinutes: parsed.cookTimeMinutes,
    totalTimeMinutes: parsed.totalTimeMinutes,
    servings: parsed.servings ?? overrides.servings,
    difficulty: parsed.difficulty,
    cuisine: parsed.cuisine,
    mealType: overrides.mealType ?? parsed.mealType,
    source: overrides.source,
    ...('sourceUrl' in overrides ? { sourceUrl: overrides.sourceUrl } : {}),
    steps: parsed.steps ?? [],
    tags: parsed.tags,
    dietaryFlags: parsed.dietaryFlags,
    nutrition: parsed.nutrition,
  };
}
