import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Sparkles,
  ChevronRight,
  Heart,
  CalendarDays,
  Leaf,
  Bell,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfileQuery } from '../hooks/useUserProfileQuery';
import { useUsageQuery } from '../hooks/useUsageQuery';
import { useCurrentMealPlanQuery } from '../hooks/useCurrentMealPlanQuery';
import { getTodayDayOfWeek } from '../utils/dayOfWeek';
import { SubscriptionTier } from '../shared/enums';
import type { DietaryProfile, NutritionalGoals } from '../shared/enums';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import colors from '../theme/colors';
import Button from '../components/Button';

const FREE_TIER_RECIPE_LIMIT = 5;

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `Member since ${month} ${year}`;
}

function UserCard({
  firstName,
  lastName,
  createdAt,
  tier,
}: {
  firstName: string;
  lastName: string | null;
  createdAt: string;
  tier: SubscriptionTier;
}) {
  const initial = firstName.charAt(0).toUpperCase();
  const fullName = lastName ? `${firstName} ${lastName}` : firstName;

  return (
    <View className="mx-4 mb-3 flex-row items-center rounded-card border border-border bg-white p-5">
      <View className="w-14 h-14 items-center justify-center rounded-[18px] bg-navy">
        <Text className="text-2xl font-bold text-white">
          {initial}
        </Text>
      </View>
      <View className="flex-1 ml-4">
        <Text className="text-lg font-bold text-dark">
          {fullName}
        </Text>
        <Text className="text-[13px] text-muted mt-0.5">
          {formatMemberSince(createdAt)}
        </Text>
      </View>
      <View className="bg-orange-pale px-2.5 py-1 rounded-lg">
        <Text className="text-[11px] font-bold text-orange">
          {tier.toUpperCase()}
        </Text>
      </View>
    </View>
  );
}

function SubscriptionCard({ recipesUsed }: { recipesUsed: number }) {
  const progress = Math.min(recipesUsed / FREE_TIER_RECIPE_LIMIT, 1);

  return (
    <Pressable
      className="mx-4 mb-3 rounded-2xl bg-navy p-4 overflow-hidden">
      {/* Decorative circles */}
      <View className="absolute top-[-20px] right-[-20px] w-[80px] h-[80px] rounded-[40px] bg-orange/15" />
      <View className="absolute bottom-[-10px] right-[30px] w-[50px] h-[50px] rounded-[25px] bg-orange/10" />

      {/* Top row */}
      <View className="flex-row items-center mb-2">
        <View className="w-8 h-8 items-center justify-center rounded-[10px] bg-orange/20">
          <Sparkles size={16} color={colors.orange.DEFAULT} />
        </View>
        <View className="flex-1 ml-3">
          <Text className="text-[15px] font-bold text-white">
            Upgrade to Pro
          </Text>
          <Text className="text-[11px] mt-0.5 text-white/60">
            Unlimited meal plans, recipes & more
          </Text>
        </View>
        <ChevronRight size={16} color="rgba(255,255,255,0.5)" />
      </View>

      {/* Usage bar */}
      <View className="mt-2">
        <View className="flex-row justify-between mb-1">
          <Text className="text-[10px] text-white/50">
            Recipe generations this month
          </Text>
          <Text className="text-[10px] font-semibold text-orange">
            {recipesUsed} of {FREE_TIER_RECIPE_LIMIT} used
          </Text>
        </View>
        <View className="h-1 rounded-full bg-white/10">
          <View
            className="h-1 rounded-full bg-orange"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
      </View>
    </Pressable>
  );
}

