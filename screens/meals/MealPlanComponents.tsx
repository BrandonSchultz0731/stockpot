import {
  ActivityIndicator,
  Pressable,
  View,
} from 'react-native';
import AppText from '../../components/AppText';
import {
  AlertTriangle,
  Bookmark,
  Check,
  ChevronRight,
  Heart,
  Plus,
  RefreshCw,
  ShoppingCart,
  UtensilsCrossed,
  Zap,
} from 'lucide-react-native';
import colors from '../../theme/colors';
import { fonts } from '../../theme/typography';
import { cardShadow } from '../../theme/shadows';
import pluralize from 'pluralize';
import { MealType, DAY_LABELS } from '../../shared/enums';
import { countByPantryStatus } from '../../shared/pantryStatusCounts';
import { getEatServings, type MealPlanEntry } from '../../hooks/useCurrentMealPlanQuery';

export const MEAL_TYPE_ORDER: Record<string, number> = {
  [MealType.Breakfast]: 0,
  [MealType.Lunch]: 1,
  [MealType.Dinner]: 2,
  [MealType.Snack]: 3,
};

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
      <AppText
        className="text-[26px] tracking-[-0.5px] text-espresso"
        style={{ fontFamily: fonts.serif }}
      >
        Meal Plan
      </AppText>
      <View className="flex-row items-center gap-6">
        {onCartPress != null && (
          <Pressable
            onPress={onCartPress}
            className="relative h-10 w-10 items-center justify-center rounded-full bg-sage-pale"
          >
            <ShoppingCart size={20} color={colors.sage.DEFAULT} />
            {cartBadgeCount != null && cartBadgeCount > 0 && (
              <View className="absolute -right-1 -top-1 min-w-[18px] items-center justify-center rounded-full bg-terra px-1 py-0.5">
                <AppText className="text-[9px] font-bold text-white">
                  {cartBadgeCount}
                </AppText>
              </View>
            )}
          </Pressable>
        )}
        <Pressable
          onPress={onGenerate}
          disabled={disabled}
          className={`flex-row items-center rounded-full bg-terra px-3.5 py-2 ${disabled ? 'opacity-50' : ''
            }`}
        >
          <Zap size={14} color="#fff" fill="#fff" />
          <AppText className="ml-1.5 text-xs font-bold text-white">
            Generate
          </AppText>
        </Pressable>
      </View>
    </View>
  );
}

