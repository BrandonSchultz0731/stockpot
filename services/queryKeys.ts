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
    CURRENT: ['meal-plans', 'current'],
    WEEK: (date: string) => ['meal-plans', 'week', date],
  },
} as const;
