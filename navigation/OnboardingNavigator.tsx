import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { OnboardingProvider } from '../contexts/OnboardingContext';
import OBWelcomeScreen from '../screens/onboarding/OBWelcomeScreen';
import OBDietScreen from '../screens/onboarding/OBDietScreen';
import OBExcludeScreen from '../screens/onboarding/OBExcludeScreen';
import OBHouseholdScreen from '../screens/onboarding/OBHouseholdScreen';
import OBGoalsScreen from '../screens/onboarding/OBGoalsScreen';
import type { OnboardingParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingParamList>();

export default function OnboardingNavigator() {
  return (
    <OnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="OBWelcome" component={OBWelcomeScreen} />
        <Stack.Screen name="OBDiet" component={OBDietScreen} />
        <Stack.Screen name="OBExclude" component={OBExcludeScreen} />
        <Stack.Screen name="OBHousehold" component={OBHouseholdScreen} />
        <Stack.Screen name="OBGoals" component={OBGoalsScreen} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
}
