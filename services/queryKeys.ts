export const QUERY_KEYS = {
  RECIPES: {
    SAVED: ['recipes', 'saved'],
    DETAIL: (id: string) => ['recipes', id],
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
    COOK_PREVIEW: (entryId: string) => ['meal-plans', 'cook-preview', entryId],
  },
  SHOPPING_LISTS: {
    ALL: ['shopping-lists'],
    BY_MEAL_PLAN: (planId: string) => ['shopping-lists', 'meal-plan', planId],
  },
} as const;
