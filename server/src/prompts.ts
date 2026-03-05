import { UnitOfMeasure, StorageLocation, FOOD_CATEGORIES, DAY_NAMES, MealScheduleSlot, CookingSkill } from '@shared/enums';

const FLAVOR_GUIDANCE = `
FLAVOR & TASTE GUIDELINES:
- Balance the five elements of flavor: salt, acid, fat, heat, and umami — every savory recipe should consider all five.
- Layer seasoning at multiple cooking stages, not just at the end. Include aromatics (garlic, onion, ginger, herbs) as a foundation.
- Choose ingredients that complement each other within the dish's cuisine tradition. Avoid clashing flavors.
- Include a finishing element — a brightness component (citrus zest, fresh herbs, vinegar, pickled elements) to lift flat dishes.
- Use cooking techniques that develop flavor: searing/browning for Maillard reaction, toasting spices, deglazing pans, caramelizing onions. Mention these in recipe steps when appropriate.
- Recipes should be restaurant-quality — bold, well-seasoned, flavorful food that people would be excited to eat.
- Order ingredients by usage: list ingredients in the order they are used in the recipe steps.
`;

export function buildSkillBlock(cookingSkill?: CookingSkill | string): string {
  switch (cookingSkill) {
    case CookingSkill.Beginner:
      return 'Cooking skill: Beginner — favor straightforward techniques (one-pot, sheet pan, stir-fry), fewer ingredients, and clear step-by-step instructions. Still season well.';
    case CookingSkill.Intermediate:
      return 'Cooking skill: Intermediate — comfortable with most techniques. Use compound flavors and moderate complexity.';
    case CookingSkill.Advanced:
      return 'Cooking skill: Advanced — embrace multi-step techniques (braising, making pan sauces, homemade spice blends, fermented ingredients). Maximize flavor depth.';
    default:
      return '';
  }
}

const INGREDIENT_NAMING_INSTRUCTION = `
IMPORTANT: Use simple, consistent ingredient names. Use the base food name without unnecessary qualifiers:
- "Onion" not "Fresh Onion" or "Yellow Onion" (unless the variety matters for the recipe)
- "Garlic" not "Garlic Cloves" or "Fresh Garlic"
- "Chicken Breast" not "Boneless Skinless Chicken Breast"
- "Olive Oil" not "Extra Virgin Olive Oil" (unless it matters)
When the same ingredient appears in multiple meals, use EXACTLY the same name each time.
`;

export function buildRecipeGenerationPrompt(
  ingredientList: string,
  numberOfRecipes: number,
  filterBlock: string,
): string {
  return `You are a creative, flavor-focused chef. Based on the following pantry ingredients, suggest ${numberOfRecipes} delicious recipes. Use pantry items when they fit well, but prioritize flavor and ingredient compatibility over strict pantry usage. It's okay to include ingredients not in the pantry.

Pantry ingredients:
${ingredientList}
${filterBlock}
${FLAVOR_GUIDANCE}
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
- "ingredients": array of { "name": string, "quantity": number, "unit": string, "baseQuantity": number, "baseUnit": "g" | "ml" | "count", "notes": string (optional) }
- "steps": array of { "stepNumber": number, "instruction": string, "duration": number (optional, in minutes) }
- "tags": array of strings
- "dietaryFlags": array of strings
- "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number } (estimated per serving)

Do NOT include basic pantry staples that every kitchen has (e.g. water, salt, black pepper). Only list ingredients that are specific to the recipe.
${INGREDIENT_NAMING_INSTRUCTION}
For each ingredient, "baseQuantity" is the equivalent quantity normalized to a base unit and "baseUnit" is one of "g", "ml", or "count". For weight ingredients use grams, for liquids/volumes use milliliters, for countable items use count. Account for ingredient density when converting (e.g. 1 cup flour ≈ 125g, 1 cup butter ≈ 227g).

No markdown fences, no explanation — only the JSON array.`;
}

