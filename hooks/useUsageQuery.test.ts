import { renderHook, waitFor } from '@testing-library/react-native';
import { useUsageQuery } from './useUsageQuery';
import { api } from '../services/api';
import { createAuthWrapper } from '../test-utils/wrapper';
import * as Keychain from 'react-native-keychain';

jest.mock('../services/api', () => ({
  api: { post: jest.fn(), get: jest.fn(), patch: jest.fn() },
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
  setOnTokensRefreshed: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

describe('useUsageQuery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should not fetch when unauthenticated', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);

    const wrapper = createAuthWrapper();
    const { result } = renderHook(() => useUsageQuery(), { wrapper });

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
      id: 'ut-1',
      periodStart: '2026-02-01',
      receiptScans: 3,
      mealPlansGenerated: 1,
      recipesGenerated: 5,
      aiChatMessages: 10,
      substitutionRequests: 2,
    });

    const wrapper = createAuthWrapper();
    const { result } = renderHook(() => useUsageQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.data).toBeDefined();
    });

    expect(api.get).toHaveBeenCalledWith('/usage/current');
  });
});
