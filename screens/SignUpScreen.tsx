import { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Mail, Lock, Eye, EyeOff, User, Check } from 'lucide-react-native';
import LinearGradient from 'react-native-linear-gradient';
import colors from '../theme/colors';
import { fonts } from '../theme/typography';
import Button from '../components/Button';
import TextInputRow from '../components/TextInputRow';
import Divider from '../components/Divider';
import { useRegisterMutation } from '../hooks/useRegisterMutation';
import { useSocialAuth } from '../hooks/useSocialAuth';

function getStrengthColors(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Array.from({ length: 4 }, (_, i) =>
    i < score ? colors.terra.DEFAULT : colors.line.DEFAULT,
  );
}

export default function SignUpScreen() {
  const navigation = useNavigation();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { mutateAsync, isPending, error } = useRegisterMutation();
  const {
    signInWithApple,
    signInWithGoogle,
    isPending: isSocialPending,
    error: socialError,
    isAppleSupported,
  } = useSocialAuth();

  const anyPending = isPending || isSocialPending;
  const strengthColors = getStrengthColors(password);

  const displayError =
    validationError ?? error?.message ?? socialError?.message ?? null;

  const handleRegister = async () => {
    setValidationError(null);

    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return;
    }
    if (password !== confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }
    if (!agreedToTerms) {
      setValidationError('You must agree to the Terms of Service');
      return;
    }

    try {
      await mutateAsync({
        email,
        password,
        firstName,
        ...(lastName ? { lastName } : {}),
      });
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
          {/* Header */}
          <LinearGradient colors={colors.gradient.warmHeader}>
            <View className="items-center pt-10 pb-5 px-6">
              <View
                className="mb-3.5"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 6,
                }}
              >
                <Image
                  source={require('../assets/app-icon.png')}
                  className="w-[52px] h-[52px]"
                  style={{ borderRadius: 20 }}
                />
              </View>
              <Text
                className="text-[24px] tracking-[-0.3px] text-espresso mb-1"
                style={{ fontFamily: fonts.serif }}>
                Create Account
              </Text>
              <Text className="text-xs text-stone">
                Start your smarter kitchen journey
              </Text>
            </View>
          </LinearGradient>

          {/* Form */}
          <View className="px-6 flex-1">
            {displayError && (
              <View className="bg-berry-pale rounded-input px-4 py-3 mb-3">
                <Text className="text-sm text-berry">
                  {displayError}
                </Text>
              </View>
            )}

            {/* Name row -- side-by-side with updated tokens */}
            <View className="flex-row gap-2.5 mb-3">
              <View className="flex-1 flex-row items-center border-b border-line bg-transparent px-1 py-3 gap-2.5">
                <User size={18} color={colors.stone} />
                <TextInput
                  className="flex-1 text-sm text-espresso p-0"
                  placeholder="First name"
                  placeholderTextColor={colors.stone}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCorrect={false}
                />
              </View>
              <View className="flex-1 flex-row items-center border-b border-line bg-transparent px-1 py-3">
                <TextInput
                  className="flex-1 text-sm text-espresso p-0"
                  placeholder="Last name"
                  placeholderTextColor={colors.stone}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCorrect={false}
                />
              </View>
            </View>

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

            {/* Password with strength indicator */}
            <View className="mb-3">
              <TextInputRow
                icon={Lock}
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                variant="underline"
                right={
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}>
                    {showPassword ? (
                      <EyeOff size={18} color={colors.stone} />
                    ) : (
                      <Eye size={18} color={colors.stone} />
                    )}
                  </Pressable>
                }
              />
              {/* Strength indicator */}
              <View className="flex-row gap-1 mt-2 px-0.5">
                {strengthColors.map((color, i) => (
                  <View
                    key={i}
                    className="flex-1 h-[3px] rounded-sm"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </View>
              <Text className="text-[10px] text-stone mt-1 ml-0.5">
                Must be at least 8 characters
              </Text>
            </View>

            <TextInputRow
              icon={Lock}
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              variant="underline"
              className="mb-4.5"
            />

            {/* Terms */}
            <Pressable
              className="flex-row items-start gap-2.5 mb-4.5"
              onPress={() => setAgreedToTerms(!agreedToTerms)}>
              <View
                className={`w-5 h-5 rounded-[6px] items-center justify-center mt-0.5 border-[1.5px] border-terra ${agreedToTerms ? 'bg-terra-pale' : 'bg-transparent'}`}>
                {agreedToTerms && <Check size={12} color={colors.terra.DEFAULT} />}
              </View>
              <Text className="text-[11px] text-stone flex-1 leading-4">
                I agree to the{' '}
                <Text className="font-semibold text-terra">
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text className="font-semibold text-terra">
                  Privacy Policy
                </Text>
              </Text>
            </Pressable>

            <Button
              label={isPending ? 'Creating account...' : 'Create Account'}
              onPress={handleRegister}
              disabled={anyPending}
              className="mb-4"
            />

            <Divider className="mb-4" />

            {/* Social buttons (side by side) */}
            <View className="flex-row gap-2.5 mb-2.5">
              <Button
                variant="outline"
                label="Google"
                onPress={() => signInWithGoogle().catch(() => {})}
                disabled={anyPending}
                className="flex-1"
              />
              {isAppleSupported && (
                <Button
                  variant="dark"
                  label="Apple"
                  onPress={() => signInWithApple().catch(() => {})}
                  disabled={anyPending}
                  className="flex-1"
                />
              )}
            </View>
          </View>

          {/* Footer */}
          <View className="py-3 px-6 pb-7 items-center">
            <Text className="text-[13px] text-stone">
              Already have an account?{' '}
              <Text
                className="font-bold text-terra"
                onPress={() => navigation.goBack()}>
                Log In
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
