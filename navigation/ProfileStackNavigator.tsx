import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ProfileScreen from '../screens/ProfileScreen';
import EditDietaryProfileScreen from '../screens/profile/EditDietaryProfileScreen';
import EditNutritionGoalsScreen from '../screens/profile/EditNutritionGoalsScreen';
import SavedRecipesScreen from '../screens/profile/SavedRecipesScreen';
import RecipeDetailScreen from '../screens/meals/RecipeDetailScreen';
import type { ProfileStackParamList } from './types';

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export default function ProfileStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileScreen} />
      <Stack.Screen name="EditDietaryProfile" component={EditDietaryProfileScreen} />
      <Stack.Screen name="EditNutritionGoals" component={EditNutritionGoalsScreen} />
      <Stack.Screen name="SavedRecipes" component={SavedRecipesScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    </Stack.Navigator>
  );
}
