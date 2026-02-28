import { UnitOfMeasure, StorageLocation, FOOD_CATEGORIES, MealScheduleSlot } from '@shared/enums';

export function buildRecipeGenerationPrompt(
  ingredientList: string,
  numberOfRecipes: number,
  filterBlock: string,
): string {
  return `You are a creative chef. Based on the following pantry ingredients, suggest ${numberOfRecipes} recipes that can be made primarily with these items. It's okay to include a few common ingredients not in the pantry.

Pantry ingredients:
${ingredientList}
${filterBlock}
Return ONLY a JSON array of ${numberOfRecipes} recipe objects with these fields:
- "title": string (recipe name)
- "description": string (1-2 sentence description)
- "prepTimeMinutes": number
- "cookTimeMinutes": number
- "totalTimeMinutes": number
- "servings": number
- "difficulty": "Easy" | "Medium" | "Hard"
- "cuisine": string
- "mealType": "Breakfast" | "Lunch" | "Dinner" | "Snack"
- "ingredients": array of { "name": string, "quantity": number, "unit": string, "notes": string (optional) }
- "steps": array of { "stepNumber": number, "instruction": string, "duration": number (optional, in minutes) }
- "tags": array of strings
- "dietaryFlags": array of strings
- "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number } (estimated per serving)

No markdown fences, no explanation — only the JSON array.`;
}

export function buildMealPlanPrompt(
  ingredientList: string,
  mealSchedule: MealScheduleSlot[],
  servings: number,
  constraintBlock: string,
): string {
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // Build day-by-day schedule block
  const scheduleByDay = new Map<number, string[]>();
  for (const slot of mealSchedule) {
    const existing = scheduleByDay.get(slot.dayOfWeek) ?? [];
    existing.push(slot.mealType);
    scheduleByDay.set(slot.dayOfWeek, existing);
  }

  const scheduleLines = Array.from(scheduleByDay.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, types]) => `- ${dayNames[day]}: ${types.join(', ')}`)
    .join('\n');

  const totalMeals = mealSchedule.length;
  const uniqueMealTypes = [...new Set(mealSchedule.map((s) => s.mealType))];

  return `You are a meal planning chef. Create a meal plan with ${totalMeals} meals featuring delicious, varied, well-balanced meals. The user has the following ingredients on hand — use them when it makes sense, but do not limit recipes to only pantry items. Suggest the best meals regardless of what is available.

Pantry ingredients:
${ingredientList || 'No pantry items available — suggest common recipes.'}

Meal schedule (generate EXACTLY these meals, no more, no less):
${scheduleLines}

IMPORTANT: Generate exactly ${totalMeals} meals matching the schedule above. Do not add meals for days or types not listed.

Servings per meal: ${servings}
${constraintBlock}
Return ONLY a JSON object with a "meals" array where each item has:
- "dayOfWeek": number (0=Monday, 1=Tuesday, ..., 6=Sunday)
- "mealType": "${uniqueMealTypes.join('" | "')}"
- "title": string (recipe name)
- "description": string (1-2 sentence description)
- "prepTimeMinutes": number
- "cookTimeMinutes": number
- "totalTimeMinutes": number
- "servings": number
- "difficulty": "Easy" | "Medium" | "Hard"
- "cuisine": string
- "ingredients": array of { "name": string, "quantity": number, "unit": string, "notes": string (optional) }
- "steps": array of { "stepNumber": number, "instruction": string, "duration": number (optional, in minutes) }
- "tags": array of strings
- "dietaryFlags": array of strings
- "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number } (estimated per serving)

No markdown fences, no explanation — only the JSON object.`;
}

export function buildMealSwapPrompt(
  ingredientList: string,
  dayName: string,
  mealType: string,
  currentTitle: string,
  constraintBlock: string,
): string {
  return `You are a meal planning chef. Suggest a single replacement recipe for ${dayName} ${mealType}. The user has the following ingredients on hand — use them when possible, but prioritize a great meal over strict pantry usage.

The current meal is: "${currentTitle}" — please suggest something different.

Pantry ingredients:
${ingredientList || 'No pantry items available — suggest a common recipe.'}
${constraintBlock}
Return ONLY a JSON object with:
- "title": string (recipe name)
- "description": string (1-2 sentence description)
- "prepTimeMinutes": number
- "cookTimeMinutes": number
- "totalTimeMinutes": number
- "servings": number
- "difficulty": "Easy" | "Medium" | "Hard"
- "cuisine": string
- "ingredients": array of { "name": string, "quantity": number, "unit": string, "notes": string (optional) }
- "steps": array of { "stepNumber": number, "instruction": string, "duration": number (optional, in minutes) }
- "tags": array of strings
- "dietaryFlags": array of strings
- "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number } (estimated per serving)

No markdown fences, no explanation — only the JSON object.`;
}

export function buildShelfLifePrompt(displayName: string): string {
  const storageKeys = Object.values(StorageLocation).join(', ');
  const categories = FOOD_CATEGORIES.join(', ');
  return `How many days does "${displayName}" typically last when stored properly? Return ONLY a JSON object with numeric values for applicable storage methods and a category: { "${StorageLocation.Fridge}": days, "${StorageLocation.Freezer}": days, "${StorageLocation.Pantry}": days, "category": "<category>" }. Valid storage keys: ${storageKeys}. Omit a storage key if that method is not applicable. "category" must be one of: ${categories}. No explanation.`;
}

