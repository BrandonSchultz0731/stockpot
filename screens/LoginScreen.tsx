import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';
import Button from '../components/Button';
import TextInputRow from '../components/TextInputRow';
import Divider from '../components/Divider';
import { useLoginMutation } from '../hooks/useLoginMutation';
import { useSocialAuth } from '../hooks/useSocialAuth';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { mutateAsync, isPending, error } = useLoginMutation();
  const {
    signInWithApple,
    signInWithGoogle,
    isPending: isSocialPending,
    error: socialError,
    isAppleSupported,
  } = useSocialAuth();

  const anyPending = isPending || isSocialPending;
  const displayError = error || socialError;

  const handleLogin = async () => {
    try {
      await mutateAsync({ email, password });
    } catch {
      // error is captured by mutation state
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-ivory">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow">
          {/* Hero */}
          <LinearGradient colors={colors.gradient.warmHeader}>
            <View className="items-center pt-10 pb-7 px-6">
              <View
                className="mb-4"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                }}
              >
                <Image
                  source={require('../assets/app-icon.png')}
                  className="w-16 h-16"
                  style={{ borderRadius: 20 }}
                />
              </View>
              <Text
                className="text-[32px] tracking-[-0.5px] text-espresso mb-1"
                style={{ fontFamily: fonts.serif }}>
                ChefPixel
              </Text>
              <Text className="text-[13px] text-stone">
                Your AI-powered kitchen companion
              </Text>
            </View>
          </LinearGradient>

          {/* Form */}
          <View className="px-6 flex-1">
            {displayError && (
              <View className="bg-berry-pale rounded-input px-4 py-3 mb-3">
                <Text className="text-sm text-berry">
                  {displayError.message}
                </Text>
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
              className="mb-3"
            />

            <TextInputRow
              icon={Lock}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              variant="underline"
              className="mb-2"
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

            {/* Forgot password */}
            <Pressable
              className="self-end mb-5"
              onPress={() => navigation.navigate('ForgotPassword')}
              accessibilityRole="link"
              accessibilityLabel="Forgot password">
              <Text className="text-xs font-semibold text-terra">
                Forgot password?
              </Text>
            </Pressable>

            <Button
              label={isPending ? 'Logging in...' : 'Log In'}
              onPress={handleLogin}
              disabled={anyPending || !email || !password}
              className="mb-5"
            />

            <Divider className="mb-5" />

            <Button
              variant="outline"
              label="Continue with Google"
              onPress={() => signInWithGoogle().catch(() => {})}
              disabled={anyPending}
              className="mb-2.5"
            />

            {isAppleSupported && (
              <Button
                variant="dark"
                label="Continue with Apple"
                onPress={() => signInWithApple().catch(() => {})}
                disabled={anyPending}
                className="mb-2.5"
              />
            )}
          </View>

          {/* Footer */}
          <View className="py-4 px-6 items-center">
            <Text className="text-[13px] text-stone">
              Don't have an account?{' '}
              <Text
                className="font-bold text-terra"
                onPress={() =>
                  navigation.navigate('SignUp')
                }
                accessibilityRole="link"
                accessibilityLabel="Sign up">
                Sign Up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
