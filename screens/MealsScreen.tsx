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
import {
  Bookmark,
  CalendarDays,
  Check,
  Heart,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react-native';
import colors from '../theme/colors';
import { MealType, MealPlanStatus } from '../shared/enums';
import type { MealsStackParamList } from '../navigation/types';
import { getCurrentWeekStartDate, getTodayDayOfWeek } from '../utils/dayOfWeek';
import {
  useCurrentMealPlanQuery,
  type MealPlanEntry,
} from '../hooks/useCurrentMealPlanQuery';
import { useUserProfileQuery } from '../hooks/useUserProfileQuery';
import { useSavedRecipes } from '../hooks/useSavedRecipes';
import {
  useGenerateMealPlanMutation,
  useSwapMealPlanEntryMutation,
} from '../hooks/useMealPlanMutations';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

const MEAL_TYPE_ORDER: Record<string, number> = {
  [MealType.Breakfast]: 0,
  [MealType.Lunch]: 1,
  [MealType.Dinner]: 2,
  [MealType.Snack]: 3,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatWeekDateRange(weekStartDate: string): string {
  const monday = new Date(weekStartDate + 'T00:00:00');
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const fmt = (d: Date) => {
    const month = d.toLocaleDateString('en-US', { month: 'short' });
    return `${month} ${d.getDate()}`;
  };

  return `${fmt(monday)} – ${fmt(sunday)}, ${sunday.getFullYear()}`;
}

function formatCalories(n: number): string {
  return n >= 1000 ? n.toLocaleString('en-US') : String(n);
}

function getWeekDates(weekStartDate: string) {
  const monday = new Date(weekStartDate + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return {
      dayLabel: DAY_LABELS[i],
      dateNumber: d.getDate(),
      dayOfWeek: i,
    };
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function MealPlanHeader({
  onGenerate,
  disabled,
}: {
  onGenerate: () => void;
  disabled: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-4">
      <Text className="text-[26px] font-extrabold tracking-[-0.5px] text-navy">
        Meal Plan
      </Text>
      <Pressable
        onPress={onGenerate}
        disabled={disabled}
        className={`flex-row items-center rounded-[10px] bg-orange px-3.5 py-2 ${
          disabled ? 'opacity-50' : ''
        }`}
      >
        <Zap size={14} color="#fff" fill="#fff" />
        <Text className="ml-1.5 text-xs font-bold text-white">
          Generate
        </Text>
      </Pressable>
    </View>
  );
}

function WeekDateSubtitle({ label }: { label: string }) {
  return (
    <Text className="mt-1 px-5 text-[13px] text-muted">{label}</Text>
  );
}

function DaySelector({
  weekDates,
  selectedDay,
  onSelectDay,
}: {
  weekDates: ReturnType<typeof getWeekDates>;
  selectedDay: number;
  onSelectDay: (day: number) => void;
}) {
  return (
    <View className="flex-row justify-between px-5 py-3">
      {weekDates.map((d) => {
        const active = d.dayOfWeek === selectedDay;
        return (
          <Pressable
            key={d.dayOfWeek}
            onPress={() => onSelectDay(d.dayOfWeek)}
            className={`h-14 w-10 items-center justify-center rounded-[14px] ${
              active ? 'bg-orange' : 'bg-white'
            }`}
          >
            <Text
              className={`text-[10px] font-semibold ${
                active ? 'text-white/70' : 'text-muted'
              }`}
            >
              {d.dayLabel}
            </Text>
            <Text
              className={`mt-1 text-[16px] font-bold ${
                active ? 'text-white' : 'text-dark'
              }`}
            >
              {d.dateNumber}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function NutritionSummaryBar({
  totals,
  targets,
}: {
  totals: { calories: number; protein: number; carbs: number; fat: number };
  targets?: { calories: number; protein: number; carbs: number; fat: number } | null;
}) {
  const items = [
    { label: 'Calories', value: formatCalories(totals.calories), target: targets ? `/ ${formatCalories(targets.calories)}` : null },
    { label: 'Protein', value: `${totals.protein}g`, target: targets ? `/ ${targets.protein}g` : null },
    { label: 'Carbs', value: `${totals.carbs}g`, target: targets ? `/ ${targets.carbs}g` : null },
    { label: 'Fat', value: `${totals.fat}g`, target: targets ? `/ ${targets.fat}g` : null },
  ];

  return (
    <View className="mx-4 my-3 flex-row justify-around rounded-[14px] border border-border bg-white px-4 py-3">
      {items.map((n) => (
        <View key={n.label} className="items-center">
          <Text className="text-[15px] font-bold text-dark">
            {n.value}
            {n.target && (
              <Text className="text-[10px] font-normal text-muted">
                {' '}{n.target}
              </Text>
            )}
          </Text>
          <Text className="mt-0.5 text-[10px] text-muted">{n.label}</Text>
        </View>
      ))}
    </View>
  );
}

function MealCard({
  entry,
  isSaved,
  isSwapping,
  onSwap,
  onToggleSave,
  onPress,
}: {
  entry: MealPlanEntry;
  isSaved: boolean;
  isSwapping: boolean;
  onSwap: () => void;
  onToggleSave: () => void;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="mx-4 mb-2.5 overflow-hidden rounded-2xl border border-border bg-white">
      {/* Top row: content + favorite */}
      <View className="flex-row items-start p-3.5 pb-2.5">
        <View className="flex-1">
          <View className="flex-row items-center">
            <Text className="text-[11px] font-bold uppercase tracking-[0.5px] text-orange">
              {entry.mealType}
            </Text>
            {entry.isCooked && (
              <View className="ml-2 flex-row items-center rounded-md bg-success-pale px-1.5 py-0.5">
                <Check size={10} color={colors.success.DEFAULT} />
                <Text className="ml-0.5 text-[10px] font-semibold text-success">Cooked</Text>
              </View>
            )}
          </View>
          <Text
            className="mt-1 text-[15px] font-semibold text-dark"
            numberOfLines={1}
          >
            {entry.recipe.title}
          </Text>
          <Text className="mt-0.5 text-[12px] text-muted">
            {entry.recipe.nutrition?.calories ?? 0} cal
          </Text>
        </View>
        <Pressable
          onPress={onToggleSave}
          hitSlop={10}
          className="ml-3 mt-0.5 h-8 w-8 items-center justify-center rounded-full bg-cream"
        >
          <Heart
            size={16}
            color={isSaved ? colors.orange.DEFAULT : colors.muted}
            fill={isSaved ? colors.orange.DEFAULT : 'none'}
          />
        </Pressable>
      </View>

      {/* Bottom action bar */}
      <View className="flex-row items-center border-t border-border px-3.5 py-2">
        <Pressable
          onPress={onSwap}
          disabled={isSwapping}
          hitSlop={6}
          className="flex-row items-center rounded-lg bg-cream px-2.5 py-1.5"
        >
          {isSwapping ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : (
            <>
              <RefreshCw size={13} color={colors.muted} />
              <Text className="ml-1.5 text-[12px] font-semibold text-muted">Swap</Text>
            </>
          )}
        </Pressable>
      </View>
    </Pressable>
  );
}

function AddSnackButton() {
  return (
    <View className="mx-4 mb-4 flex-row items-center justify-center rounded-[14px] border-2 border-dashed border-border py-3.5 opacity-50">
      <Plus size={16} color={colors.muted} />
      <Text className="ml-2 text-[13px] font-semibold text-muted">
        Add Snack
      </Text>
    </View>
  );
}

function SaveTemplateButton() {
  return (
    <View className="mx-4 mb-5 flex-row items-center justify-center rounded-[14px] border border-navy py-3 opacity-50">
      <Bookmark size={16} color={colors.navy.DEFAULT} />
      <Text className="ml-2 text-[13px] font-semibold text-navy">
        Save as Template
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function MealsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<MealsStackParamList>>();
  const weekStart = getCurrentWeekStartDate();

  // Data hooks
  const {
    data: mealPlan,
    isLoading: isPlanLoading,
    refetch,
  } = useCurrentMealPlanQuery();

  const { data: userProfile } = useUserProfileQuery();
  const { isSaved, toggleSave } = useSavedRecipes();

  // Mutations
  const generateMutation = useGenerateMealPlanMutation();
  const swapMutation = useSwapMealPlanEntryMutation();

  // Local state
  const [selectedDay, setSelectedDay] = useState(getTodayDayOfWeek);
  const [swappingEntryId, setSwappingEntryId] = useState<string | null>(null);

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
      }, 3000);
    }
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [mealPlan?.status, refetch]);

  // Handlers
  const handleGenerate = useCallback(() => {
    generateMutation.mutate({ weekStartDate: weekStart });
  }, [generateMutation, weekStart]);

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
        <MealPlanHeader onGenerate={handleGenerate} disabled={isGenerating} />

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
              <Pressable onPress={handleGenerate} className="mt-3">
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
            <SaveTemplateButton />
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
