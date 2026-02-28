import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AIChefScreen from '../screens/AIChefScreen';
import RecipeDetailScreen from '../screens/meals/RecipeDetailScreen';
import type { AIChefStackParamList } from './types';

const Stack = createNativeStackNavigator<AIChefStackParamList>();

export default function AIChefStackNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AIChefChat" component={AIChefScreen} />
      <Stack.Screen name="RecipeDetail" component={RecipeDetailScreen} />
    </Stack.Navigator>
  );
}
