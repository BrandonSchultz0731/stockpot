export const QUERY_KEYS = {
  RECIPES: {
    SAVED: ['recipes', 'saved'],
    DETAIL: (id: string) => ['recipes', id],
    PANTRY_CHECK: (id: string, scale: number) => ['recipes', 'pantry-check', id, scale],
  },
  USER_PROFILE: ['user', 'profile'],
  USAGE_CURRENT: ['usage', 'current'],
  PANTRY_ITEMS: ['pantry', 'items'],
  FOOD_SEARCH: (query: string) => ['food', 'search', query],
  FOOD_BARCODE: (code: string) => ['food', 'barcode', code],
  MEAL_PLANS: {
    ALL: ['meal-plans'],
    CURRENT: ['meal-plans', 'current'],
    WEEK: (date: string) => ['meal-plans', 'week', date],
    COOK_PREVIEW_ALL: ['meal-plans', 'cook-preview'],
    COOK_PREVIEW: (entryId: string, servingsToCook?: number) => ['meal-plans', 'cook-preview', entryId, servingsToCook],
    LEFTOVERS: (planId: string) => ['meal-plans', 'leftovers', planId],
  },
  SHOPPING_LISTS: {
    ALL: ['shopping-lists'],
    BY_MEAL_PLAN: (planId: string) => ['shopping-lists', 'meal-plan', planId],
  },
  AI_CHAT: {
    CONVERSATIONS: ['ai-chat', 'conversations'],
    MESSAGES: (conversationId: string) => ['ai-chat', 'messages', conversationId],
  },
} as const;