export function WeekDateSubtitle({ label }: { label: string }) {
  return (
    <AppText className="mt-1 px-5 text-[13px] text-stone">{label}</AppText>
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
    <View className="mx-4 my-3 flex-row justify-between rounded-[16px] border border-line bg-white px-2 py-2.5">
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
            className={`h-[62px] w-[42px] items-center justify-center rounded-[14px] ${active ? 'bg-espresso' : 'bg-transparent'
              }`}
          >
            <AppText
              className={`text-[10px] font-semibold ${active ? 'text-white/70' : isToday ? 'text-terra' : 'text-stone'
                }`}
            >
              {d.dayLabel}
            </AppText>
            <AppText
              className={`mt-0.5 text-[17px] font-bold ${active ? 'text-white' : isToday ? 'text-terra' : 'text-espresso'
                }`}
            >
              {d.dateNumber}
            </AppText>
            {/* Progress dots */}
            {totalMeals > 0 && (
              <View className="mt-1 flex-row items-center gap-[3px]">
                {dayEntries.map((_, i) => (
                  <View
                    key={i}
                    className={`h-[4px] w-[4px] rounded-full ${active
                      ? i < cookedMeals ? 'bg-white' : 'bg-white/30'
                      : i < cookedMeals ? 'bg-sage' : 'bg-line'
                      }`}
                  />
                ))}
              </View>
            )}
            {/* Today underline */}
            {isToday && !active && (
              <View className="mt-0.5 h-[2px] w-3 rounded-full bg-terra" />
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
  const items: { label: string; value: string; target: string | null; color: string }[] = [
    { label: 'Calories', value: formatCalories(totals.calories), target: targets ? `/ ${formatCalories(targets.calories)}` : null, color: colors.terra.DEFAULT },
    { label: 'Protein', value: `${totals.protein}g`, target: targets ? `/ ${targets.protein}g` : null, color: colors.sage.DEFAULT },
    { label: 'Carbs', value: `${totals.carbs}g`, target: targets ? `/ ${targets.carbs}g` : null, color: colors.ocean.DEFAULT },
    { label: 'Fat', value: `${totals.fat}g`, target: targets ? `/ ${targets.fat}g` : null, color: colors.honey.DEFAULT },
  ];

  return (
    <View
      className="mx-4 my-3 flex-row justify-around rounded-[14px] bg-white px-4 py-3"
      style={cardShadow}
    >
      {items.map((n) => (
        <View key={n.label} className="items-center">
          <AppText className="text-[15px] font-bold" style={{ color: n.color }}>
            {n.value}
            {n.target && (
              <AppText className="text-[10px] font-normal text-stone">
                {' '}{n.target}
              </AppText>
            )}
          </AppText>
          <AppText className="mt-0.5 text-[10px] text-stone">{n.label}</AppText>
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
  const isLeftover = !!entry.leftoverSourceEntryId;
  const ingredients = entry.recipe.ingredients ?? [];
  const { none: noneCount, low: lowCount } = countByPantryStatus(ingredients);

  const renderPantryBadge = () => {
    if (noneCount > 0) {
      return (
        <View className="ml-2 flex-row items-center">
          <ShoppingCart size={10} color={colors.terra.DEFAULT} />
          <AppText className="ml-0.5 text-[11px] text-terra">
            Need {noneCount} {pluralize('item', noneCount)}
          </AppText>
        </View>
      );
    }
    if (lowCount > 0) {
      return (
        <View className="ml-2 flex-row items-center">
          <AlertTriangle size={10} color={colors.honey.DEFAULT} />
          <AppText className="ml-0.5 text-[11px]" style={{ color: colors.honey.DEFAULT }}>
            {lowCount} {pluralize('item', lowCount)} low
          </AppText>
        </View>
      );
    }
    return (
      <View className="ml-2 flex-row items-center">
        <Check size={10} color={colors.sage.DEFAULT} />
        <AppText className="ml-0.5 text-[11px] text-sage">
          All in pantry
        </AppText>
      </View>
    );
  };

  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-2.5 overflow-hidden rounded-2xl bg-white"
      style={cardShadow}
    >
      {/* Top row: content + favorite */}
      <View className="flex-row items-start p-3.5 pb-2.5">
        <View className="flex-1">
          <View className="flex-row items-center">
            <AppText className="text-[11px] font-bold uppercase tracking-[0.5px] text-terra">
              {entry.mealType}
            </AppText>
            {isLeftover && (
              <View className="ml-2 flex-row items-center rounded-md px-1.5 py-0.5" style={{ backgroundColor: colors.honey.pale }}>
                <UtensilsCrossed size={10} color={colors.honey.DEFAULT} />
                <AppText className="ml-0.5 text-[10px] font-semibold" style={{ color: colors.honey.DEFAULT }}>
                  Leftovers
                </AppText>
              </View>
            )}
            {entry.isCooked && !isLeftover && (
              <View className="ml-2 flex-row items-center rounded-md bg-sage-pale px-1.5 py-0.5">
                <Check size={10} color={colors.sage.DEFAULT} />
                <AppText className="ml-0.5 text-[10px] font-semibold text-sage">Cooked</AppText>
              </View>
            )}
          </View>
          <AppText
            className="mt-1 text-[15px] text-espresso"
            style={{ fontFamily: fonts.serif }}
            numberOfLines={1}
          >
            {entry.recipe.title}
          </AppText>
          <View className="mt-0.5 flex-row items-center">
            <AppText className="text-[12px] text-stone">
              {(entry.recipe.nutrition?.calories ?? 0) * getEatServings(entry)} cal
            </AppText>
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
            color={isSaved ? colors.terra.DEFAULT : colors.stone}
            fill={isSaved ? colors.terra.DEFAULT : 'none'}
          />
        </Pressable>
      </View>

      {/* Bottom action bar -- hidden for cooked and leftover entries */}
      {!entry.isCooked && !isLeftover && (
        <View className="flex-row items-center border-t border-line px-3.5 py-2">
          <Pressable
            onPress={onSwap}
            disabled={isSwapping}
            hitSlop={6}
            className="flex-row items-center rounded-lg bg-cream px-2.5 py-1.5"
          >
            {isSwapping ? (
              <ActivityIndicator size="small" color={colors.stone} />
            ) : (
              <>
                <RefreshCw size={13} color={colors.stone} />
                <AppText className="ml-1.5 text-[12px] font-semibold text-stone">Swap</AppText>
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
      className="mx-4 mb-3 flex-row items-center rounded-[14px] bg-sage-pale px-4 py-3.5"
    >
      <ShoppingCart size={18} color={colors.sage.DEFAULT} />
      <View className="ml-3 flex-1">
        <AppText className="text-[14px] font-semibold text-espresso">
          Shopping List Ready
        </AppText>
        <AppText className="mt-0.5 text-[12px] text-stone">
          {parts.join(' \u00B7 ')}
        </AppText>
      </View>
      <ChevronRight size={16} color={colors.stone} />
    </Pressable>
  );
}

export function MealPlaceholder({
  mealType,
  onPress,
  isLoading,
}: {
  mealType: string;
  onPress: () => void;
  isLoading: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={isLoading}
      className="mx-4 mb-2.5 flex-row items-center justify-center rounded-[14px] border-2 border-dashed border-line py-3.5"
    >
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.terra.DEFAULT} />
      ) : (
        <>
          <Plus size={16} color={colors.stone} />
          <AppText className="ml-2 text-[13px] font-semibold text-stone">
            Add {mealType}
          </AppText>
        </>
      )}
    </Pressable>
  );
}

export function SaveTemplateButton() {
  return (
    <View className="mx-4 mb-5 flex-row items-center justify-center rounded-[14px] border border-espresso py-3 opacity-50">
      <Bookmark size={16} color={colors.espresso} />
      <AppText className="ml-2 text-[13px] font-semibold text-espresso">
        Save as Template
      </AppText>
    </View>
  );
}