function DietaryProfileCard({
  dietaryProfile,
}: {
  dietaryProfile: DietaryProfile | null;
}) {
  const pills: string[] = [];
  if (dietaryProfile) {
    for (const diet of dietaryProfile.diets) {
      if (diet !== 'None') {
        pills.push(diet);
      }
    }
    for (const ingredient of dietaryProfile.excludedIngredients) {
      pills.push(`No ${ingredient}`);
    }
  }

  return (
    <View className="mx-4 mb-3 rounded-2xl border border-border bg-white p-4">
      <View className="flex-row justify-between items-center mb-3.5">
        <Text className="text-[15px] font-bold text-navy">
          Dietary Profile
        </Text>
        <Text className="text-xs font-semibold text-orange">
          Edit
        </Text>
      </View>
      {pills.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {pills.map(label => (
            <View key={label} className="bg-orange-pale px-3.5 py-1.5 rounded-full">
              <Text className="text-xs font-semibold text-orange">
                {label}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-sm text-muted">No dietary preferences set.</Text>
      )}
    </View>
  );
}

function NutritionRow({
  label,
  value,
  color,
  progress,
  isLast,
}: {
  label: string;
  value: string;
  color: string;
  progress: number;
  isLast: boolean;
}) {
  return (
    <View className={isLast ? '' : 'mb-3'}>
      <View className="flex-row justify-between mb-1">
        <Text className="text-[13px] text-body">{label}</Text>
        <Text className="text-[13px] font-semibold text-dark">
          {value}
        </Text>
      </View>
      <View className="h-1.5 rounded-full bg-border overflow-hidden">
        <View
          className="h-1.5 rounded-full"
          style={{
            width: `${progress * 100}%`,
            backgroundColor: color,
          }}
        />
      </View>
    </View>
  );
}

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function NutritionGoalsCard({
  nutritionalGoals,
  todayTotals,
}: {
  nutritionalGoals: NutritionalGoals | null;
  todayTotals: NutritionTotals;
}) {
  if (!nutritionalGoals) {
    return (
      <View className="mx-4 mb-3 rounded-2xl border border-border bg-white p-4">
        <View className="flex-row justify-between items-center mb-3.5">
          <Text className="text-[15px] font-bold text-navy">
            Daily Nutrition Goals
          </Text>
          <Text className="text-xs font-semibold text-orange">
            Edit
          </Text>
        </View>
        <Text className="text-sm text-muted">No nutrition goals set.</Text>
      </View>
    );
  }

  const rows = [
    {
      label: 'Calories',
      key: 'calories' as const,
      goal: nutritionalGoals.dailyCalories,
      unit: 'cal',
      color: colors.orange.DEFAULT,
    },
    {
      label: 'Protein',
      key: 'protein' as const,
      goal: nutritionalGoals.dailyProteinGrams,
      unit: 'g',
      color: colors.success.DEFAULT,
    },
    {
      label: 'Carbs',
      key: 'carbs' as const,
      goal: nutritionalGoals.dailyCarbsGrams,
      unit: 'g',
      color: '#4A90D9',
    },
    {
      label: 'Fat',
      key: 'fat' as const,
      goal: nutritionalGoals.dailyFatGrams,
      unit: 'g',
      color: '#D9534F',
    },
  ];

  return (
    <View className="mx-4 mb-3 rounded-2xl border border-border bg-white p-4">
      <View className="flex-row justify-between items-center mb-3.5">
        <Text className="text-[15px] font-bold text-navy">
          Daily Nutrition Goals
        </Text>
        <Text className="text-xs font-semibold text-orange">
          Edit
        </Text>
      </View>
      {rows.map((row, i) => {
        const consumed = Math.round(todayTotals[row.key]);
        const progress = row.goal > 0 ? Math.min(consumed / row.goal, 1) : 0;
        const value =
          row.key === 'calories'
            ? `${consumed.toLocaleString()} / ${row.goal.toLocaleString()} ${row.unit}`
            : `${consumed} / ${row.goal}${row.unit}`;

        return (
          <NutritionRow
            key={row.label}
            label={row.label}
            value={value}
            color={row.color}
            progress={progress}
            isLast={i === rows.length - 1}
          />
        );
      })}
    </View>
  );
}

function SettingsRow({
  icon,
  label,
  right,
  showBorder,
}: {
  icon: React.ReactNode;
  label: string;
  right: React.ReactNode;
  showBorder: boolean;
}) {
  return (
    <View
      className={`flex-row items-center px-4 py-3.5 ${showBorder ? 'border-b border-border' : ''}`}>
      {icon}
      <Text className="flex-1 text-sm text-dark ml-3">{label}</Text>
      {right}
    </View>
  );
}

function SettingsCard() {
  const [wasteReduction, setWasteReduction] = useState(true);

  return (
    <View className="mx-4 mb-5 rounded-2xl border border-border bg-white overflow-hidden">
      <SettingsRow
        icon={<Heart size={18} color={colors.navy.DEFAULT} />}
        label="Saved Recipes"
        showBorder
        right={
          <View className="flex-row items-center">
            <Text className="text-xs font-semibold text-muted mr-2">
              12
            </Text>
            <ChevronRight size={16} color={colors.muted} />
          </View>
        }
      />
      <SettingsRow
        icon={<CalendarDays size={18} color={colors.navy.DEFAULT} />}
        label="Meal Plan Templates"
        showBorder
        right={
          <View className="flex-row items-center">
            <Text className="text-xs font-semibold text-muted mr-2">
              3
            </Text>
            <ChevronRight size={16} color={colors.muted} />
          </View>
        }
      />
      <SettingsRow
        icon={<Leaf size={18} color={colors.navy.DEFAULT} />}
        label="Waste Reduction Mode"
        showBorder
        right={
          <Switch
            value={wasteReduction}
            onValueChange={setWasteReduction}
            trackColor={{
              false: colors.border,
              true: colors.success.DEFAULT,
            }}
          />
        }
      />
      <SettingsRow
        icon={<Bell size={18} color={colors.navy.DEFAULT} />}
        label="Notification Settings"
        showBorder={false}
        right={<ChevronRight size={16} color={colors.muted} />}
      />
    </View>
  );
}

export default function ProfileScreen() {
  const { clearTokens, refreshToken } = useAuth();
  const { data: profile, isLoading: profileLoading } = useUserProfileQuery();
  const { data: usage } = useUsageQuery();
  const { data: mealPlan } = useCurrentMealPlanQuery();

  const todayTotals = useMemo(() => {
    const totals = { calories: 0, protein: 0, carbs: 0, fat: 0 };
    if (!mealPlan?.entries) return totals;
    const today = getTodayDayOfWeek();
    for (const entry of mealPlan.entries) {
      if (entry.dayOfWeek !== today) continue;
      const n = entry.recipe.nutrition;
      if (n) {
        totals.calories += n.calories ?? 0;
        totals.protein += n.protein ?? 0;
        totals.carbs += n.carbs ?? 0;
        totals.fat += n.fat ?? 0;
      }
    }
    return totals;
  }, [mealPlan?.entries]);

  const handleSignOut = async () => {
    try {
      await api.post(ROUTES.AUTH.LOGOUT, { refreshToken });
    } catch {
      // best-effort logout
    }
    await clearTokens();
  };

  if (profileLoading) {
    return (
      <SafeAreaView
        edges={['top']}
        className="flex-1 items-center justify-center bg-cream">
        <ActivityIndicator size="large" color={colors.navy.DEFAULT} />
      </SafeAreaView>
    );
  }

  const tier = profile?.subscriptionTier ?? SubscriptionTier.Free;

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      <ScrollView contentContainerClassName="pb-10">
        {/* Section 1: Header */}
        <View className="px-5 pt-4">
          <Text className="text-[26px] font-extrabold tracking-[-0.5px] text-navy">
            Profile
          </Text>
        </View>

        {/* Section 2: User Card */}
        <View className="mt-4">
          <UserCard
            firstName={profile?.firstName ?? ''}
            lastName={profile?.lastName ?? null}
            createdAt={profile?.createdAt ?? new Date().toISOString()}
            tier={tier}
          />
        </View>

        {/* Section 3: Subscription Card (Free tier only) */}
        {tier === SubscriptionTier.Free && (
          <SubscriptionCard recipesUsed={usage?.recipesGenerated ?? 0} />
        )}

        {/* Section 4: Dietary Profile */}
        <DietaryProfileCard
          dietaryProfile={
            profile?.dietaryProfile as DietaryProfile | null
          }
        />

        {/* Section 5: Nutrition Goals */}
        <NutritionGoalsCard
          nutritionalGoals={
            profile?.nutritionalGoals as NutritionalGoals | null
          }
          todayTotals={todayTotals}
        />

        {/* Section 6: Settings */}
        <SettingsCard />

        {/* Section 7: Sign Out */}
        <View className="mx-4">
          <Button label="Sign Out" variant="outline" onPress={handleSignOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
