import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import colors from '../theme/colors';
import Button from '../components/Button';

interface Recipe {
  id: number;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
}

export default function HomeScreen() {
  const { clearTokens, refreshToken } = useAuth();

  const { data: recipes, isLoading, error } = useQuery({
    queryKey: QUERY_KEYS.RECIPES.SAVED,
    queryFn: () => api.get<Recipe[]>(ROUTES.RECIPES.SAVED),
  });

  const handleSignOut = async () => {
    try {
      await api.post(ROUTES.AUTH.LOGOUT, { refreshToken });
    } catch {
      // best-effort logout
    }
    await clearTokens();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={colors.navy.DEFAULT} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-white">
        <Text className="text-center text-base text-danger px-6">
          {error.message}
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-4 mb-4">
        <Text className="text-[28px] font-bold text-navy">
          StockPot Recipes
        </Text>
        <Button
          variant="outline"
          label="Sign Out"
          onPress={handleSignOut}
          className="px-3 py-1.5"
        />
      </View>
      <FlatList
        data={recipes}
        keyExtractor={item => String(item.id)}
        contentContainerClassName="px-4"
        renderItem={({ item }) => (
          <View className="bg-cream rounded-card p-4 mb-3">
            <Text className="text-lg font-semibold text-dark mb-1">
              {item.name}
            </Text>
            <Text className="text-sm text-body mb-2">{item.description}</Text>
            <Text className="text-xs text-muted">
              Prep: {item.prepTime}min | Cook: {item.cookTime}min
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}
