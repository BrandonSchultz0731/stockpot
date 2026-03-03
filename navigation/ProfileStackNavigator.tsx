import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import EditDietaryProfileScreen from '../screens/profile/EditDietaryProfileScreen';
import EditNutritionGoalsScreen from '../screens/profile/EditNutritionGoalsScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="EditDietaryProfile" component={EditDietaryProfileScreen} />
      <Stack.Screen name="EditNutritionGoals" component={EditNutritionGoalsScreen} />
    </Stack.Navigator>
  );
}
