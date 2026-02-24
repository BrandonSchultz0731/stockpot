import { QUERY_KEYS } from './queryKeys';

describe('QUERY_KEYS', () => {
  it('should have correct RECIPES key', () => {
    expect(QUERY_KEYS.RECIPES).toEqual(['recipes']);
  });

  it('should have correct USER_PROFILE key', () => {
    expect(QUERY_KEYS.USER_PROFILE).toEqual(['user', 'profile']);
  });
});
