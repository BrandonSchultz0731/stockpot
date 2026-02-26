import { ROUTES } from './routes';

describe('ROUTES', () => {
  it('should have correct auth routes', () => {
    expect(ROUTES.AUTH.LOGIN).toBe('/auth/login');
    expect(ROUTES.AUTH.REGISTER).toBe('/auth/register');
    expect(ROUTES.AUTH.REFRESH).toBe('/auth/refresh');
    expect(ROUTES.AUTH.LOGOUT).toBe('/auth/logout');
  });

  it('should have correct user routes', () => {
    expect(ROUTES.USERS.ME).toBe('/users/me');
    expect(ROUTES.USERS.COMPLETE_ONBOARDING).toBe('/users/me/onboarding');
  });

  it('should have correct usage routes', () => {
    expect(ROUTES.USAGE.CURRENT).toBe('/usage/current');
  });

  it('should have correct recipes routes', () => {
    expect(ROUTES.RECIPES.GENERATE).toBe('/recipes/generate');
    expect(ROUTES.RECIPES.SAVED).toBe('/recipes/saved');
    expect(ROUTES.RECIPES.DETAIL('abc')).toBe('/recipes/abc');
    expect(ROUTES.RECIPES.SAVE('abc')).toBe('/recipes/abc/save');
    expect(ROUTES.RECIPES.UPDATE_SAVED('abc')).toBe('/recipes/saved/abc');
  });

  it('should have correct meal plans routes', () => {
    expect(ROUTES.MEAL_PLANS.GENERATE).toBe('/meal-plans/generate');
    expect(ROUTES.MEAL_PLANS.CURRENT).toBe('/meal-plans/current');
    expect(ROUTES.MEAL_PLANS.WEEK('2026-02-23')).toBe('/meal-plans/week/2026-02-23');
    expect(ROUTES.MEAL_PLANS.UPDATE_ENTRY('abc')).toBe('/meal-plans/entries/abc');
    expect(ROUTES.MEAL_PLANS.SWAP_ENTRY('abc')).toBe('/meal-plans/entries/abc/swap');
    expect(ROUTES.MEAL_PLANS.DELETE('abc')).toBe('/meal-plans/abc');
  });
});