export function buildCategoryPrompt(displayName: string): string {
  const categories = FOOD_CATEGORIES.join(', ');
  return `What food category does "${displayName}" belong to? Reply with ONLY one of these categories: ${categories}. No explanation, no punctuation — just the category name.`;
}

export function buildBatchCategoryPrompt(
  ingredientNames: string[],
): string {
  const categories = FOOD_CATEGORIES.join(', ');
  const list = ingredientNames.map((n) => `- "${n}"`).join('\n');
  return `Categorize each food item below into one of these categories: ${categories}.

Food items:
${list}

Return ONLY a JSON object mapping each food item name to its category. Example: { "Cinnamon": "Spices & Herbs", "Chicken Breast": "Meat & Poultry" }

No markdown fences, no explanation — only the JSON object.`;
}

export function buildIngredientResolutionPrompt(
  unresolvedNames: string[],
  candidateList: { id: string; name: string }[],
): string {
  return `For each ingredient name below, pick the best matching food item from the candidates list, or respond "NONE" if no candidate is a good match. Consider synonyms (e.g. Scallions = Green Onions, Heavy Cream = Whipping Cream, Cilantro = Coriander).

Ingredient names:
${unresolvedNames.map((n) => `- "${n}"`).join('\n')}

Candidates:
${candidateList.map((c) => `- { "id": "${c.id}", "name": "${c.name}" }`).join('\n')}

Return ONLY a JSON object mapping each ingredient name to the matched candidate id, or "NONE". Example: { "Scallions": "abc-123", "Dragon Fruit": "NONE" }

No markdown fences, no explanation — only the JSON object.`;
}

export function buildCookDeductionPrompt(
  recipeIngredients: { name: string; quantity: number; unit: string; foodCacheId?: string }[],
  pantryItems: { id: string; displayName: string; quantity: number; unit: string; foodCacheId: string }[],
): string {
  const ingredientLines = recipeIngredients
    .map((i) => `- "${i.name}" qty=${i.quantity} unit="${i.unit}" foodCacheId="${i.foodCacheId ?? 'NONE'}"`)
    .join('\n');

  const pantryLines = pantryItems
    .map((p) => `- id="${p.id}" name="${p.displayName}" qty=${p.quantity} unit="${p.unit}" foodCacheId="${p.foodCacheId}"`)
    .join('\n');

  return `You are a kitchen inventory assistant. A user just cooked a recipe. Determine how much of each recipe ingredient should be deducted from their pantry.

Recipe ingredients:
${ingredientLines}

Pantry items:
${pantryLines}

Matching rules:
1. Match by foodCacheId first (recipe ingredient foodCacheId === pantry item foodCacheId).
2. If no foodCacheId match, try matching by name similarity.
3. Convert the deduction quantity into the pantry item's unit (e.g. recipe says "3 cloves garlic" but pantry has "1 head garlic" → deduct 0.25 head).
4. If a recipe ingredient has no matching pantry item, still include it with pantryItemId: null.

Return ONLY a JSON object with a "deductions" array where each item has:
- "recipeIngredientName": string (the recipe ingredient name)
- "pantryItemId": string | null (the pantry item id, or null if not in pantry)
- "pantryItemName": string (the pantry item display name, or the recipe ingredient name if not in pantry)
- "currentQuantity": number (current pantry quantity, 0 if not in pantry)
- "currentUnit": string (pantry item unit, or recipe unit if not in pantry)
- "deductQuantity": number (amount to deduct, in pantry item's unit)
- "deductUnit": string (the unit for the deduction, same as pantry item's unit)
- "notes": string (brief explanation of conversion, if any)

No markdown fences, no explanation — only the JSON object.`;
}

export function buildReceiptScanPrompt(): string {
  return `You are a grocery receipt parser. Extract food and grocery items from the receipt image.

Return a JSON array of objects with these fields:
- "displayName": Human-readable product name. Expand common receipt abbreviations (e.g. "ORG" → "Organic", "GRN" → "Green", "BNLS" → "Boneless", "SKNLS" → "Skinless", "WHL" → "Whole", "BLK" → "Black", "WHT" → "White", "FRZ" → "Frozen", "BRST" → "Breast", "GRND" → "Ground"). Use title case.
- "quantity": Number of items (default 1 if not clear).
- "unit": One of these exact values: ${Object.values(UnitOfMeasure).join(', ')}. Use "count" if unsure.
- "estimatedShelfLife": An object with estimated shelf life in days for each storage method: { "${StorageLocation.Fridge}": number, "${StorageLocation.Freezer}": number, "${StorageLocation.Pantry}": number }. Use typical values for an unopened product. Omit a key if that storage method is not applicable (e.g. omit "${StorageLocation.Fridge}" for raw meat).
- "suggestedStorageLocation": The most common storage location for this item. One of: ${Object.values(StorageLocation).join(', ')}.

Rules:
- Only include food/grocery items. Skip taxes, discounts, subtotals, rewards, coupons, bag fees, and non-food items.
- If a line shows a quantity multiplier (e.g. "2 @ $3.99"), use that quantity.
- If the receipt is unreadable or contains no food items, return an empty array: []

Return ONLY the JSON array, no markdown fences, no explanation.`;
}
