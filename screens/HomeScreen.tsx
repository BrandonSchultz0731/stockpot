import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { useQuery } from '@tanstack/react-query';
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Flame,
  Heart,
  LayoutGrid,
} from 'lucide-react-native';
import { useUserProfileQuery } from '../hooks/useUserProfileQuery';
import { usePantryQuery, type PantryItem } from '../hooks/usePantryQuery';
import {
  useCurrentMealPlanQuery,
  type MealPlanEntry,
} from '../hooks/useCurrentMealPlanQuery';
import { MealType } from '../shared/enums';
import { getExpiryStatus } from '../utils/expiry';
import { getTodayDayOfWeek } from '../utils/dayOfWeek';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import type { TabParamList } from '../navigation/types';
import colors from '../theme/colors';

type TabNav = BottomTabNavigationProp<TabParamList, 'Home'>;

const MEAL_TYPE_ORDER: Record<MealType, number> = {
  [MealType.Breakfast]: 0,
  [MealType.Lunch]: 1,
  [MealType.Dinner]: 2,
  [MealType.Snack]: 3,
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

// --- Sub-components ---

function ExpiringBanner({
  items,
  onPress,
}: {
  items: PantryItem[];
  onPress: () => void;
}) {
  if (items.length === 0) return null;

  const displayNames = items.map(i => i.displayName);
  const preview =
    displayNames.length <= 3
      ? displayNames.join(', ')
      : `${displayNames.slice(0, 3).join(', ')} and ${displayNames.length - 3} more`;

  return (
    <Pressable
      onPress={onPress}
      className="mx-4 mb-4 flex-row items-center rounded-2xl border border-warning-border bg-warning-pale p-3.5"
    >
      <View
        className="mr-3 h-9 w-9 items-center justify-center rounded-[10px] bg-warning-light"
      >
        <AlertTriangle size={18} color={colors.warning.dark} />
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-bold text-warning-text">
          {items.length} {items.length === 1 ? 'item' : 'items'} expiring soon
        </Text>
        <Text className="mt-0.5 text-[11px] text-warning-muted">{preview}</Text>
      </View>
      <ChevronRight size={16} color={colors.warning.dark} />
    </Pressable>
  );
}

function MealCard({ entry, pantryMatchFraction }: { entry: MealPlanEntry; pantryMatchFraction: string }) {
  const { recipe } = entry;
  const total = recipe.ingredients.length;
  const matched = recipe.ingredients.filter(i => i.inPantry).length;
  const matchPct = total > 0 ? matched / total : 0;
  const isHighMatch = matchPct >= 0.75;

  return (
    <View className="mx-4 mb-2.5 flex-row items-center rounded-2xl border border-border bg-white p-3.5">
      <View className="flex-1">
        <Text className="text-[11px] font-bold uppercase tracking-[0.5px] text-orange">
          {entry.mealType}
        </Text>
        <Text
          className="my-1 text-sm font-semibold text-dark"
          numberOfLines={1}
        >
          {recipe.title}
        </Text>
        <View className="flex-row items-center">
          {recipe.nutrition?.calories != null && (
            <Text className="text-[11px] text-muted">
              {recipe.nutrition.calories} cal
            </Text>
          )}
          {recipe.nutrition?.calories != null && recipe.totalTimeMinutes > 0 && (
            <Text className="mx-1.5 text-[11px] text-muted">·</Text>
          )}
          {recipe.totalTimeMinutes > 0 && (
            <Text className="text-[11px] text-muted">
              {recipe.totalTimeMinutes} min
            </Text>
          )}
        </View>
      </View>
      <View
        className="rounded-full px-2.5 py-1"
        style={{
          backgroundColor: isHighMatch
            ? colors.success.pale
            : colors.orange.pale,
        }}
      >
        <Text
          className="text-[11px] font-bold"
          style={{
            color: isHighMatch
              ? colors.success.DEFAULT
              : colors.orange.DEFAULT,
          }}
        >
          {pantryMatchFraction}
        </Text>
      </View>
    </View>
  );
}

function TodaysMeals() {
  const navigation = useNavigation<TabNav>();
  const { data: mealPlan, isLoading } = useCurrentMealPlanQuery();

  const todayEntries = (() => {
    if (!mealPlan || !mealPlan.entries) return [];
    const today = getTodayDayOfWeek();
    return mealPlan.entries
      .filter(e => e.dayOfWeek === today)
      .sort(
        (a, b) =>
          (MEAL_TYPE_ORDER[a.mealType] ?? 99) -
          (MEAL_TYPE_ORDER[b.mealType] ?? 99),
      );
  })();

  const renderContent = () => {
    if (isLoading) {
      return (
        <View className="items-center py-6">
          <ActivityIndicator size="small" color={colors.navy.DEFAULT} />
        </View>
      );
    }

    if (mealPlan?.status === 'error') {
      return (
        <View className="mx-4 items-center rounded-2xl border border-border bg-white py-6">
          <Text className="text-sm text-danger">
            Something went wrong generating your meal plan.
          </Text>
        </View>
      );
    }

    if (!mealPlan || mealPlan.status === 'draft' || todayEntries.length === 0) {
      return (
        <View className="mx-4 items-center rounded-2xl border border-border bg-white py-6">
          <Text className="text-sm text-muted">No meal plan yet</Text>
          <Pressable onPress={() => navigation.navigate('MealsStack')}>
            <Text className="mt-2 text-sm font-semibold text-orange">
              Generate Plan
            </Text>
          </Pressable>
        </View>
      );
    }

    return todayEntries.map(entry => {
      const total = entry.recipe.ingredients.length;
      const matched = entry.recipe.ingredients.filter(i => i.inPantry).length;
      return (
        <MealCard
          key={entry.id}
          entry={entry}
          pantryMatchFraction={`${matched}/${total}`}
        />
      );
    });
  };

  return (
    <View className="mb-4">
      <View className="mb-3 flex-row items-center justify-between px-5">
        <Text className="text-[17px] font-bold text-navy">
          Today's Meals
        </Text>
        <Pressable onPress={() => navigation.navigate('MealsStack')}>
          <Text className="text-xs font-semibold text-orange">
            View Week →
          </Text>
        </Pressable>
      </View>
      {renderContent()}
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  iconBg,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  iconBg: string;
}) {
  return (
    <View className="mb-2.5 w-[48%] rounded-2xl border border-border bg-white p-4">
      <View
        className="mb-2.5 h-8 w-8 items-center justify-center rounded-[10px]"
        style={{ backgroundColor: iconBg }}
      >
        {icon}
      </View>
      <Text className="text-[22px] font-extrabold text-dark">
        {value}
      </Text>
      <Text className="mt-0.5 text-[11px] font-medium text-muted">
        {label}
      </Text>
    </View>
  );
}

function PantryOverview({
  pantryItemCount,
  expiringCount,
  savedRecipeCount,
  avgCalories,
}: {
  pantryItemCount: number;
  expiringCount: number;
  savedRecipeCount: number;
  avgCalories: string;
}) {
  return (
    <View className="px-4 pb-4">
      <Text className="mb-3 ml-1 text-[17px] font-bold text-navy">
        Pantry Overview
      </Text>
      <View className="flex-row flex-wrap justify-between">
        <StatCard
          label="Total Items"
          value={String(pantryItemCount)}
          icon={<LayoutGrid size={16} color={colors.navy.DEFAULT} />}
          iconBg={colors.navy.pale}
        />
        <StatCard
          label="Expiring Soon"
          value={String(expiringCount)}
          icon={<Clock size={16} color={colors.warning.icon} />}
          iconBg={colors.warning.pale}
        />
        <StatCard
          label="Recipes Saved"
          value={String(savedRecipeCount)}
          icon={<Heart size={16} color={colors.orange.DEFAULT} />}
          iconBg={colors.orange.pale}
        />
        <StatCard
          label="Avg Calories"
          value={avgCalories}
          icon={<Flame size={16} color={colors.success.DEFAULT} />}
          iconBg={colors.success.pale}
        />
      </View>
    </View>
  );
}

// --- Main Screen ---

export default function HomeScreen() {
  const navigation = useNavigation<TabNav>();
  const { data: profile, isLoading: profileLoading } = useUserProfileQuery();
  const { data: pantryItems, isLoading: pantryLoading } = usePantryQuery();
  const { data: mealPlan } = useCurrentMealPlanQuery();

  const { data: savedRecipes } = useQuery({
    queryKey: QUERY_KEYS.RECIPES.SAVED,
    queryFn: () => api.get<{ id: string }[]>(ROUTES.RECIPES.SAVED),
  });

  if (profileLoading || pantryLoading) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator size="large" color={colors.navy.DEFAULT} />
      </SafeAreaView>
    );
  }

  const expiringItems = (pantryItems ?? []).filter(item => {
    const status = getExpiryStatus(item.expirationDate);
    return status === 'expired' || status === 'soon';
  });

  const avgCalories = (() => {
    if (!mealPlan || !mealPlan.entries) return '\u2014';
    const today = getTodayDayOfWeek();
    const todayEntries = mealPlan.entries.filter(e => e.dayOfWeek === today);
    const cals = todayEntries
      .map(e => e.recipe.nutrition?.calories)
      .filter((c): c is number => c != null);
    if (cals.length === 0) return '\u2014';
    return String(Math.round(cals.reduce((a, b) => a + b, 0) / cals.length));
  })();

  return (
    <SafeAreaView className="flex-1 bg-cream" edges={['top']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Greeting */}
        <View className="px-5 pb-3 pt-4">
          <Text className="text-[13px] font-medium text-muted">
            {getGreeting()}
            {profile?.firstName ? `, ${profile.firstName}` : ''}
          </Text>
          <Text className="mt-0.5 text-[26px] font-extrabold tracking-[-0.5px] text-navy">
            What's cooking?
          </Text>
        </View>

        {/* Expiring banner */}
        <ExpiringBanner
          items={expiringItems}
          onPress={() => navigation.navigate('PantryStack')}
        />

        {/* Today's meals */}
        <TodaysMeals />

        {/* Pantry overview */}
        <PantryOverview
          pantryItemCount={(pantryItems ?? []).length}
          expiringCount={expiringItems.length}
          savedRecipeCount={(savedRecipes ?? []).length}
          avgCalories={avgCalories}
        />

        {/* Bottom spacing */}
        <View className="h-5" />
      </ScrollView>
    </SafeAreaView>
  );
}
