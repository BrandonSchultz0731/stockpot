import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useLoginMutation } from './useLoginMutation';
import { api } from '../services/api';
import { createAuthWrapper } from '../test-utils/wrapper';

jest.mock('../services/api', () => ({
  api: { post: jest.fn(), get: jest.fn(), patch: jest.fn() },
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
  setOnTokensRefreshed: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

const wrapper = createAuthWrapper();

describe('useLoginMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call api.post with login route and credentials', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
    });

    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'test@example.com',
        password: 'password123',
      });
    });

    expect(api.post).toHaveBeenCalledWith('/auth/login', {
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('should expose error on failure', async () => {
    const error = new Error('Invalid credentials');
    (api.post as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          email: 'bad@example.com',
          password: 'wrong',
        });
      } catch {}
    });

    await waitFor(() => {
      expect(result.current.error).toBeTruthy();
    });
  });
});
