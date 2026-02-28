import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  AlertTriangle,
  Bookmark,
  Check,
  ChevronRight,
  Heart,
  Plus,
  RefreshCw,
  ShoppingCart,
  Zap,
} from 'lucide-react-native';
import colors from '../../theme/colors';
import { MealType, PantryStatus, DAY_LABELS } from '../../shared/enums';
import type { MealPlanEntry } from '../../hooks/useCurrentMealPlanQuery';

export const MEAL_TYPE_ORDER: Record<string, number> = {
  [MealType.Breakfast]: 0,
  [MealType.Lunch]: 1,
  [MealType.Dinner]: 2,
  [MealType.Snack]: 3,
};

const styles = StyleSheet.create({
  activeDayShadow: {
    shadowColor: colors.orange.DEFAULT,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function formatWeekDateRange(weekStartDate: string): string {
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

export function getWeekDates(weekStartDate: string) {
  const start = new Date(weekStartDate + 'T00:00:00');
  const now = new Date();
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const dow = d.getDay(); // 0=Sun … 6=Sat
    return {
      dayLabel: DAY_LABELS[dow],
      dateNumber: d.getDate(),
      dayOfWeek: dow,
      isToday: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayKey,
    };
  });
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

export function MealPlanHeader({
  onGenerate,
  disabled,
  onCartPress,
  cartBadgeCount,
}: {
  onGenerate: () => void;
  disabled: boolean;
  onCartPress?: () => void;
  cartBadgeCount?: number;
}) {
  return (
    <View className="flex-row items-center justify-between px-5 pt-4">
      <Text className="text-[26px] font-extrabold tracking-[-0.5px] text-navy">
        Meal Plan
      </Text>
      <View className="flex-row items-center gap-6">
        {onCartPress != null && (
          <Pressable
            onPress={onCartPress}
            className="relative h-10 w-10 items-center justify-center rounded-full bg-success-pale"
          >
            <ShoppingCart size={20} color={colors.success.DEFAULT} />
            {cartBadgeCount != null && cartBadgeCount > 0 && (
              <View className="absolute -right-1 -top-1 min-w-[18px] items-center justify-center rounded-full bg-orange px-1 py-0.5">
                <Text className="text-[9px] font-bold text-white">
                  {cartBadgeCount}
                </Text>
              </View>
            )}
          </Pressable>
        )}
        <Pressable
          onPress={onGenerate}
          disabled={disabled}
          className={`flex-row items-center rounded-[10px] bg-orange px-3.5 py-2 ${disabled ? 'opacity-50' : ''
            }`}
        >
          <Zap size={14} color="#fff" fill="#fff" />
          <Text className="ml-1.5 text-xs font-bold text-white">
            Generate
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

export function WeekDateSubtitle({ label }: { label: string }) {
  return (
    <Text className="mt-1 px-5 text-[13px] text-muted">{label}</Text>
  );
}

export function DaySelector({
  weekDates,
  selectedDay,
  onSelectDay,
  entries,
}: {
  weekDates: ReturnType<typeof getWeekDates>;
  selectedDay: number;
  onSelectDay: (day: number) => void;
  entries?: MealPlanEntry[];
}) {
  return (
    <View className="mx-4 my-3 flex-row justify-between rounded-[16px] border border-border bg-white px-2 py-2.5">
      {weekDates.map((d) => {
        const active = d.dayOfWeek === selectedDay;
        const isToday = d.isToday;
        const dayEntries = entries?.filter((e) => e.dayOfWeek === d.dayOfWeek) ?? [];
        const totalMeals = dayEntries.length;
        const cookedMeals = dayEntries.filter((e) => e.isCooked).length;
        return (
          <Pressable
            key={d.dayOfWeek}
            onPress={() => onSelectDay(d.dayOfWeek)}
            style={active ? styles.activeDayShadow : undefined}
            className={`h-[62px] w-[42px] items-center justify-center rounded-[14px] ${active ? 'bg-orange' : 'bg-transparent'
              }`}
          >
            <Text
              className={`text-[10px] font-semibold ${active ? 'text-white/70' : isToday ? 'text-orange' : 'text-muted'
                }`}
            >
              {d.dayLabel}
            </Text>
            <Text
              className={`mt-0.5 text-[17px] font-bold ${active ? 'text-white' : isToday ? 'text-orange' : 'text-dark'
                }`}
            >
              {d.dateNumber}
            </Text>
            {/* Progress dots */}
            {totalMeals > 0 && (
              <View className="mt-1 flex-row items-center gap-[3px]">
                {dayEntries.map((_, i) => (
                  <View
                    key={i}
                    className={`h-[4px] w-[4px] rounded-full ${active
                        ? i < cookedMeals ? 'bg-white' : 'bg-white/30'
                        : i < cookedMeals ? 'bg-success' : 'bg-border'
                      }`}
                  />
                ))}
              </View>
            )}
            {/* Today underline */}
            {isToday && !active && (
              <View className="mt-0.5 h-[2px] w-3 rounded-full bg-orange" />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export function NutritionSummaryBar({
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

export function MealCard({
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
  const ingredients = entry.recipe.ingredients ?? [];
  const noneCount = ingredients.filter(
    (i) => !i.pantryStatus || i.pantryStatus === PantryStatus.None,
  ).length;
  const lowCount = ingredients.filter(
    (i) => i.pantryStatus === PantryStatus.Low,
  ).length;

  const renderPantryBadge = () => {
    if (noneCount > 0) {
      return (
        <View className="ml-2 flex-row items-center">
          <ShoppingCart size={10} color={colors.orange.DEFAULT} />
          <Text className="ml-0.5 text-[11px] text-orange">
            Need {noneCount} item{noneCount !== 1 ? 's' : ''}
          </Text>
        </View>
      );
    }
    if (lowCount > 0) {
      return (
        <View className="ml-2 flex-row items-center">
          <AlertTriangle size={10} color={colors.warning.icon} />
          <Text className="ml-0.5 text-[11px]" style={{ color: colors.warning.icon }}>
            {lowCount} item{lowCount !== 1 ? 's' : ''} low
          </Text>
        </View>
      );
    }
    return (
      <View className="ml-2 flex-row items-center">
        <Check size={10} color={colors.success.DEFAULT} />
        <Text className="ml-0.5 text-[11px] text-success">
          All in pantry
        </Text>
      </View>
    );
  };

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
          <View className="mt-0.5 flex-row items-center">
            <Text className="text-[12px] text-muted">
              {entry.recipe.nutrition?.calories ?? 0} cal
            </Text>
            {renderPantryBadge()}
          </View>
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

      {/* Bottom action bar — hidden for cooked entries */}
      {!entry.isCooked && (
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
      )}
    </Pressable>
  );
}

export function ShoppingListBanner({
  toBuy,
  low,
  alreadyHave,
  onPress,
}: {
  toBuy: number;
  low: number;
  alreadyHave: number;
  onPress: () => void;
}) {
  const parts: string[] = [];
  const needCount = toBuy + low;
  if (needCount > 0) parts.push(`${needCount} to buy`);
  if (alreadyHave > 0) parts.push(`${alreadyHave} in pantry`);

  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-3 flex-row items-center rounded-[14px] bg-success-pale px-4 py-3.5"
    >
      <ShoppingCart size={18} color={colors.success.DEFAULT} />
      <View className="ml-3 flex-1">
        <Text className="text-[14px] font-semibold text-dark">
          Shopping List Ready
        </Text>
        <Text className="mt-0.5 text-[12px] text-muted">
          {parts.join(' \u00B7 ')}
        </Text>
      </View>
      <ChevronRight size={16} color={colors.muted} />
    </Pressable>
  );
}

export function AddSnackButton() {
  return (
    <View className="mx-4 mb-4 flex-row items-center justify-center rounded-[14px] border-2 border-dashed border-border py-3.5 opacity-50">
      <Plus size={16} color={colors.muted} />
      <Text className="ml-2 text-[13px] font-semibold text-muted">
        Add Snack
      </Text>
    </View>
  );
}

export function SaveTemplateButton() {
  return (
    <View className="mx-4 mb-5 flex-row items-center justify-center rounded-[14px] border border-navy py-3 opacity-50">
      <Bookmark size={16} color={colors.navy.DEFAULT} />
      <Text className="ml-2 text-[13px] font-semibold text-navy">
        Save as Template
      </Text>
    </View>
  );
}
