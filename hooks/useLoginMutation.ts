import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { useAuth } from '../contexts/AuthContext';

interface LoginRequest {
  email: string;
  password: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function useLoginMutation() {
  const { saveTokens } = useAuth();

  return useMutation({
    mutationFn: (credentials: LoginRequest) =>
      api.post<TokenPair>(ROUTES.AUTH.LOGIN, credentials),
    onSuccess: data => saveTokens(data),
  });
}
