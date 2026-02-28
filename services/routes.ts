export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    REFRESH: '/auth/refresh',
    LOGOUT: '/auth/logout',
  },
  USERS: {
    ME: '/users/me',
    COMPLETE_ONBOARDING: '/users/me/onboarding',
  },
  USAGE: {
    CURRENT: '/usage/current',
  },
  RECIPES: {
    GENERATE: '/recipes/generate',
    SAVED: '/recipes/saved',
    DETAIL: (id: string) => `/recipes/${id}`,
    SAVE: (id: string) => `/recipes/${id}/save`,
    UPDATE_SAVED: (id: string) => `/recipes/saved/${id}`,
  },
  FOOD: {
    SEARCH: '/food/search',
    BARCODE: (code: string) => `/food/barcode/${code}`,
  },
  RECEIPTS: {
    SCAN: '/receipts/scan',
  },
  PANTRY: {
    LIST: '/pantry',
    CREATE: '/pantry',
    BULK_CREATE: '/pantry/bulk',
    UPDATE: (id: string) => `/pantry/${id}`,
    DELETE: (id: string) => `/pantry/${id}`,
  },
  MEAL_PLANS: {
    GENERATE: '/meal-plans/generate',
    CURRENT: '/meal-plans/current',
    WEEK: (date: string) => `/meal-plans/week/${date}`,
    UPDATE_ENTRY: (id: string) => `/meal-plans/entries/${id}`,
    SWAP_ENTRY: (id: string) => `/meal-plans/entries/${id}/swap`,
    COOK_PREVIEW: (id: string) => `/meal-plans/entries/${id}/cook/preview`,
    COOK_CONFIRM: (id: string) => `/meal-plans/entries/${id}/cook/confirm`,
    DELETE: (id: string) => `/meal-plans/${id}`,
  },
  SHOPPING_LISTS: {
    BY_MEAL_PLAN: (planId: string) => `/shopping-lists/meal-plan/${planId}`,
    TOGGLE_ITEM: (listId: string, itemId: string) =>
      `/shopping-lists/${listId}/items/${itemId}`,
  },
  AI_CHAT: {
    MESSAGES: '/ai-chat/messages',
    CONVERSATIONS: '/ai-chat/conversations',
    CONVERSATION_MESSAGES: (id: string) => `/ai-chat/conversations/${id}/messages`,
    DELETE_CONVERSATION: (id: string) => `/ai-chat/conversations/${id}`,
  },
} as const;
