import {
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import {
  Zap,
  ChevronRight,
  Heart,
  CalendarDays,
  Bell,
} from 'lucide-react-native';
import { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useUserProfileQuery } from '../hooks/useUserProfileQuery';
import { useUsageQuery } from '../hooks/useUsageQuery';
import { useCurrentMealPlanQuery } from '../hooks/useCurrentMealPlanQuery';
import { getTodayDayOfWeek } from '../utils/dayOfWeek';
import { SubscriptionTier, MessageType } from '../shared/enums';
import type { DietaryProfile, NutritionalGoals } from '../shared/enums';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import colors from '../theme/colors';
import { cardShadow } from '../theme/shadows';
import AppText from '../components/AppText';
import Button from '../components/Button';
import LoadingScreen from '../components/LoadingScreen';
import MacroProgressBar from '../components/MacroProgressBar';
import type { ProfileStackParamList } from '../navigation/types';

const FREE_TIER_RECIPE_LIMIT = 5;

function formatMemberSince(dateStr: string): string {
  const date = new Date(dateStr);
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();
  return `Member since ${month} ${year}`;
}

function UpgradeCard({ recipesUsed }: { recipesUsed: number }) {
  const progress = Math.min(recipesUsed / FREE_TIER_RECIPE_LIMIT, 1);

  return (
    <Pressable className="mx-6 mt-4 mb-4 p-[18px] px-5 bg-espresso rounded-[22px] overflow-hidden">
      {/* Decorative circle */}
      <View className="absolute -top-5 -right-5 w-20 h-20 rounded-full bg-terra/15" />

      {/* Top row */}
      <View className="flex-row items-center gap-3">
        <Zap size={18} color={colors.terra.DEFAULT} />
        <View className="flex-1">
          <AppText font="sansBold" className="text-[15px] text-white">
            Upgrade to Pro
          </AppText>
          <AppText className="mt-0.5 text-[12px] text-white/50">
            Unlimited recipes, plans & more
          </AppText>
        </View>
        <ChevronRight size={16} color="rgba(255,255,255,0.4)" />
      </View>

      {/* Usage bar */}
      <View className="flex-row items-center justify-between mt-3">
        <AppText className="text-[10px] text-white/40">
          Recipes: {recipesUsed}/{FREE_TIER_RECIPE_LIMIT} this month
        </AppText>
        <View className="w-20 h-[3px] rounded-[2px] bg-white/10">
          <View
            className="bg-terra h-[3px] rounded-[2px]"
            style={{ width: `${progress * 100}%` }}
          />
        </View>
      </View>
    </Pressable>
  );
}

function DietaryProfileSection({
  dietaryProfile,
  onEdit,
}: {
  dietaryProfile: DietaryProfile | null;
  onEdit?: () => void;
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
    <View className="mx-6 mb-4">
      <View className="flex-row justify-between items-center mb-2.5">
        <AppText font="serif" className="text-[16px] text-espresso">
          Dietary Profile
        </AppText>
        <Pressable onPress={onEdit} hitSlop={8}>
          <AppText font="sansSemiBold" className="text-[13px] text-terra">
            Edit
          </AppText>
        </Pressable>
      </View>
      {pills.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {pills.map(label => (
            <View
              key={label}
              className="bg-terra-pale py-1.5 px-3.5 rounded-full"
            >
              <AppText font="sansSemiBold" className="text-[12px] text-terra">
                {label}
              </AppText>
            </View>
          ))}
        </View>
      ) : (
        <AppText className="text-sm text-stone">
          No dietary preferences set.
        </AppText>
      )}
    </View>
  );
}

interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

function DailyGoalsCard({
  nutritionalGoals,
  todayTotals,
  onEdit,
}: {
  nutritionalGoals: NutritionalGoals | null;
  todayTotals: NutritionTotals;
  onEdit?: () => void;
}) {
  if (!nutritionalGoals) {
    return (
      <View
        className="mx-6 mb-4 p-4 px-[18px] bg-white rounded-[18px]"
        style={cardShadow}
      >
        <View className="flex-row justify-between items-center mb-3">
          <AppText font="serif" className="text-[16px] text-espresso">
            Daily Goals
          </AppText>
          <Pressable onPress={onEdit} hitSlop={8}>
            <AppText font="sansSemiBold" className="text-[13px] text-terra">
              Edit
            </AppText>
          </Pressable>
        </View>
        <AppText className="text-sm text-stone">
          No nutrition goals set.
        </AppText>
      </View>
    );
  }

  const rows = [
    {
      label: 'Calories',
      key: 'calories' as const,
      goal: nutritionalGoals.dailyCalories,
      unit: 'cal',
      color: colors.terra.DEFAULT,
    },
    {
      label: 'Protein',
      key: 'protein' as const,
      goal: nutritionalGoals.dailyProteinGrams,
      unit: 'g',
      color: colors.sage.DEFAULT,
    },
    {
      label: 'Carbs',
      key: 'carbs' as const,
      goal: nutritionalGoals.dailyCarbsGrams,
      unit: 'g',
      color: colors.ocean.DEFAULT,
    },
    {
      label: 'Fat',
      key: 'fat' as const,
      goal: nutritionalGoals.dailyFatGrams,
      unit: 'g',
      color: colors.honey.DEFAULT,
    },
  ];

  return (
    <View
      className="mx-6 mb-4 p-4 px-[18px] bg-white rounded-[18px]"
      style={cardShadow}
    >
      <View className="flex-row justify-between items-center mb-3">
        <AppText font="serif" className="text-[16px] text-espresso">
          Daily Goals
        </AppText>
        <Pressable onPress={onEdit} hitSlop={8}>
          <AppText font="sansSemiBold" className="text-[13px] text-terra">
            Edit
          </AppText>
        </Pressable>
      </View>
      {rows.map((row) => {
        const consumed = Math.round(todayTotals[row.key]);
        const progress = row.goal > 0 ? Math.min(consumed / row.goal, 1) : 0;
        const value =
          row.key === 'calories'
            ? `${consumed.toLocaleString()} / ${row.goal.toLocaleString()} ${row.unit}`
            : `${consumed} / ${row.goal}${row.unit}`;

        return (
          <MacroProgressBar
            key={row.label}
            label={row.label}
            displayValue={value}
            color={row.color}
            progress={progress}
          />
        );
      })}
    </View>
  );
}

