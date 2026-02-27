import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import BootSplash from 'react-native-bootsplash';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfileQuery } from '../hooks/useUserProfileQuery';
import LoginScreen from '../screens/LoginScreen';
import SignUpScreen from '../screens/SignUpScreen';
import OnboardingNavigator from './OnboardingNavigator';
import TabNavigator from './TabNavigator';
import colors from '../theme/colors';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { isLoading, isAuthenticated } = useAuth();
  const { data: profile, isLoading: isProfileLoading } = useUserProfileQuery();

  useEffect(() => {
    if (!isLoading) {
      BootSplash.hide({ fade: true });
    }
  }, [isLoading]);

  if (isLoading || (isAuthenticated && isProfileLoading)) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.navy.DEFAULT} />
      </View>
    );
  }

  return (
    <NavigationContainer onReady={() => BootSplash.hide({ fade: true })}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        ) : !profile?.onboardingComplete ? (
          <Stack.Screen name="Onboarding" component={OnboardingNavigator} />
        ) : (
          <Stack.Screen name="MainTabs" component={TabNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
