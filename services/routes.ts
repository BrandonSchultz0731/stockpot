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
} as const;
