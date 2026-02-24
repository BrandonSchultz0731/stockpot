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

  it('should have correct recipes route', () => {
    expect(ROUTES.RECIPES).toBe('/recipes');
  });
});
