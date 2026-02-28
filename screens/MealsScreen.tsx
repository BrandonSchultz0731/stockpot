import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { CalendarDays } from 'lucide-react-native';
import colors from '../theme/colors';
import { MealPlanStatus } from '../shared/enums';
import type { MealScheduleSlot } from '../shared/enums';
import type { MealsStackParamList } from '../navigation/types';
import { getCurrentWeekStartDate, getTodayDayOfWeek } from '../utils/dayOfWeek';

import { useCurrentMealPlanQuery } from '../hooks/useCurrentMealPlanQuery';
import { useUserProfileQuery } from '../hooks/useUserProfileQuery';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import {
  useGenerateMealPlanMutation,
  useSwapMealPlanEntryMutation,
} from '../hooks/useMealPlanMutations';
import { useShoppingListQuery } from '../hooks/useShoppingListQuery';
import {
  MEAL_TYPE_ORDER,
  formatWeekDateRange,
  getWeekDates,
  MealPlanHeader,
  WeekDateSubtitle,
  DaySelector,
  NutritionSummaryBar,
  MealCard,
  ShoppingListBanner,
  AddSnackButton,
  SaveTemplateButton,
} from './meals/MealPlanComponents';
import MealScheduleSelector from './meals/MealScheduleSelector';

export default function MealsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MealsStackParamList>>();

  // Data hooks
  const {
    data: mealPlan,
    isLoading: isPlanLoading,
    refetch,
  } = useCurrentMealPlanQuery();

  const weekStart = mealPlan?.weekStartDate ?? getCurrentWeekStartDate();

  const { data: userProfile } = useUserProfileQuery();
  const { isSaved, toggleSave } = useSavedRecipes();

  // Mutations
  const generateMutation = useGenerateMealPlanMutation();
  const swapMutation = useSwapMealPlanEntryMutation();

  // Shopping list
  const { data: shoppingList } = useShoppingListQuery(mealPlan?.id);

  // Local state
  const [selectedDay, setSelectedDay] = useState(getTodayDayOfWeek);
  const [swappingEntryId, setSwappingEntryId] = useState<string | null>(null);
  const [showScheduleSelector, setShowScheduleSelector] = useState(false);

  // Derived data
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const weekDateRangeLabel = useMemo(() => formatWeekDateRange(weekStart), [weekStart]);

  const selectedDayEntries = useMemo(() => {
    if (!mealPlan?.entries) return [];
    return mealPlan.entries
      .filter((e) => e.dayOfWeek === selectedDay)
      .sort((a, b) => (MEAL_TYPE_ORDER[a.mealType] ?? 99) - (MEAL_TYPE_ORDER[b.mealType] ?? 99));
  }, [mealPlan?.entries, selectedDay]);

  const nutritionTotals = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    for (const entry of selectedDayEntries) {
      const n = entry.recipe.nutrition;
      if (n) {
        totals.calories += n.calories ?? 0;
        totals.protein += n.protein ?? 0;
        totals.carbs += n.carbs ?? 0;
        totals.fat += n.fat ?? 0;
      }
    }
    return totals;
  }, [selectedDayEntries]);

  const nutritionTargets = useMemo(() => {
    const goals = userProfile?.nutritionalGoals;
    if (!goals) return null;
    return {
      calories: goals.dailyCalories,
      protein: goals.dailyProteinGrams,
      carbs: goals.dailyCarbsGrams,
      fat: goals.dailyFatGrams,
    };
  }, [userProfile?.nutritionalGoals]);

  // Polling for draft status
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (mealPlan?.status === MealPlanStatus.Draft) {
      pollRef.current = setInterval(() => {
        refetch();
      }, 10000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [mealPlan?.status, refetch]);

  // Handlers
  const handleOpenSelector = useCallback(() => {
    setShowScheduleSelector(true);
  }, []);

  const handleGenerate = useCallback(
    (schedule: MealScheduleSlot[], weekStartDate: string) => {
      setShowScheduleSelector(false);
      generateMutation.mutate({ weekStartDate, mealSchedule: schedule });
    },
    [generateMutation],
  );

  const handleSwap = useCallback(
    (entryId: string) => {
      setSwappingEntryId(entryId);
      swapMutation.mutate(
        { entryId },
        { onSettled: () => setSwappingEntryId(null) },
      );
    },
    [swapMutation],
  );

  const handleToggleSave = useCallback(
    (recipeId: string) => toggleSave(recipeId),
    [toggleSave],
  );

  const handleCartPress = useCallback(() => {
    if (mealPlan) {
      navigation.navigate('ShoppingList', {
        mealPlanId: mealPlan.id,
        weekStartDate: weekStart,
      });
    }
  }, [mealPlan, navigation, weekStart]);

  // Determine screen state
  const isGenerating =
    generateMutation.isPending || mealPlan?.status === MealPlanStatus.Draft;
  const isError = mealPlan?.status === MealPlanStatus.Error;
  const isActive = mealPlan?.status === MealPlanStatus.Active;
  const hasNoPlan = !isPlanLoading && mealPlan == null;

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isPlanLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator size="large" color={colors.orange.DEFAULT} />
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView className="flex-1" contentContainerClassName="pb-8">
        <MealPlanHeader
          onGenerate={handleOpenSelector}
          disabled={isGenerating}
          onCartPress={isActive ? handleCartPress : undefined}
          cartBadgeCount={shoppingList?.summary ? shoppingList.summary.toBuy + shoppingList.summary.low : undefined}
        />

        {/* ---- Empty state (no plan) ---- */}
        {hasNoPlan && !isGenerating && (
          <View className="flex-1 items-center justify-center px-8 pt-32">
            <CalendarDays size={48} color={colors.muted} />
            <Text className="mt-4 text-[18px] font-bold text-dark">
              No meal plan yet
            </Text>
            <Text className="mt-2 text-center text-[14px] text-muted">
              Tap Generate to create your weekly meal plan
            </Text>
          </View>
        )}

        {/* ---- Generating state ---- */}
        {isGenerating && (
          <>
            <WeekDateSubtitle label={weekDateRangeLabel} />
            <View className="items-center justify-center pt-32">
              <ActivityIndicator size="large" color={colors.orange.DEFAULT} />
              <Text className="mt-4 text-[14px] text-muted">
                Generating your meal plan...
              </Text>
            </View>
          </>
        )}

        {/* ---- Error state ---- */}
        {isError && !isGenerating && (
          <>
            <WeekDateSubtitle label={weekDateRangeLabel} />
            <View className="mx-4 mt-8 items-center rounded-2xl border border-danger bg-danger-pale p-6">
              <Text className="text-center text-[14px] text-dark">
                Something went wrong generating your meal plan.
              </Text>
              <Pressable onPress={handleOpenSelector} className="mt-3">
                <Text className="text-[14px] font-semibold text-orange">
                  Try Again
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ---- Active plan ---- */}
        {isActive && (
          <>
            <WeekDateSubtitle label={weekDateRangeLabel} />
            <DaySelector
              weekDates={weekDates}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              entries={mealPlan?.entries}
            />
            <NutritionSummaryBar
              totals={nutritionTotals}
              targets={nutritionTargets}
            />

            {selectedDayEntries.length === 0 ? (
              <View className="items-center pt-16">
                <Text className="text-[14px] text-muted">
                  No meals planned for this day
                </Text>
              </View>
            ) : (
              <View className="mt-1">
                {selectedDayEntries.map((entry) => (
                  <MealCard
                    key={entry.id}
                    entry={entry}
                    isSaved={isSaved(entry.recipe.id)}
                    isSwapping={swappingEntryId === entry.id}
                    onSwap={() => handleSwap(entry.id)}
                    onToggleSave={() => handleToggleSave(entry.recipe.id)}
                    onPress={() => navigation.navigate('RecipeDetail', { recipeId: entry.recipe.id, title: entry.recipe.title, entryId: entry.id, isCooked: entry.isCooked })}
                  />
                ))}
              </View>
            )}

            <AddSnackButton />

            {shoppingList && (
              <ShoppingListBanner
                toBuy={shoppingList.summary.toBuy}
                low={shoppingList.summary.low}
                alreadyHave={shoppingList.summary.alreadyHave}
                onPress={handleCartPress}
              />
            )}

            <SaveTemplateButton />
          </>
        )}
      </ScrollView>
      <MealScheduleSelector
        visible={showScheduleSelector}
        onClose={() => setShowScheduleSelector(false)}
        onGenerate={handleGenerate}
      />
    </SafeAreaView>
  );
}
