import { useMutation } from '@tanstack/react-query';
import { Platform } from 'react-native';
import appleAuth from '@invertase/react-native-apple-authentication';
import {
  GoogleSignin,
  statusCodes,
} from '@react-native-google-signin/google-signin';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { useAuth } from '../contexts/AuthContext';

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

GoogleSignin.configure({
  iosClientId:
    '1054363388777-cnjue8tt0dpmn87am0hgc8ffadflj334.apps.googleusercontent.com',
  webClientId:
    '1054363388777-k1n7rsvislgvrf3qti2hm0rpgcdvch87.apps.googleusercontent.com',
});

export function useSocialAuth() {
  const { saveTokens } = useAuth();

  const appleMutation = useMutation({
    mutationFn: (params: {
      identityToken: string;
      firstName?: string;
      lastName?: string;
    }) => api.post<TokenPair>(ROUTES.AUTH.APPLE, params),
    onSuccess: data => saveTokens(data),
  });

  const googleMutation = useMutation({
    mutationFn: (params: { idToken: string }) =>
      api.post<TokenPair>(ROUTES.AUTH.GOOGLE, params),
    onSuccess: data => saveTokens(data),
  });

  const signInWithApple = async () => {
    try {
      const response = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!response.identityToken) {
        throw new Error('Apple Sign-In failed — no identity token received');
      }

      await appleMutation.mutateAsync({
        identityToken: response.identityToken,
        firstName: response.fullName?.givenName ?? undefined,
        lastName: response.fullName?.familyName ?? undefined,
      });
    } catch (error: any) {
      if (error.code === appleAuth.Error.CANCELED) {
        return; // User cancelled — not an error
      }
      throw error;
    }
  };

  const signInWithGoogle = async () => {
    try {
      await GoogleSignin.hasPlayServices();
      const response = await GoogleSignin.signIn();

      const idToken = response.data?.idToken;
      if (!idToken) {
        return; // No token (e.g. cancelled) — not an error
      }

      await googleMutation.mutateAsync({ idToken });
    } catch (error: any) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        return; // User cancelled — not an error
      }
      throw error;
    }
  };

  const isPending = appleMutation.isPending || googleMutation.isPending;
  const error = appleMutation.error || googleMutation.error;

  return {
    signInWithApple,
    signInWithGoogle,
    isPending,
    error,
    isAppleSupported: Platform.OS === 'ios',
  };
}
