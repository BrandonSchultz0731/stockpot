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
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Lock, Eye, EyeOff } from 'lucide-react-native';
import colors from '../theme/colors';
import ScreenHeader from '../components/ScreenHeader';
import Button from '../components/Button';
import TextInputRow from '../components/TextInputRow';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ResetPassword'>;
type Route = RouteProp<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { email } = route.params;

  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit =
    code.length === 6 && newPassword.length >= 8 && passwordsMatch;

  const handleReset = async () => {
    setError(null);
    setIsPending(true);
    try {
      await api.post(ROUTES.AUTH.RESET_PASSWORD, {
        token: code,
        newPassword,
      });
      setSuccess(true);
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
      await api.post(ROUTES.AUTH.FORGOT_PASSWORD, { email });
      setError(null);
    } catch {
      // best-effort
    }
  };

  if (success) {
    return (
      <SafeAreaView className="flex-1 bg-ivory">
        <View className="flex-1 justify-center px-6">
          <Text className="text-[22px] font-bold text-espresso text-center mb-3">
            Password Reset
          </Text>
          <Text className="text-[15px] text-stone text-center mb-8">
            Your password has been reset successfully. Please log in with your
            new password.
          </Text>
          <Button
            label="Back to Login"
            onPress={() => navigation.popToTop()}
          />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-ivory">
      <ScreenHeader title="Reset Password" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow">
          <Text className="text-[15px] text-stone leading-relaxed mt-2 mb-6">
            Enter the 6-digit code sent to {email} and your new password.
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

          <TextInputRow
            icon={Lock}
            placeholder="New password"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry={!showPassword}
            variant="underline"
            className="mb-3"
            right={
              <Pressable
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Toggle password visibility">
                {showPassword ? (
                  <EyeOff size={18} color={colors.stone} />
                ) : (
                  <Eye size={18} color={colors.stone} />
                )}
              </Pressable>
            }
          />

          <TextInputRow
            icon={Lock}
            placeholder="Confirm new password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            variant="underline"
            className="mb-2"
          />

          {confirmPassword.length > 0 && !passwordsMatch && (
            <Text className="text-xs text-berry mb-4">
              Passwords do not match
            </Text>
          )}

          <View className="mb-6" />

          <Button
            label={isPending ? 'Resetting...' : 'Reset Password'}
            onPress={handleReset}
            disabled={isPending || !canSubmit}
            className="mb-4"
          />

          <Pressable onPress={handleResend} className="self-center" accessibilityRole="button" accessibilityLabel="Resend code">
            <Text className="text-xs font-semibold text-terra">
              Resend code
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
