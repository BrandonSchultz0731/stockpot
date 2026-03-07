import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { MealPlanStatus, MealType } from '../shared/enums';
import type { MealScheduleSlot } from '../shared/enums';
import type { MealsStackParamList } from '../navigation/types';
import { getTodayDayOfWeek } from '../utils/dayOfWeek';
import { captureFromCamera, pickFromGallery } from '../utils/imageCapture';

import { getEatServings } from '../hooks/useCurrentMealPlanQuery';
import { useMealPlanListQuery } from '../hooks/useMealPlanListQuery';
import { useMealPlanByWeekQuery } from '../hooks/useMealPlanByWeekQuery';
import { useUserProfileQuery } from '../hooks/useUserProfileQuery';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import {
  useGenerateMealPlanMutation,
  useSwapMealPlanEntryMutation,
  useAddMealPlanEntryMutation,
  useAvailableLeftoversQuery,
  useAddLeftoverEntryMutation,
} from '../hooks/useMealPlanMutations';
import { useShoppingListQuery } from '../hooks/useShoppingListQuery';
import {
  MEAL_TYPE_ORDER,
  formatWeekDateRange,
  getWeekDates,
  MealPlanHeader,
  WeekNavigator,
  DaySelector,
  NutritionSummaryBar,
  MealCard,
  ShoppingListBanner,
  MealPlaceholder,
  SaveTemplateButton,
} from './meals/MealPlanComponents';
import MealScheduleSelector from './meals/MealScheduleSelector';
import AddMealActionSheet from './meals/AddMealActionSheet';

/** Find the plan whose week contains today (weekStartDate <= today <= weekStartDate + 6). */
function findCurrentWeekDate(planDates: string[]): string | null {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  for (const d of planDates) {
    const start = new Date(d + 'T00:00:00').getTime();
    const end = start + 6 * 24 * 60 * 60 * 1000;
    if (today >= start && today <= end) return d;
  }
  return null;
}

