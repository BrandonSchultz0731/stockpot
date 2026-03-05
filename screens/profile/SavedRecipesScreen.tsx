import { useState, useCallback, useMemo } from 'react';
import {
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Heart, Search } from 'lucide-react-native';
import ScreenHeader from '../../components/ScreenHeader';
import EmptyState from '../../components/EmptyState';
import LoadingScreen from '../../components/LoadingScreen';
import TextInputRow from '../../components/TextInputRow';
import AppText from '../../components/AppText';
import { useSavedRecipes, type SavedRecipeItem } from '../../hooks/useSavedRecipes';
import { MealType } from '../../shared/enums';
import colors from '../../theme/colors';
import { cardShadow } from '../../theme/shadows';
import type { ProfileStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'SavedRecipes'>;

const MEAL_TYPE_FILTERS: Array<{ label: string; value: MealType | null }> = [
  { label: 'All', value: null },
  { label: 'Breakfast', value: MealType.Breakfast },
  { label: 'Lunch', value: MealType.Lunch },
  { label: 'Dinner', value: MealType.Dinner },
  { label: 'Snack', value: MealType.Snack },
];

function SavedRecipeRow({
  item,
  onPress,
  showBorder,
}: {
  item: SavedRecipeItem;
  onPress: () => void;
  showBorder: boolean;
}) {
  const { recipe } = item;
  const initial = recipe.title[0].toUpperCase();

  const subtitle = [
    recipe.nutrition?.calories ? `${Math.round(recipe.nutrition.calories)} cal` : null,
    recipe.totalTimeMinutes ? `${recipe.totalTimeMinutes} min` : null,
    recipe.cuisine || null,
  ]
    .filter(Boolean)
    .join(' \u00B7 ');

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3.5 py-3.5 ${showBorder ? 'border-b border-line' : ''}`}
    >
      {/* Initial circle */}
      <View className="items-center justify-center bg-cream w-[46px] h-[46px] rounded-[14px] shrink-0">
        <AppText font="sansBold" className="text-[16px] text-stone">
          {initial}
        </AppText>
      </View>

      {/* Title + subtitle */}
      <View className="flex-1">
        <AppText
          font="sansSemiBold"
          className="text-[15px] text-espresso"
          numberOfLines={1}
        >
          {recipe.title}
        </AppText>
        {subtitle ? (
          <AppText className="mt-0.5 text-[12px] text-stone" numberOfLines={1}>
            {subtitle}
          </AppText>
        ) : null}
      </View>

      {/* Heart icon */}
      <Heart size={18} color={colors.terra.DEFAULT} fill={colors.terra.DEFAULT} />
    </Pressable>
  );
}

export default function SavedRecipesScreen() {
  const navigation = useNavigation<Nav>();
  const { savedRecipes, isLoading, refetch, isRefetching } = useSavedRecipes();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<MealType | null>(null);

  const filtered = useMemo(() => {
    if (!savedRecipes) return [];
    let result = savedRecipes;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(item =>
        item.recipe.title.toLowerCase().includes(q),
      );
    }

    if (selectedFilter) {
      result = result.filter(
        item => item.recipe.mealType === selectedFilter,
      );
    }

    return result;
  }, [savedRecipes, search, selectedFilter]);

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const clearFilters = useCallback(() => {
    setSearch('');
    setSelectedFilter(null);
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: SavedRecipeItem; index: number }) => (
      <SavedRecipeRow
        item={item}
        showBorder={index < filtered.length - 1}
        onPress={() =>
          navigation.navigate('RecipeDetail', {
            recipeId: item.recipeId,
            title: item.recipe.title,
          })
        }
      />
    ),
    [navigation, filtered.length],
  );

  if (isLoading) {
    return <LoadingScreen color={colors.terra.DEFAULT} />;
  }

  const hasItems = (savedRecipes?.length ?? 0) > 0;
  const showNoMatchEmpty = hasItems && filtered.length === 0;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
      <ScreenHeader title="Saved Recipes" />

      <View className="px-6">
        {/* Search */}
        <View className="bg-white rounded-[16px]" style={cardShadow}>
          <TextInputRow
            icon={Search}
            placeholder="Search saved recipes..."
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Meal type filters */}
        <View className="flex-row gap-2 mt-3.5 mb-2">
          {MEAL_TYPE_FILTERS.map(f => {
            const isActive = selectedFilter === f.value;
            return (
              <Pressable
                key={f.label}
                onPress={() => setSelectedFilter(f.value)}
                className={`items-center justify-center py-2 px-4 rounded-full ${isActive ? 'bg-espresso' : 'bg-white'}`}
                style={!isActive ? cardShadow : undefined}
              >
                <AppText
                  font="sansSemiBold"
                  className={`text-[13px] ${isActive ? 'text-white' : 'text-stone'}`}
                >
                  {f.label}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Recipe list */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        contentContainerClassName="px-6 pt-2 pb-28"
        renderItem={renderItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            tintColor={colors.terra.DEFAULT}
          />
        }
        ListEmptyComponent={
          showNoMatchEmpty ? (
            <EmptyState
              icon={<Search size={48} color={colors.stone} />}
              title="No matching recipes"
              actionLabel="Clear filters"
              onAction={clearFilters}
            />
          ) : (
            <EmptyState
              icon={<Heart size={48} color={colors.stone} />}
              title="No saved recipes yet"
              description="Save recipes from your meal plan or AI Chef to find them here."
            />
          )
        }
      />
    </SafeAreaView>
  );
}
