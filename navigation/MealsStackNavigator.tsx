import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MealsScreen from '../screens/MealsScreen';
import RecipeDetailScreen from '../screens/meals/RecipeDetailScreen';
import CookedReviewScreen from '../screens/meals/CookedReviewScreen';
import type { MealsStackParamList } from './types';

const Stack = createNativeStackNavigator<MealsStackParamList>();

export default function MealsStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MealsList" component={MealsScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
      <Stack.Screen name="CookedReview" component={CookedReviewScreen} />
    </Stack.Navigator>
  );
}
