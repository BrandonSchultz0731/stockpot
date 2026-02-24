import { renderHook, waitFor } from '@testing-library/react-native';
import { useUserProfileQuery } from './useUserProfileQuery';
import { api } from '../services/api';
import { createAuthWrapper } from '../test-utils/wrapper';
import * as Keychain from 'react-native-keychain';

jest.mock('../services/api', () => ({
  api: { post: jest.fn(), get: jest.fn(), patch: jest.fn() },
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
  setOnTokensRefreshed: jest.fn(),
}));

describe('useUserProfileQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not fetch when unauthenticated', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

    const wrapper = createAuthWrapper();
    const { result } = renderHook(() => useUserProfileQuery(), { wrapper });

    // Wait for auth to settle
    await waitFor(() => {
      expect(result.current.isFetching).toBe(false);
    });

    expect(api.get).not.toHaveBeenCalled();
  });

  it('should fetch when authenticated', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
      password: JSON.stringify({
        accessToken: 'at',
        refreshToken: 'rt',
      }),
    });
    (api.get as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      firstName: 'Test',
    });

    const wrapper = createAuthWrapper();
    const { result } = renderHook(() => useUserProfileQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(api.get).toHaveBeenCalledWith('/users/me');
  });
});
