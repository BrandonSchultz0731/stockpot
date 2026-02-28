export enum AiChatTool {
  GetPantryItems = 'get_pantry_items',
  SearchSavedRecipes = 'search_saved_recipes',
  GetRecipeDetail = 'get_recipe_detail',
  GetCurrentMealPlan = 'get_current_meal_plan',
  GetShoppingList = 'get_shopping_list',
  GetUserProfile = 'get_user_profile',
  GetExpiringItems = 'get_expiring_items',
}

export const AI_CHAT_TOOL_LABELS: Record<AiChatTool, string> = {
  [AiChatTool.GetPantryItems]: 'Checking your pantry',
  [AiChatTool.SearchSavedRecipes]: 'Searching recipes',
  [AiChatTool.GetRecipeDetail]: 'Loading recipe details',
  [AiChatTool.GetCurrentMealPlan]: 'Checking meal plan',
  [AiChatTool.GetShoppingList]: 'Loading shopping list',
  [AiChatTool.GetUserProfile]: 'Checking your profile',
  [AiChatTool.GetExpiringItems]: 'Checking expiring items',
};
