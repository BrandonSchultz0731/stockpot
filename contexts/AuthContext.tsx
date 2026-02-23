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
import { setAccessToken } from '../services/api';

const KEYCHAIN_SERVICE = 'stockpot-auth';

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

  // Hydrate tokens from Keychain on mount
  useEffect(() => {
    Keychain.getGenericPassword({ service: KEYCHAIN_SERVICE })
      .then(result => {
        if (result) {
          const tokens: TokenPair = JSON.parse(result.password);
          setAccessTokenState(tokens.accessToken);
          setRefreshToken(tokens.refreshToken);
          setAccessToken(tokens.accessToken);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const saveTokens = useCallback(async (tokens: TokenPair) => {
    await Keychain.setGenericPassword('tokens', JSON.stringify(tokens), {
      service: KEYCHAIN_SERVICE,
    });
    setAccessTokenState(tokens.accessToken);
    setRefreshToken(tokens.refreshToken);
    setAccessToken(tokens.accessToken);
  }, []);

  const clearTokens = useCallback(async () => {
    await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
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
