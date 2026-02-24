import { renderHook, act } from '@testing-library/react-native';
import { useRegisterMutation } from './useRegisterMutation';
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

describe('useRegisterMutation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call api.post with register route and data', async () => {
    (api.post as jest.Mock).mockResolvedValue({
      accessToken: 'at',
      refreshToken: 'rt',
    });

    const { result } = renderHook(() => useRegisterMutation(), { wrapper });

    await act(async () => {
      await result.current.mutateAsync({
        email: 'new@example.com',
        password: 'password123',
        firstName: 'Test',
      });
    });

    expect(api.post).toHaveBeenCalledWith('/auth/register', {
      email: 'new@example.com',
      password: 'password123',
      firstName: 'Test',
    });
  });

  it('should expose error on failure', async () => {
    (api.post as jest.Mock).mockRejectedValue(new Error('Email in use'));

    const { result } = renderHook(() => useRegisterMutation(), { wrapper });

    await act(async () => {
      try {
        await result.current.mutateAsync({
          email: 'dup@example.com',
          password: 'pass1234',
          firstName: 'T',
        });
      } catch {}
    });

    expect(result.current.error).toBeTruthy();
  });
});