export default function MealsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MealsStackParamList>>();

  // Data hooks
  const { data: planList, isLoading: isListLoading } = useMealPlanListQuery();
  const [viewedWeekStartDate, setViewedWeekStartDate] = useState<string | null>(null);

  // Sorted plan dates (DESC — index 0 = newest)
  const sortedPlanDates = useMemo(
    () => (planList ?? []).map((p) => p.weekStartDate),
    [planList],
  );

  // Auto-select: find the plan that covers today, else null (shows empty state for current week)
  const effectiveWeekStartDate = useMemo(() => {
    if (viewedWeekStartDate != null) return viewedWeekStartDate;
    return findCurrentWeekDate(sortedPlanDates);
  }, [viewedWeekStartDate, sortedPlanDates]);

  const {
    data: mealPlan,
    isLoading: isPlanLoading,
    refetch,
  } = useMealPlanByWeekQuery(effectiveWeekStartDate);

  const weekStart = effectiveWeekStartDate;

  const { data: userProfile } = useUserProfileQuery();
  const { isSaved, toggleSave } = useSavedRecipes();

  // Mutations
  const generateMutation = useGenerateMealPlanMutation();
  const swapMutation = useSwapMealPlanEntryMutation();
  const addEntryMutation = useAddMealPlanEntryMutation();
  const addLeftoverMutation = useAddLeftoverEntryMutation();

  // Leftovers
  const { data: availableLeftovers } = useAvailableLeftoversQuery(mealPlan?.id);

  // Shopping list
  const { data: shoppingList } = useShoppingListQuery(mealPlan?.id);

  // Local state
  const [selectedDay, setSelectedDay] = useState(getTodayDayOfWeek);
  const [swappingEntryId, setSwappingEntryId] = useState<string | null>(null);
  const [showScheduleSelector, setShowScheduleSelector] = useState(false);
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [addSheetMealType, setAddSheetMealType] = useState<MealType>(MealType.Breakfast);
  const [loadingMealType, setLoadingMealType] = useState<MealType | null>(null);

  // Week navigation
  const viewedIndex = useMemo(
    () => (effectiveWeekStartDate ? sortedPlanDates.indexOf(effectiveWeekStartDate) : -1),
    [effectiveWeekStartDate, sortedPlanDates],
  );

  // hasNext = there's a newer plan (lower index). hasPrevious = there's an older plan (higher index).
  // Special case: if user is viewing current week with no plan (effectiveWeekStartDate is null),
  // still allow navigating to older plans.
  const hasNext = viewedIndex > 0;
  const hasPrevious = effectiveWeekStartDate == null
    ? sortedPlanDates.length > 0
    : viewedIndex >= 0 && viewedIndex < sortedPlanDates.length - 1;

  const handlePreviousWeek = useCallback(() => {
    if (effectiveWeekStartDate == null) {
      // Viewing current week with no plan — go to newest existing plan
      if (sortedPlanDates.length > 0) {
        setViewedWeekStartDate(sortedPlanDates[0]);
      }
    } else if (viewedIndex >= 0 && viewedIndex < sortedPlanDates.length - 1) {
      setViewedWeekStartDate(sortedPlanDates[viewedIndex + 1]);
    }
  }, [effectiveWeekStartDate, viewedIndex, sortedPlanDates]);

  const handleNextWeek = useCallback(() => {
    if (viewedIndex > 0) {
      setViewedWeekStartDate(sortedPlanDates[viewedIndex - 1]);
    }
  }, [viewedIndex, sortedPlanDates]);

  // Reset selectedDay when week changes
  useEffect(() => {
    if (!weekStart) return;
    const today = new Date();
    const todayDow = today.getDay();
    const start = new Date(weekStart + 'T00:00:00');
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    if (today >= start && today <= end) {
      setSelectedDay(todayDow);
    } else {
      setSelectedDay(start.getDay());
    }
  }, [weekStart]);

  // Derived data
  const weekDates = useMemo(() => (weekStart ? getWeekDates(weekStart) : []), [weekStart]);
  const weekDateRangeLabel = useMemo(
    () => (weekStart ? formatWeekDateRange(weekStart) : ''),
    [weekStart],
  );

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
        const s = getEatServings(entry);
        totals.calories += (n.calories ?? 0) * s;
        totals.protein += (n.protein ?? 0) * s;
        totals.carbs += (n.carbs ?? 0) * s;
        totals.fat += (n.fat ?? 0) * s;
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

  const ALL_MEAL_TYPES = [MealType.Breakfast, MealType.Lunch, MealType.Dinner, MealType.Snack] as const;

  const entriesByMealType = useMemo(() => {
    const map = new Map<MealType, typeof selectedDayEntries[number][]>();
    for (const entry of selectedDayEntries) {
      const list = map.get(entry.mealType) ?? [];
      list.push(entry);
      map.set(entry.mealType, list);
    }
    return map;
  }, [selectedDayEntries]);

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
      const doGenerate = () => {
        setShowScheduleSelector(false);
        generateMutation.mutate(
          { weekStartDate, mealSchedule: schedule },
          {
            onSuccess: () => {
              setViewedWeekStartDate(weekStartDate);
            },
          },
        );
      };

      // Check if a plan already exists for this target week
      const existingPlan = planList?.find((p) => p.weekStartDate === weekStartDate);
      if (existingPlan) {
        Alert.alert(
          'Replace Existing Plan?',
          `You already have a meal plan for the week of ${formatWeekDateRange(weekStartDate)}. Generating a new one will replace it.`,
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Replace', style: 'destructive', onPress: doGenerate },
          ],
        );
      } else {
        doGenerate();
      }
    },
    [generateMutation, planList],
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
    if (mealPlan && weekStart) {
      navigation.navigate('ShoppingList', {
        mealPlanId: mealPlan.id,
        weekStartDate: weekStart,
      });
    }
  }, [mealPlan, navigation, weekStart]);

  const handlePlaceholderPress = useCallback((mealType: MealType) => {
    setAddSheetMealType(mealType);
    setShowAddSheet(true);
  }, []);

  const handleAddMeal = useCallback(
    (url?: string) => {
      if (!mealPlan) return;
      const mealType = addSheetMealType;
      setShowAddSheet(false);
      setLoadingMealType(mealType);
      addEntryMutation.mutate(
        {
          mealPlanId: mealPlan.id,
          dayOfWeek: selectedDay,
          mealType,
          url,
        },
        { onSettled: () => setLoadingMealType(null) },
      );
    },
    [mealPlan, addSheetMealType, selectedDay, addEntryMutation],
  );

  const handleAddLeftover = useCallback(
    (sourceEntryId: string, servings: number) => {
      if (!mealPlan) return;
      addLeftoverMutation.mutate({
        mealPlanId: mealPlan.id,
        sourceEntryId,
        dayOfWeek: selectedDay,
        mealType: addSheetMealType,
        servings,
      });
    },
    [mealPlan, selectedDay, addSheetMealType, addLeftoverMutation],
  );

  const handlePhotoCapture = useCallback(
    (source: 'camera' | 'gallery') => {
      if (!mealPlan) return;
      const mealType = addSheetMealType;
      setShowAddSheet(false);

      setTimeout(async () => {
        const result =
          source === 'camera'
            ? await captureFromCamera()
            : await pickFromGallery();

        if (result) {
          setLoadingMealType(mealType);
          addEntryMutation.mutate(
            {
              mealPlanId: mealPlan.id,
              dayOfWeek: selectedDay,
              mealType,
              imageBase64: result.base64,
              mimeType: result.mimeType,
            },
            { onSettled: () => setLoadingMealType(null) },
          );
        }
      }, 500);
    },
    [mealPlan, addSheetMealType, selectedDay, addEntryMutation],
  );

  // Determine screen state
  const isGenerating =
    generateMutation.isPending || mealPlan?.status === MealPlanStatus.Draft;
  const isError = mealPlan?.status === MealPlanStatus.Error;
  const isActive = mealPlan?.status === MealPlanStatus.Active;
  const hasNoPlan = !isPlanLoading && !isListLoading && mealPlan == null;

  // Week navigator props shared across render branches
  const weekNavProps = {
    label: weekDateRangeLabel,
    onPrevious: handlePreviousWeek,
    onNext: handleNextWeek,
    hasPrevious,
    hasNext,
  };

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------
  if (isListLoading || isPlanLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 items-center justify-center bg-ivory">
        <ActivityIndicator size="large" color={colors.terra.DEFAULT} />
      </SafeAreaView>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
      <ScrollView className="flex-1" contentContainerClassName="pb-24">
        <MealPlanHeader
          onGenerate={handleOpenSelector}
          disabled={isGenerating}
          onCartPress={isActive ? handleCartPress : undefined}
          cartBadgeCount={shoppingList?.summary ? shoppingList.summary.toBuy + shoppingList.summary.low : undefined}
        />

        {/* ---- Empty state (no plan for this week) ---- */}
        {hasNoPlan && !isGenerating && (
          <>
            {sortedPlanDates.length > 0 && (
              <WeekNavigator {...weekNavProps} />
            )}
            <View className="flex-1 items-center justify-center px-8 pt-32">
              <CalendarDays size={48} color={colors.stone} />
              <Text className="mt-4 text-[18px] font-bold text-espresso">
                No meal plan yet
              </Text>
              <Text className="mt-2 text-center text-[14px] text-stone">
                Tap Generate to create your weekly meal plan
              </Text>
            </View>
          </>
        )}

        {/* ---- Generating state ---- */}
        {isGenerating && (
          <>
            <WeekNavigator {...weekNavProps} />
            <View className="items-center justify-center pt-32">
              <ActivityIndicator size="large" color={colors.terra.DEFAULT} />
              <Text className="mt-4 text-[14px] text-stone">
                Generating your meal plan...
              </Text>
            </View>
          </>
        )}

        {/* ---- Error state ---- */}
        {isError && !isGenerating && (
          <>
            <WeekNavigator {...weekNavProps} />
            <View className="mx-4 mt-8 items-center rounded-2xl border border-berry bg-berry-pale p-6">
              <Text className="text-center text-[14px] text-espresso">
                Something went wrong generating your meal plan.
              </Text>
              <Pressable onPress={handleOpenSelector} className="mt-3" accessibilityRole="button" accessibilityLabel="Try again">
                <Text className="text-[14px] font-semibold text-terra">
                  Try Again
                </Text>
              </Pressable>
            </View>
          </>
        )}

        {/* ---- Active plan ---- */}
        {isActive && (
          <>
            <WeekNavigator {...weekNavProps} />
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

            <View className="mt-1">
              {ALL_MEAL_TYPES.map((mealType) => {
                const entries = entriesByMealType.get(mealType) ?? [];
                return (
                  <View key={mealType}>
                    {entries.map((entry) => (
                      <MealCard
                        key={entry.id}
                        entry={entry}
                        isSaved={isSaved(entry.recipe.id)}
                        isSwapping={swappingEntryId === entry.id}
                        onSwap={() => handleSwap(entry.id)}
                        onToggleSave={() => handleToggleSave(entry.recipe.id)}
                        onPress={() =>
                          navigation.navigate('RecipeDetail', {
                            recipeId: entry.recipe.id,
                            title: entry.recipe.title,
                            entryId: entry.id,
                            isCooked: entry.isCooked,
                            isLeftover: !!entry.leftoverSourceEntryId,
                          })
                        }
                      />
                    ))}
                    {entries.length === 0 && (
                      <MealPlaceholder
                        mealType={mealType}
                        onPress={() => handlePlaceholderPress(mealType)}
                        isLoading={loadingMealType === mealType}
                      />
                    )}
                  </View>
                );
              })}
            </View>

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
        existingPlanWeekStarts={sortedPlanDates}
      />
      <AddMealActionSheet
        visible={showAddSheet}
        mealType={addSheetMealType}
        onClose={() => setShowAddSheet(false)}
        onAddMeal={handleAddMeal}
        onPhotoCapture={handlePhotoCapture}
        isLoading={addEntryMutation.isPending}
        availableLeftovers={availableLeftovers}
        onAddLeftover={handleAddLeftover}
      />
    </SafeAreaView>
  );
}