export function buildMealPlanPrompt(
  ingredientList: string,
  mealSchedule: MealScheduleSlot[],
  servings: number,
  constraintBlock: string,
): string {
  // Build day-by-day schedule block
  const scheduleByDay = new Map<number, string[]>();
  for (const slot of mealSchedule) {
    const existing = scheduleByDay.get(slot.dayOfWeek) ?? [];
    existing.push(slot.mealType);
    scheduleByDay.set(slot.dayOfWeek, existing);
  }

  const scheduleLines = Array.from(scheduleByDay.entries())
    .sort(([a], [b]) => a - b)
    .map(([day, types]) => `- ${DAY_NAMES[day]}: ${types.join(', ')}`)
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
${FLAVOR_GUIDANCE}
Vary cuisines, protein sources, and flavor profiles across days to avoid repetitive meals throughout the week.

Return ONLY a JSON object with a "meals" array where each item has:
- "dayOfWeek": number (0=Sunday, 1=Monday, ..., 6=Saturday)
- "mealType": "${uniqueMealTypes.join('" | "')}"
- "title": string (recipe name)
- "description": string (1-2 sentence description)
- "prepTimeMinutes": number
- "cookTimeMinutes": number
- "totalTimeMinutes": number
- "servings": number
- "difficulty": "Easy" | "Medium" | "Hard"
- "cuisine": string
- "ingredients": array of { "name": string, "quantity": number, "unit": string, "baseQuantity": number, "baseUnit": "g" | "ml" | "count", "notes": string (optional) }
- "steps": array of { "stepNumber": number, "instruction": string, "duration": number (optional, in minutes) }
- "tags": array of strings
- "dietaryFlags": array of strings
- "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number } (estimated per serving)

Do NOT include basic pantry staples that every kitchen has (e.g. water, salt, black pepper). Only list ingredients that are specific to the recipe.
${INGREDIENT_NAMING_INSTRUCTION}
For each ingredient, "baseQuantity" is the equivalent quantity normalized to a base unit and "baseUnit" is one of "g", "ml", or "count". For weight ingredients use grams, for liquids/volumes use milliliters, for countable items use count. Account for ingredient density when converting (e.g. 1 cup flour ≈ 125g, 1 cup butter ≈ 227g).

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
${FLAVOR_GUIDANCE}
Return ONLY a JSON object with:
- "title": string (recipe name)
- "description": string (1-2 sentence description)
- "prepTimeMinutes": number
- "cookTimeMinutes": number
- "totalTimeMinutes": number
- "servings": number
- "difficulty": "Easy" | "Medium" | "Hard"
- "cuisine": string
- "ingredients": array of { "name": string, "quantity": number, "unit": string, "baseQuantity": number, "baseUnit": "g" | "ml" | "count", "notes": string (optional) }
- "steps": array of { "stepNumber": number, "instruction": string, "duration": number (optional, in minutes) }
- "tags": array of strings
- "dietaryFlags": array of strings
- "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number } (estimated per serving)

Do NOT include basic pantry staples that every kitchen has (e.g. water, salt, black pepper). Only list ingredients that are specific to the recipe.
${INGREDIENT_NAMING_INSTRUCTION}
For each ingredient, "baseQuantity" is the equivalent quantity normalized to a base unit and "baseUnit" is one of "g", "ml", or "count". For weight ingredients use grams, for liquids/volumes use milliliters, for countable items use count. Account for ingredient density when converting (e.g. 1 cup flour ≈ 125g, 1 cup butter ≈ 227g).

No markdown fences, no explanation — only the JSON object.`;
}

export function buildShelfLifePrompt(displayName: string): string {
  const storageKeys = Object.values(StorageLocation).join(', ');
  const categories = FOOD_CATEGORIES.join(', ');
  return `How many days does "${displayName}" typically last when stored properly? Return ONLY a JSON object with numeric values for applicable storage methods, a category, and an emoji: { "${StorageLocation.Fridge}": days, "${StorageLocation.Freezer}": days, "${StorageLocation.Pantry}": days, "category": "<category>", "emoji": "<single emoji>" }. Valid storage keys: ${storageKeys}. Omit a storage key if that method is not applicable. "category" must be one of: ${categories}. "emoji" should be a single emoji that best represents this food item. No explanation.`;
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
  return `Categorize each food item below into one of these categories: ${categories}. Also provide a single emoji that best represents each food item.

Food items:
${list}

Return ONLY a JSON object mapping each food item name to an object with "category" and "emoji". Example: { "Cinnamon": { "category": "Spices & Herbs", "emoji": "🫚" }, "Chicken Breast": { "category": "Meat & Poultry", "emoji": "🍗" } }

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

export function buildUnitConversionPrompt(
  pairs: { ingredientName: string; ingredientQty: number; ingredientUnit: string; pantryUnit: string }[],
): string {
  const lines = pairs
    .map((p, i) => `${i + 1}. "${p.ingredientName}": ${p.ingredientQty} ${p.ingredientUnit} → ? ${p.pantryUnit}`)
    .join('\n');

  return `Convert each recipe ingredient quantity into the pantry unit. These are domain-specific conversions that cannot be done with standard unit math (e.g. cloves to heads, cups of flour to pounds).

Conversions needed:
${lines}

Return ONLY a JSON array where each element is the converted numeric quantity (in the same order as above). Example for 2 items: [0.25, 1.5]

No markdown fences, no explanation — only the JSON array.`;
}

export function buildReceiptScanPrompt(): string {
  return `You are a grocery receipt parser. Extract food and grocery items from the receipt image.

Return a JSON array of objects with these fields:
- "displayName": Human-readable product name. Expand common receipt abbreviations (e.g. "ORG" → "Organic", "GRN" → "Green", "BNLS" → "Boneless", "SKNLS" → "Skinless", "WHL" → "Whole", "BLK" → "Black", "WHT" → "White", "FRZ" → "Frozen", "BRST" → "Breast", "GRND" → "Ground"). Use title case.
- "quantity": Number of items (default 1 if not clear).
- "unit": One of these exact values: ${Object.values(UnitOfMeasure).join(', ')}. Use "count" if unsure.
- "emoji": A single emoji that best represents this food item (e.g. "🥛" for milk, "🍗" for chicken, "🥚" for eggs).
- "estimatedShelfLife": An object with estimated shelf life in days for each storage method: { "${StorageLocation.Fridge}": number, "${StorageLocation.Freezer}": number, "${StorageLocation.Pantry}": number }. Use typical values for an unopened product. Omit a key if that storage method is not applicable (e.g. omit "${StorageLocation.Fridge}" for raw meat).
- "suggestedStorageLocation": The most common storage location for this item. One of: ${Object.values(StorageLocation).join(', ')}.

Rules:
- Only include food/grocery items. Skip taxes, discounts, subtotals, rewards, coupons, bag fees, and non-food items.
- If a line shows a quantity multiplier (e.g. "2 @ $3.99"), use that quantity.
- If the receipt is unreadable or contains no food items, return an empty array: []

Return ONLY the JSON array, no markdown fences, no explanation.`;
}

export function buildAiChefSystemPrompt(currentDate: string): string {
  return `You are Chef StockPot, a warm, knowledgeable, and encouraging kitchen companion inside the StockPot app. You help users make the most of their ingredients, plan meals, and become more confident cooks.

Today's date is ${currentDate}.

## Personality
- Warm and friendly, like a supportive friend who happens to be a great cook
- Encouraging — celebrate their efforts, never judge their skill level
- Concise — keep responses focused and practical, avoid walls of text
- Adapt your language to the user's cooking skill level (check their profile)
- When suggesting or describing recipes, prioritize bold, well-balanced flavors — consider salt, acid, fat, heat, and umami

## Tool Usage Rules
- ALWAYS check the user's pantry before suggesting what they can cook
- ALWAYS check the user's profile before giving dietary advice
- Use get_expiring_items when they ask about expiration or what to use up
- Use get_current_meal_plan when they ask about their week's meals
- Use search_saved_recipes when they reference their saved recipes
- Use get_recipe_detail to get full recipe info when discussing a specific recipe
- Do NOT use tools for general cooking knowledge, technique questions, or substitution advice
- When suggesting recipes from their saved collection, include recipe cards

## Rich Content Blocks
When appropriate, embed structured blocks in your response using this syntax:

To show a recipe card (for saved recipes the user can tap to view):
:::recipe_card
{"id":"<recipe-uuid>","title":"Recipe Title","description":"Short description","totalTimeMinutes":30,"difficulty":"Easy","cuisine":"Italian"}
:::

To show an action button:
:::action_button
{"label":"Button Text","action":"view_recipe","recipeId":"<recipe-uuid>"}
:::
Other actions: "go_to_pantry", "generate_meal_plan"

To show an ingredient list with pantry status:
:::ingredient_list
{"items":[{"name":"Chicken Breast","quantity":2,"unit":"lb","pantryStatus":"enough"},{"name":"Soy Sauce","quantity":0.25,"unit":"cup","pantryStatus":"low"}]}
:::
pantryStatus values: "enough", "low", "none"

To show a pantry summary:
:::pantry_summary
{"totalItems":24,"expiringCount":3,"topExpiring":["Spinach (2 days)","Milk (3 days)"]}
:::

## Rules for rich blocks
- CRITICAL: The "id" field in recipe_card and action_button MUST be a real UUID returned by a tool (get_current_meal_plan, search_saved_recipes, get_recipe_detail). NEVER fabricate or guess an ID. If you don't have a real ID from a tool result, do NOT emit a recipe_card — just describe the recipe in plain text instead.
- Only use recipe_card for recipes where you have a real recipe ID from a tool response
- Use ingredient_list when comparing what they have vs. what they need
- Use pantry_summary when giving an overview of their pantry status
- Use action_button to help users navigate to relevant app features
- Always include some text explanation alongside rich blocks — never respond with only blocks

## Response Guidelines
- Keep responses under 300 words unless the user asks for detailed instructions
- Use short paragraphs and bullet points for readability
- When suggesting recipes, mention 2-3 options and let them choose
- If you don't have enough info, ask a clarifying question
- Respect dietary restrictions absolutely — never suggest foods they've excluded`;
}

export function buildUrlRecipeImportPrompt(
  pageContent: string,
  mealType: string,
): string {
  return `You are a recipe extraction assistant. Extract the recipe from the following webpage content and return it as structured JSON. If the page does not contain a recipe, return { "error": "No recipe found on this page." }.

Webpage content:
${pageContent}

Return ONLY a JSON object with:
- "title": string (recipe name)
- "description": string (1-2 sentence description)
- "prepTimeMinutes": number
- "cookTimeMinutes": number
- "totalTimeMinutes": number
- "servings": number
- "difficulty": "Easy" | "Medium" | "Hard"
- "cuisine": string
- "ingredients": array of { "name": string, "quantity": number, "unit": string, "baseQuantity": number, "baseUnit": "g" | "ml" | "count", "notes": string (optional) }
- "steps": array of { "stepNumber": number, "instruction": string, "duration": number (optional, in minutes) }
- "tags": array of strings
- "dietaryFlags": array of strings
- "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number } (estimated per serving)

The mealType for this recipe is "${mealType}".

Do NOT include basic pantry staples that every kitchen has (e.g. water, salt, black pepper). Only list ingredients that are specific to the recipe.
${INGREDIENT_NAMING_INSTRUCTION}
For each ingredient, "baseQuantity" is the equivalent quantity normalized to a base unit and "baseUnit" is one of "g", "ml", or "count". For weight ingredients use grams, for liquids/volumes use milliliters, for countable items use count. Account for ingredient density when converting (e.g. 1 cup flour ≈ 125g, 1 cup butter ≈ 227g).

No markdown fences, no explanation — only the JSON object.`;
}

export function buildPhotoRecipeImportPrompt(mealType: string): string {
  return `You are a recipe extraction assistant. Extract the recipe from this photo of a physical recipe (cookbook page, recipe card, handwritten recipe, printout, etc.) and return it as structured JSON.

If the image does not contain a recipe, return { "error": "This image doesn't appear to contain a recipe. Please take a photo of a cookbook page, recipe card, or handwritten recipe." }.

Return ONLY a JSON object with:
- "title": string (recipe name)
- "description": string (1-2 sentence description)
- "prepTimeMinutes": number
- "cookTimeMinutes": number
- "totalTimeMinutes": number
- "servings": number
- "difficulty": "Easy" | "Medium" | "Hard"
- "cuisine": string
- "ingredients": array of { "name": string, "quantity": number, "unit": string, "baseQuantity": number, "baseUnit": "g" | "ml" | "count", "notes": string (optional) }
- "steps": array of { "stepNumber": number, "instruction": string, "duration": number (optional, in minutes) }
- "tags": array of strings
- "dietaryFlags": array of strings
- "nutrition": { "calories": number, "protein": number, "carbs": number, "fat": number } (estimated per serving)

The mealType for this recipe is "${mealType}".

Do NOT include basic pantry staples that every kitchen has (e.g. water, salt, black pepper). Only list ingredients that are specific to the recipe.
${INGREDIENT_NAMING_INSTRUCTION}
For each ingredient, "baseQuantity" is the equivalent quantity normalized to a base unit and "baseUnit" is one of "g", "ml", or "count". For weight ingredients use grams, for liquids/volumes use milliliters, for countable items use count. Account for ingredient density when converting (e.g. 1 cup flour ≈ 125g, 1 cup butter ≈ 227g).

No markdown fences, no explanation — only the JSON object.`;
}

export function buildFoodMatchPrompt(
  items: { name: string; candidates: { id: string; name: string }[] }[],
): string {
  const itemLines = items
    .map((item) => {
      const candidateList = item.candidates
        .map((c) => `  - { "id": "${c.id}", "name": "${c.name}" }`)
        .join('\n');
      return `"${item.name}":\n${candidateList}`;
    })
    .join('\n\n');

  return `For each food name below, determine if it refers to the SAME food as any of its candidates. Return the candidate id if it's the same food, or null if none match.

Guidelines for "same food":
- "Broccoli Florets" and "Broccoli" → SAME (different cuts of same vegetable)
- "Sesame Oil Unrefined" and "Sesame Oil" → SAME (quality variant of same oil)
- "Organic Milk" and "Milk" → SAME (organic is a label, not a different food)
- "Diced Tomatoes" and "Tomatoes" → SAME (form/preparation variant)
- "Red Onion" and "Onion" → DIFFERENT (distinct varieties with different flavor)
- "Chicken Breast" and "Chicken Thighs" → DIFFERENT (different cuts)
- "Sweet Potato" and "Potato" → DIFFERENT (different vegetables)
- "Coconut Oil" and "Olive Oil" → DIFFERENT (different oils entirely)
- "Brown Sugar" and "Sugar" → DIFFERENT (distinct ingredients, not interchangeable)
- "Powdered Sugar" and "Sugar" → DIFFERENT (different form, different uses)
- "Sour Cream" and "Cream" → DIFFERENT (different dairy products)
- "Cream Cheese" and "Cheese" → DIFFERENT (different products entirely)

When in doubt, prefer DIFFERENT. Only match if the items are truly the same base food and could reasonably share a pantry tracking entry.

Food names and their candidates:
${itemLines}

Return ONLY a JSON object mapping each food name to the matched candidate id or null. Example: { "Broccoli Florets": "fc-abc", "Red Onion": null }

No markdown fences, no explanation — only the JSON object.`;
}
