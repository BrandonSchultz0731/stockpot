import { QUERY_KEYS } from './queryKeys';

describe('QUERY_KEYS', () => {
  it('should have correct RECIPES keys', () => {
    expect(QUERY_KEYS.RECIPES.SAVED).toEqual(['recipes', 'saved']);
    expect(QUERY_KEYS.RECIPES.DETAIL('abc')).toEqual(['recipes', 'abc']);
  });

  it('should have correct USER_PROFILE key', () => {
    expect(QUERY_KEYS.USER_PROFILE).toEqual(['user', 'profile']);
  });

  it('should have correct USAGE_CURRENT key', () => {
    expect(QUERY_KEYS.USAGE_CURRENT).toEqual(['usage', 'current']);
  });
});
