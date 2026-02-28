import Anthropic from '@anthropic-ai/sdk';
import { AiChatTool } from '@shared/aiChatTools';

export const AI_CHAT_TOOLS: Anthropic.Tool[] = [
  {
    name: AiChatTool.GetPantryItems,
    description:
      "Get the user's full pantry inventory including item names, quantities, units, storage locations, and expiration dates.",
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: AiChatTool.SearchSavedRecipes,
    description:
      "Search the user's saved recipes by keyword. Returns matching recipe titles, descriptions, and IDs. Call with no query to list all saved recipes.",
    input_schema: {
      type: 'object' as const,
      properties: {
        query: {
          type: 'string',
          description: 'Optional search term to filter recipes by title or description',
        },
      },
      required: [],
    },
  },
  {
    name: AiChatTool.GetRecipeDetail,
    description:
      'Get full details for a specific recipe including ingredients, steps, nutrition, and cooking times.',
    input_schema: {
      type: 'object' as const,
      properties: {
        recipeId: {
          type: 'string',
          description: 'The UUID of the recipe to retrieve',
        },
      },
      required: ['recipeId'],
    },
  },
  {
    name: AiChatTool.GetCurrentMealPlan,
    description:
      "Get the user's current week's meal plan with all scheduled meals, recipes, and cooking status.",
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: AiChatTool.GetShoppingList,
    description:
      'Get the shopping list for a specific meal plan, including items needed and their pantry status.',
    input_schema: {
      type: 'object' as const,
      properties: {
        mealPlanId: {
          type: 'string',
          description: 'The UUID of the meal plan',
        },
      },
      required: ['mealPlanId'],
    },
  },
  {
    name: AiChatTool.GetUserProfile,
    description:
      "Get the user's profile including dietary preferences, excluded ingredients, cooking skill level, household size, and nutritional goals.",
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: AiChatTool.GetExpiringItems,
    description:
      'Get pantry items that are expiring within a specified number of days.',
    input_schema: {
      type: 'object' as const,
      properties: {
        days: {
          type: 'number',
          description: 'Number of days to look ahead for expiring items (default: 3)',
        },
      },
      required: [],
    },
  },
];
