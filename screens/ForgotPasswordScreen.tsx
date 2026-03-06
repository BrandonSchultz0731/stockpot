import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mail } from 'lucide-react-native';
import ScreenHeader from '../components/ScreenHeader';
import Button from '../components/Button';
import TextInputRow from '../components/TextInputRow';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList, 'ForgotPassword'>;

export default function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    setError(null);
    setIsPending(true);
    try {
      await api.post(ROUTES.AUTH.FORGOT_PASSWORD, { email });
      navigation.navigate('ResetPassword', { email });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : 'Something went wrong';
      setError(message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-ivory">
      <ScreenHeader title="Forgot Password" />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          className="flex-1 px-6"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow">
          <Text className="text-[15px] text-stone leading-relaxed mt-2 mb-6">
            Enter the email address associated with your account and we'll send
            you a code to reset your password.
          </Text>

          {error && (
            <View className="bg-berry-pale rounded-input px-4 py-3 mb-3">
              <Text className="text-sm text-berry">{error}</Text>
            </View>
          )}

          <TextInputRow
            icon={Mail}
            placeholder="Email address"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            variant="underline"
            className="mb-6"
          />

          <Button
            label={isPending ? 'Sending...' : 'Send Reset Code'}
            onPress={handleSubmit}
            disabled={isPending || !email}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