const LINK_ITEMS = [
  { label: 'Saved Recipes', icon: Heart, value: '12' },
  { label: 'Templates', icon: CalendarDays, value: '3' },
  { label: 'Notifications', icon: Bell },
] as const;

type Nav = NativeStackNavigationProp<ProfileStackParamList, 'ProfileHome'>;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
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
    return <LoadingScreen color={colors.espresso} />;
  }

  const tier = profile?.subscriptionTier ?? SubscriptionTier.Free;
  const firstName = profile?.firstName ?? '';
  const initial = (firstName || '?')[0].toUpperCase();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-ivory">
      <ScrollView contentContainerClassName="pb-28">
        {/* Header with gradient — title + user info */}
        <LinearGradient
          colors={['#FFF8F0', '#FAF7F2']}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
        >
          <View className="px-6 pt-5">
            <AppText font="serifHeavy" className="text-[28px] tracking-[-0.3px] text-espresso mb-4">
              Profile
            </AppText>

            {/* User row */}
            <View className="flex-row items-center gap-4 pb-5">
              {profile?.avatarUrl ? (
                <Image
                  source={{ uri: profile.avatarUrl }}
                  className="w-[60px] h-[60px] rounded-[20px]"
                />
              ) : (
                <View className="w-[60px] h-[60px] rounded-[20px] overflow-hidden">
                  <LinearGradient
                    colors={[colors.terra.DEFAULT, colors.terra.light]}
                    style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <AppText font="sansBold" className="text-[26px] text-white">
                      {initial}
                    </AppText>
                  </LinearGradient>
                </View>
              )}
              <View className="flex-1">
                <AppText font="serif" className="text-[18px] text-espresso">
                  {firstName}
                </AppText>
                <AppText className="mt-0.5 text-[13px] text-stone">
                  {formatMemberSince(profile?.createdAt ?? new Date().toISOString())}
                </AppText>
              </View>
              <View className="py-1 px-2.5 rounded-full bg-terra-pale">
                <AppText font="sansBold" className="text-[11px] text-terra">
                  {tier.toUpperCase()}
                </AppText>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Upgrade card (Free tier only) */}
        {tier === SubscriptionTier.Free && (
          <UpgradeCard recipesUsed={usage?.featureCounts?.[MessageType.RecipeGeneration] ?? 0} />
        )}

        {/* Dietary Profile */}
        <DietaryProfileSection
          dietaryProfile={profile?.dietaryProfile as DietaryProfile | null}
          onEdit={() => navigation.navigate('EditDietaryProfile')}
        />

        {/* Daily Goals */}
        <DailyGoalsCard
          nutritionalGoals={profile?.nutritionalGoals as NutritionalGoals | null}
          todayTotals={todayTotals}
          onEdit={() => navigation.navigate('EditNutritionGoals')}
        />

        {/* Links — divider style */}
        <View className="mx-6 mb-6">
          {LINK_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            return (
              <View
                key={item.label}
                className={`flex-row items-center gap-3 py-3.5 ${idx < LINK_ITEMS.length - 1 ? 'border-b border-line' : ''}`}
              >
                <Icon size={18} color={colors.stone} />
                <AppText className="flex-1 text-[14px] text-espresso">
                  {item.label}
                </AppText>
                {'value' in item && item.value && (
                  <AppText font="sansSemiBold" className="text-[12px] text-stone">
                    {item.value}
                  </AppText>
                )}
                <ChevronRight size={16} color={colors.dust} />
              </View>
            );
          })}
        </View>

        {/* Sign Out */}
        <View className="mx-6">
          <Button label="Sign Out" variant="outline" onPress={handleSignOut} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
