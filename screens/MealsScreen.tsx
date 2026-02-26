import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import {
  Bookmark,
  CalendarDays,
  Heart,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react-native';
import colors from '../theme/colors';
import { QUERY_KEYS } from '../services/queryKeys';
import { ROUTES } from '../services/routes';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MealType, MealPlanStatus } from '../shared/enums';
import { getCurrentWeekStartDate, getTodayDayOfWeek } from '../utils/dayOfWeek';
import {
  useCurrentMealPlanQuery,
  type MealPlanEntry,
} from '../hooks/useCurrentMealPlanQuery';
import { useUserProfileQuery } from '../hooks/useUserProfileQuery';
import {
  useGenerateMealPlanMutation,
  useSwapMealPlanEntryMutation,
  useSaveRecipeMutation,
  useUnsaveRecipeMutation,
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

interface SavedRecipeItem {
  recipeId: string;
}

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
      <Text
        className="text-navy"
        style={{ fontSize: 26, fontWeight: '800', letterSpacing: -0.5 }}
      >
        Meal Plan
      </Text>
      <Pressable
        onPress={onGenerate}
        disabled={disabled}
        className="flex-row items-center rounded-[10px] bg-orange px-3.5 py-2"
        style={disabled ? { opacity: 0.5 } : undefined}
      >
        <Zap size={14} color="#fff" fill="#fff" />
        <Text className="ml-1.5 text-xs text-white" style={{ fontWeight: '700' }}>
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
              className={`text-[10px] ${
                active ? 'text-white/70' : 'text-muted'
              }`}
              style={{ fontWeight: '600' }}
            >
              {d.dayLabel}
            </Text>
            <Text
              className={`mt-1 text-[16px] ${
                active ? 'text-white' : 'text-dark'
              }`}
              style={{ fontWeight: '700' }}
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
          <Text className="text-[15px] text-dark" style={{ fontWeight: '700' }}>
            {n.value}
            {n.target && (
              <Text className="text-[10px] text-muted" style={{ fontWeight: '400' }}>
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
}: {
  entry: MealPlanEntry;
  isSaved: boolean;
  isSwapping: boolean;
  onSwap: () => void;
  onToggleSave: () => void;
}) {
  return (
    <View className="mx-4 mb-2.5 flex-row items-center rounded-2xl border border-border bg-white p-3.5">
      <View className="flex-1">
        <Text
          className="text-[11px] text-orange"
          style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}
        >
          {entry.mealType}
        </Text>
        <Text
          className="mt-0.5 text-[15px] text-dark"
          numberOfLines={1}
          style={{ fontWeight: '600' }}
        >
          {entry.recipe.title}
        </Text>
        <Text className="mt-0.5 text-[12px] text-muted">
          {entry.recipe.nutrition?.calories ?? 0} cal
        </Text>
      </View>
      <View className="ml-3 items-center gap-2">
        <Pressable onPress={onSwap} disabled={isSwapping} hitSlop={8}>
          {isSwapping ? (
            <ActivityIndicator size="small" color={colors.muted} />
          ) : (
            <RefreshCw size={16} color={colors.muted} />
          )}
        </Pressable>
        <Pressable onPress={onToggleSave} hitSlop={8}>
          <Heart
            size={16}
            color={isSaved ? colors.orange.DEFAULT : colors.muted}
            fill={isSaved ? colors.orange.DEFAULT : 'none'}
          />
        </Pressable>
      </View>
    </View>
  );
}

function AddSnackButton() {
  return (
    <View
      className="mx-4 mb-4 flex-row items-center justify-center rounded-[14px] border-2 border-dashed border-border py-3.5"
      style={{ opacity: 0.5 }}
    >
      <Plus size={16} color={colors.muted} />
      <Text className="ml-2 text-[13px] text-muted" style={{ fontWeight: '600' }}>
        Add Snack
      </Text>
    </View>
  );
}

function SaveTemplateButton() {
  return (
    <View
      className="mx-4 mb-5 flex-row items-center justify-center rounded-[14px] border border-navy py-3"
      style={{ opacity: 0.5 }}
    >
      <Bookmark size={16} color={colors.navy.DEFAULT} />
      <Text className="ml-2 text-[13px] text-navy" style={{ fontWeight: '600' }}>
        Save as Template
      </Text>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main Screen
// ---------------------------------------------------------------------------

export default function MealsScreen() {
  const { isAuthenticated } = useAuth();
  const weekStart = getCurrentWeekStartDate();

  // Data hooks
  const {
    data: mealPlan,
    isLoading: isPlanLoading,
    refetch,
  } = useCurrentMealPlanQuery();

  const { data: userProfile } = useUserProfileQuery();

  const { data: savedRecipes } = useQuery({
    queryKey: QUERY_KEYS.RECIPES.SAVED,
    queryFn: () => api.get<SavedRecipeItem[]>(ROUTES.RECIPES.SAVED),
    enabled: isAuthenticated,
  });

  // Mutations
  const generateMutation = useGenerateMealPlanMutation();
  const swapMutation = useSwapMealPlanEntryMutation();
  const saveMutation = useSaveRecipeMutation();
  const unsaveMutation = useUnsaveRecipeMutation();

  // Local state
  const [selectedDay, setSelectedDay] = useState(getTodayDayOfWeek);
  const [swappingEntryId, setSwappingEntryId] = useState<string | null>(null);

  // Derived data
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const weekDateRangeLabel = useMemo(() => formatWeekDateRange(weekStart), [weekStart]);

  const savedRecipeIds = useMemo(() => {
    if (!savedRecipes) return new Set<string>();
    return new Set(savedRecipes.map((r) => r.recipeId));
  }, [savedRecipes]);

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
    (recipeId: string) => {
      if (savedRecipeIds.has(recipeId)) {
        unsaveMutation.mutate(recipeId);
      } else {
        saveMutation.mutate(recipeId);
      }
    },
    [savedRecipeIds, saveMutation, unsaveMutation],
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
      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: 32 }}>
        <MealPlanHeader onGenerate={handleGenerate} disabled={isGenerating} />

        {/* ---- Empty state (no plan) ---- */}
        {hasNoPlan && !isGenerating && (
          <View className="flex-1 items-center justify-center px-8 pt-32">
            <CalendarDays size={48} color={colors.muted} />
            <Text
              className="mt-4 text-[18px] text-dark"
              style={{ fontWeight: '700' }}
            >
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
                <Text className="text-[14px] text-orange" style={{ fontWeight: '600' }}>
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
                    isSaved={savedRecipeIds.has(entry.recipe.id)}
                    isSwapping={swappingEntryId === entry.id}
                    onSwap={() => handleSwap(entry.id)}
                    onToggleSave={() => handleToggleSave(entry.recipe.id)}
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
