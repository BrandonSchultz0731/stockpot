import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAccessToken } from '../services/api';

const STORAGE_KEY = '@stockpot_auth';

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
  const [accessToken, setAccessTokenState] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hydrate tokens from AsyncStorage on mount
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(raw => {
        if (raw) {
          const tokens: TokenPair = JSON.parse(raw);
          setAccessTokenState(tokens.accessToken);
          setRefreshToken(tokens.refreshToken);
          setAccessToken(tokens.accessToken);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const saveTokens = useCallback(async (tokens: TokenPair) => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tokens));
    setAccessTokenState(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setAccessToken(tokens.accessToken);
  }, []);

  const clearTokens = useCallback(async () => {
    await AsyncStorage.removeItem(STORAGE_KEY);
    setAccessTokenState(null);
    setRefreshToken(null);
    setAccessToken(null);
  }, []);

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
