import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import * as Keychain from 'react-native-keychain';
import { AuthProvider, useAuth } from './AuthContext';
import { setAccessToken } from '../services/api';

jest.mock('../services/api', () => ({
  setAccessToken: jest.fn(),
  setRefreshToken: jest.fn(),
  setOnTokensRefreshed: jest.fn(),
  setOnUnauthorized: jest.fn(),
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <AuthProvider>{children}</AuthProvider>
);

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue(false);
  });

  it('should throw when useAuth is used outside provider', () => {
    // Suppress console.error for expected error
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');
    spy.mockRestore();
  });

  it('should start in loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // Initially loading until keychain check completes
    expect(result.current.isLoading).toBe(true);
  });

  it('should be unauthenticated when no tokens stored', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.refreshToken).toBeNull();
  });

  it('should hydrate tokens from Keychain', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
      password: JSON.stringify({
        accessToken: 'stored-at',
        refreshToken: 'stored-rt',
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.refreshToken).toBe('stored-rt');
    expect(setAccessToken).toHaveBeenCalledWith('stored-at');
  });

  it('should save tokens and update state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    await act(async () => {
      await result.current.saveTokens({
        accessToken: 'new-at',
        refreshToken: 'new-rt',
      });
    });

    expect(Keychain.setGenericPassword).toHaveBeenCalledWith(
      'tokens',
      JSON.stringify({ accessToken: 'new-at', refreshToken: 'new-rt' }),
      { service: 'stockpot-auth' },
    );
    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.refreshToken).toBe('new-rt');
    expect(setAccessToken).toHaveBeenCalledWith('new-at');
  });

  it('should clear tokens and reset state', async () => {
    (Keychain.getGenericPassword as jest.Mock).mockResolvedValue({
      password: JSON.stringify({
        accessToken: 'at',
        refreshToken: 'rt',
      }),
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    await act(async () => {
      await result.current.clearTokens();
    });

    expect(Keychain.resetGenericPassword).toHaveBeenCalledWith({
      service: 'stockpot-auth',
    });
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.refreshToken).toBeNull();
    expect(setAccessToken).toHaveBeenCalledWith(null);
  });
});
