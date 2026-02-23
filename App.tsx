import './global.css';

import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import API_BASE_URL from './config';

interface Recipe {
  id: number;
  name: string;
  description: string;
  prepTime: number;
  cookTime: number;
}

function App() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/recipes`)
      .then(res => {
        if (!res.ok) throw new Error(`Server error: ${res.status}`);
        return res.json();
      })
      .then(data => setRecipes(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#16213E" />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <Text className="text-center text-base text-danger px-6">{error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pt-[60px]">
      <Text className="text-[28px] font-bold text-center mb-4 text-navy">
        StockPot Recipes
      </Text>
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
    </View>
  );
}

export default App;
