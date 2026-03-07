import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as Keychain from 'react-native-keychain';
import { useQueryClient } from '@tanstack/react-query';
import { setAccessToken, setRefreshToken as setApiRefreshToken, setOnTokensRefreshed, setOnUnauthorized } from '../services/api';
import { initPurchases } from '../services/purchases';

const KEYCHAIN_SERVICE = 'stockpot-auth';

function decodeBase64(str: string): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let output = '';
  let i = 0;
  const input = str.replace(/[^A-Za-z0-9+/=]/g, '');
  while (i < input.length) {
    const a = chars.indexOf(input.charAt(i++));
    const b = chars.indexOf(input.charAt(i++));
    const c = chars.indexOf(input.charAt(i++));
    const d = chars.indexOf(input.charAt(i++));
    const bits = (a << 18) | (b << 12) | (c << 6) | d;
    output += String.fromCharCode((bits >> 16) & 0xff);
    if (c !== 64) output += String.fromCharCode((bits >> 8) & 0xff);
    if (d !== 64) output += String.fromCharCode(bits & 0xff);
  }
  return output;
}

function getUserIdFromToken(token: string): string | null {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(decodeBase64(payload));
    return decoded.sub ?? null;
  } catch {
    return null;
  }
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

interface AuthContextValue {
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshToken: string | null;
  saveTokens: (tokens: TokenPair) => Promise<void>;
  clearTokens: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate tokens from Keychain on mount
  useEffect(() => {
    Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE })
      .then(result => {
        if (result) {
          const tokens: TokenPair = JSON.parse(result.password);
          setAccessTokenState(tokens.accessToken);
          setRefreshToken(tokens.refreshToken);
          setAccessToken(tokens.accessToken);
          setApiRefreshToken(tokens.refreshToken);
          const userId = getUserIdFromToken(tokens.accessToken);
          if (userId) {
            initPurchases(userId);
          }
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  // Clear React state when the API layer detects an expired token
  useEffect(() => {
    setOnUnauthorized(() => {
      setAccessTokenState(null);
      setRefreshToken(null);
    });
    return () => setOnUnauthorized(null);
  }, []);

  const saveTokens = useCallback(async (tokens: TokenPair) => {
    await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), {
      service: KEYCHAIN_SERVICE,
    });
    setAccessTokenState(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setAccessToken(tokens.accessToken);
    setApiRefreshToken(tokens.refreshToken);
    const userId = getUserIdFromToken(tokens.accessToken);
    if (userId) {
      initPurchases(userId);
    }
  }, []);

  const clearTokens = useCallback(async () => {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
    setAccessTokenState(null);
    setRefreshToken(null);
    setAccessToken(null);
    setApiRefreshToken(null);
    queryClient.clear();
  }, [queryClient]);

  // Register callback so the API layer can persist refreshed tokens
  useEffect(() => {
    setOnTokensRefreshed((tokens) => {
      saveTokens(tokens);
    });
    return () => setOnTokensRefreshed(null);
  }, [saveTokens]);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      isAuthenticated: !!accessToken,
      refreshToken,
      saveTokens,
      clearTokens,
    }),
    [isLoading, accessToken, refreshToken, saveTokens, clearTokens],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return ctx;
}
