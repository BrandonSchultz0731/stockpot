import { useMutation } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { useAuth } from '../contexts/AuthContext';

interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName?: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export function useRegisterMutation() {
  const { saveTokens } = useAuth();

  return useMutation({
    mutationFn: (data: RegisterRequest) =>
      api.post<TokenPair>(ROUTES.AUTH.REGISTER, data),
    onSuccess: data => saveTokens(data),
  });
}
