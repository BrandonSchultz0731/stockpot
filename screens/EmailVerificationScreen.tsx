import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import Button from '../components/Button';
import TextInputRow from '../components/TextInputRow';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfileQuery } from '../hooks/useUserProfileQuery';

export default function EmailVerificationScreen() {
  const { clearTokens } = useAuth();
  const { data: profile } = useUserProfileQuery();
  const queryClient = useQueryClient();

  const [code, setCode] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = code.length === 6 && !isPending;

  const handleVerify = async () => {
    setError(null);
    setIsPending(true);
    try {
      await api.post(ROUTES.AUTH.VERIFY_EMAIL, { code });
      await queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsPending(false);
    }
  };

  const handleResend = async () => {
    try {
      await api.post(ROUTES.AUTH.RESEND_VERIFICATION);
      setError(null);
    } catch {
      // best-effort
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-ivory">
      <View className="px-5 py-3">
        <Text className="text-[18px] font-bold text-espresso">
          Verify Your Email
        </Text>
      </View>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow">
          <Text className="text-[15px] text-stone leading-relaxed mt-2 mb-6">
            Enter the 6-digit code sent to {profile?.email}
          </Text>

          {error && (
            <View className="bg-berry-pale rounded-input px-4 py-3 mb-3">
              <Text className="text-sm text-berry">{error}</Text>
            </View>
          )}

          <TextInputRow
            placeholder="6-digit code"
            value={code}
            onChangeText={(text) => setCode(text.replace(/\D/g, '').slice(0, 6))}
            keyboardType="number-pad"
            variant="underline"
            className="mb-3"
          />

          <View className="mb-6" />

          <Button
            label={isPending ? 'Verifying...' : 'Verify'}
            onPress={handleVerify}
            disabled={!canSubmit}
            className="mb-4"
          />

          <Pressable
            onPress={handleResend}
            className="self-center mb-6"
            accessibilityRole="button"
            accessibilityLabel="Resend code">
            <Text className="text-xs font-semibold text-terra">
              Resend code
            </Text>
          </Pressable>

          <Pressable
            onPress={clearTokens}
            className="self-center"
            accessibilityRole="button"
            accessibilityLabel="Log out">
            <Text className="text-xs font-semibold text-stone">
              Log out
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
