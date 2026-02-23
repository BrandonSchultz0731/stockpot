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
import colors from '../theme/colors';
import Button from '../components/Button';
import TextInputRow from '../components/TextInputRow';
import Divider from '../components/Divider';
import { useRegisterMutation } from '../hooks/useRegisterMutation';

function getStrengthColors(password: string) {
  let score = 0;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return Array.from({ length: 4 }, (_, i) =>
    i < score ? colors.orange.DEFAULT : colors.border,
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
  const strengthColors = getStrengthColors(password);

  const displayError = validationError ?? error?.message ?? null;

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
    <SafeAreaView className="flex-1 bg-cream">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow">
          {/* Header */}
          <View className="items-center pt-10 pb-5 px-6">
            <Image
              source={require('../assets/app-icon.png')}
              className="w-[52px] h-[52px] rounded-[15px] mb-3.5"
            />
            <Text
              className="text-[24px] text-navy mb-1"
              style={{ fontWeight: '800', letterSpacing: -0.3 }}>
              Create Account
            </Text>
            <Text className="text-xs text-muted">
              Start your smarter kitchen journey
            </Text>
          </View>

          {/* Form */}
          <View className="px-6 flex-1">
            {displayError && (
              <View className="bg-danger-pale rounded-input px-4 py-3 mb-3">
                <Text className="text-sm text-danger">
                  {displayError}
                </Text>
              </View>
            )}

            {/* Name row — stays inline (unique side-by-side layout) */}
            <View className="flex-row gap-2.5 mb-3">
              <View className="flex-1 flex-row items-center bg-white rounded-input border border-border px-3.5 py-3 gap-2.5">
                <User size={18} color={colors.muted} />
                <TextInput
                  className="flex-1 text-sm text-dark p-0"
                  placeholder="First name"
                  placeholderTextColor={colors.muted}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCorrect={false}
                />
              </View>
              <View className="flex-1 flex-row items-center bg-white rounded-input border border-border px-3.5 py-3">
                <TextInput
                  className="flex-1 text-sm text-dark p-0"
                  placeholder="Last name"
                  placeholderTextColor={colors.muted}
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
                right={
                  <Pressable
                    onPress={() => setShowPassword(!showPassword)}
                    hitSlop={8}>
                    {showPassword ? (
                      <EyeOff size={18} color={colors.muted} />
                    ) : (
                      <Eye size={18} color={colors.muted} />
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
              <Text className="text-[10px] text-muted mt-1 ml-0.5">
                Must be at least 8 characters
              </Text>
            </View>

            <TextInputRow
              icon={Lock}
              placeholder="Confirm password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry={!showPassword}
              className="mb-4.5"
            />

            {/* Terms */}
            <Pressable
              className="flex-row items-start gap-2.5 mb-4.5"
              onPress={() => setAgreedToTerms(!agreedToTerms)}>
              <View
                className="w-5 h-5 rounded-[6px] items-center justify-center mt-0.5"
                style={{
                  borderWidth: 1.5,
                  borderColor: colors.orange.DEFAULT,
                  backgroundColor: agreedToTerms ? colors.orange.pale : 'transparent',
                }}>
                {agreedToTerms && <Check size={12} color={colors.orange.DEFAULT} />}
              </View>
              <Text className="text-[11px] text-muted flex-1 leading-4">
                I agree to the{' '}
                <Text className="text-orange" style={{ fontWeight: '600' }}>
                  Terms of Service
                </Text>{' '}
                and{' '}
                <Text className="text-orange" style={{ fontWeight: '600' }}>
                  Privacy Policy
                </Text>
              </Text>
            </Pressable>

            <Button
              label={isPending ? 'Creating account...' : 'Create Account'}
              onPress={handleRegister}
              disabled={isPending}
              className="mb-4"
            />

            <Divider className="mb-4" />

            {/* Social buttons (side by side) */}
            <View className="flex-row gap-2.5 mb-2.5">
              <Button
                variant="outline"
                label="Google"
                className="flex-1"
              />
              <Button
                variant="dark"
                label="Apple"
                className="flex-1"
              />
            </View>
          </View>

          {/* Footer */}
          <View className="py-3 px-6 pb-7 items-center">
            <Text className="text-[13px] text-muted">
              Already have an account?{' '}
              <Text
                className="text-orange"
                style={{ fontWeight: '700' }}
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
