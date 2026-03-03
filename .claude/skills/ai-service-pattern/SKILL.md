---
name: ai-service-pattern
description: How to call the Anthropic AI and parse responses in server services. Use when adding AI-powered features, prompts, or response parsing.
---

# AI Service Pattern

## Calling the AI

The Anthropic client is wrapped in `AnthropicService`, injected via NestJS DI. Import the module and inject it:

```typescript
// In your module:
imports: [AnthropicModule]

// In your service:
constructor(
  private readonly anthropicService: AnthropicService,
) {}
```

### Making a request

```typescript
import { ACTIVE_MODEL, CLAUDE_MODELS } from '../ai-models';
import { MessageType } from '@shared/enums';

const response = await this.anthropicService.sendMessage(userId, {
  model: ACTIVE_MODEL,           // for complex tasks
  // model: CLAUDE_MODELS['haiku-4.5'],  // for lightweight/cheap tasks
  maxTokens: 4096,
  messages: [{ role: 'user', content: prompt }],
  messageType: MessageType.RecipeGeneration,  // for usage tracking
});
```

- `ACTIVE_MODEL` for complex generation tasks
- `CLAUDE_MODELS['haiku-4.5']` for simple parsing/classification
- `messageType` is an enum value used for usage tracking
- Always wrap in try/catch:

```typescript
try {
  response = await this.anthropicService.sendMessage(userId, { ... });
} catch (error) {
  this.logger.error('AI call failed', error);
  throw new BadGatewayException('Service unavailable');
}
```

## Parsing responses

Use the shared utilities in `src/utils/ai-response.ts`. Never write inline JSON parsing.

```typescript
import { extractText, parseObjectFromAI, parseArrayFromAI } from '../utils/ai-response';
```

### Step 1: Extract text from response

```typescript
const rawText = extractText(response);
```

### Step 2: Parse with the appropriate typed function

```typescript
// When expecting a single object:
const parsed = parseObjectFromAI<Record<string, string>>(rawText) ?? {};

// When expecting an array:
const parsed = parseArrayFromAI<ParsedRecipe>(rawText) ?? [];

// When the shape is uncertain (raw JSON):
import { parseJsonFromAI } from '../utils/ai-response';
const parsed = parseJsonFromAI(rawText);
```

Use the generic type parameter to avoid `as` casts:
```typescript
// Good:
const parsed = parseObjectFromAI<Record<string, string | null>>(rawText) ?? {};

// Bad:
const parsed = (parseObjectFromAI(rawText) ?? {}) as Record<string, string>;
```

### Step 3: Validate before using

AI output is untrusted. Always validate critical fields:

```typescript
const rawParsed = parseArrayFromAI<ParsedRecipe>(rawText) ?? [];
const valid = rawParsed.filter(
  (item) => item && typeof item.title === 'string' && Array.isArray(item.ingredients),
);
```

## Shared utilities

### Recipe building (`src/utils/recipe-builder.ts`)

```typescript
import {
  formatPantryForPrompt,
  buildPantryFoodItems,
  mapResolvedIngredients,
  buildRecipeData,
  ParsedRecipe,
  ParsedIngredient,
} from '../utils/recipe-builder';

// Format pantry items for AI prompts
const ingredientList = formatPantryForPrompt(pantryItems);

// Resolve AI ingredient names to foodCacheIds
const foodItems = buildPantryFoodItems(pantryItems);
const resolvedMap = await this.foodCacheService.resolveIngredientNames(names, foodItems, userId);
const ingredients = mapResolvedIngredients(parsed.ingredients, resolvedMap);

// Build recipe data for persistence
const recipeData = buildRecipeData(parsed, {
  userId,
  source: RecipeSource.AI,
  mealType: 'Dinner',
  servings: 4,
});
```

### Shelf life parsing (`src/utils/shelf-life.ts`)

```typescript
import { parseShelfLife } from '../utils/shelf-life';

const obj = parseObjectFromAI(rawText);
const shelfLife = obj ? parseShelfLife(obj) : undefined;
```

### MIME normalization (`src/utils/mime.ts`)

```typescript
import { normalizeImageMime } from '../utils/mime';

const mime = normalizeImageMime(file.mimeType); // handles jpg, heic, heif -> jpeg
```

## Prompts

Prompt templates live in `server/src/prompts/`. Import builder functions:

```typescript
import { buildRecipeGenerationPrompt } from '../prompts';
const prompt = buildRecipeGenerationPrompt(ingredientList, count, filters);
```

## Full example

```typescript
async generateRecipes(userId: string, dto: GenerateRecipeDto): Promise<Recipe[]> {
  const pantryItems = await this.pantryService.findAllForUser(userId);
  const ingredientList = formatPantryForPrompt(pantryItems);
  const prompt = buildRecipeGenerationPrompt(ingredientList, dto.count);

  let response;
  try {
    response = await this.anthropicService.sendMessage(userId, {
      model: ACTIVE_MODEL,
      maxTokens: 4096,
      messages: [{ role: 'user', content: prompt }],
      messageType: MessageType.RecipeGeneration,
    });
  } catch (error) {
    this.logger.error('Recipe generation failed', error);
    throw new BadGatewayException('Recipe generation unavailable');
  }

  const rawText = extractText(response);
  const rawParsed = parseArrayFromAI<ParsedRecipe>(rawText) ?? [];
  const parsed = rawParsed.filter(
    (item) => item && typeof item.title === 'string' && Array.isArray(item.ingredients),
  );

  const resolvedMap = await this.foodCacheService.resolveIngredientNames(
    allIngredientNames,
    buildPantryFoodItems(pantryItems),
    userId,
  );

  return Promise.all(parsed.map(async (item) => {
    const ingredients = mapResolvedIngredients(item.ingredients, resolvedMap);
    return this.recipeRepo.save(
      this.recipeRepo.create({
        ...buildRecipeData(item, { userId, source: RecipeSource.AI }),
        ingredients,
      }),
    );
  }));
}
```
