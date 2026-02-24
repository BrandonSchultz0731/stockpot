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
  RECIPES: '/recipes',
  FOOD: {
    SEARCH: '/food/search',
    BARCODE: (code: string) => `/food/barcode/${code}`,
  },
  PANTRY: {
    LIST: '/pantry',
    CREATE: '/pantry',
    BULK_CREATE: '/pantry/bulk',
    UPDATE: (id: string) => `/pantry/${id}`,
    DELETE: (id: string) => `/pantry/${id}`,
  },
} as const;
