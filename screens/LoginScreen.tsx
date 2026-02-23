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
import colors from '../theme/colors';
import Button from '../components/Button';
import TextInputRow from '../components/TextInputRow';
import Divider from '../components/Divider';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  return (
    <SafeAreaView className="flex-1 bg-cream">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          className="flex-1"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="flex-grow">
          {/* Hero */}
          <View className="items-center pt-10 pb-7 px-6">
            <Image
              source={require('../assets/app-icon.png')}
              className="w-16 h-16 rounded-[18px] mb-4"
            />
            <Text
              className="text-[28px] text-navy mb-1"
              style={{ fontWeight: '800', letterSpacing: -0.5 }}>
              StockPot
            </Text>
            <Text className="text-[13px] text-muted">
              Your AI-powered kitchen companion
            </Text>
          </View>

          {/* Form */}
          <View className="px-6 flex-1">
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

            <TextInputRow
              icon={Lock}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              className="mb-2"
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

            {/* Forgot password */}
            <Pressable className="self-end mb-5">
              <Text
                className="text-xs text-orange"
                style={{ fontWeight: '600' }}>
                Forgot password?
              </Text>
            </Pressable>

            <Button
              label="Log In"
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Home' }] })}
              className="mb-5"
            />

            <Divider className="mb-5" />

            <Button
              variant="outline"
              label="Continue with Google"
              className="mb-2.5"
            />

            <Button
              variant="dark"
              label="Continue with Apple"
              className="mb-2.5"
            />
          </View>

          {/* Footer */}
          <View className="py-4 px-6 items-center">
            <Text className="text-[13px] text-muted">
              Don't have an account?{' '}
              <Text
                className="text-orange"
                style={{ fontWeight: '700' }}
                onPress={() =>
                  navigation.navigate('SignUp')
                }>
                Sign Up
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
