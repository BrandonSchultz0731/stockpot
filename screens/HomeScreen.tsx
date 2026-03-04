import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import {
  ChefHat,
  ChevronRight,
  Check,
  Plus,
  ReceiptText,
} from 'lucide-react-native';
import { useUserProfileQuery } from '../hooks/useUserProfileQuery';
import { usePantryQuery, type PantryItem } from '../hooks/usePantryQuery';
import {
  useCurrentMealPlanQuery,
  type MealPlanEntry,
} from '../hooks/useCurrentMealPlanQuery';
import { MealType } from '../shared/enums';
import { daysUntilExpiry, getExpiryStatus } from '../utils/expiry';
import { getTodayDayOfWeek } from '../utils/dayOfWeek';
import type { TabParamList, HomeStackParamList } from '../navigation/types';
import colors from '../theme/colors';
import { cardShadow } from '../theme/shadows';
import AppText from '../components/AppText';
import LoadingScreen from '../components/LoadingScreen';

type TabNav = BottomTabNavigationProp<TabParamList, 'Home'>;

const MEAL_TYPE_ORDER: Record<MealType, number> = {
  [MealType.Breakfast]: 0,
  [MealType.Lunch]: 1,
  [MealType.Dinner]: 2,
  [MealType.Snack]: 3,
};

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning,';
  if (hour < 18) return 'Good afternoon,';
  return 'Good evening,';
}

// --- Sub-components ---

function AvatarButton({
  firstName,
  avatarUrl,
  onPress,
}: {
  firstName: string | undefined;
  avatarUrl: string | null | undefined;
  onPress: () => void;
}) {
  const initial = (firstName ?? '?')[0].toUpperCase();

  return (
    <Pressable onPress={onPress}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={{ width: 44, height: 44, borderRadius: 22 }}
        />
      ) : (
        <LinearGradient
          colors={colors.gradient.avatar}
          style={{ width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}
        >
          <AppText font="sansBold" className="text-[18px] text-white">
            {initial}
          </AppText>
        </LinearGradient>
      )}
    </Pressable>
  );
}

function QuickActions() {
  const tabNav = useNavigation<TabNav>();

  const actions = [
    {
      label: 'Scan Receipt',
      icon: ReceiptText,
      bgColor: colors.terra.pale,
      iconColor: colors.terra.DEFAULT,
      onPress: () => tabNav.navigate('PantryStack', { screen: 'ReceiptScan' }),
    },
    {
      label: 'Add Items',
      icon: Plus,
      bgColor: colors.sage.pale,
      iconColor: colors.sage.DEFAULT,
      onPress: () => tabNav.navigate('PantryStack'),
    },
    {
      label: 'AI Chef',
      icon: ChefHat,
      bgColor: colors.honey.pale,
      iconColor: colors.honey.DEFAULT,
      onPress: () => tabNav.navigate('AIChefStack'),
    },
  ];

  return (
    <View className="flex-row gap-2.5 px-6">
      {actions.map(action => (
        <Pressable
          key={action.label}
          onPress={action.onPress}
          className="flex-1 items-center gap-2 rounded-[18px] bg-white py-4 px-2"
          style={cardShadow}
        >
          <View
            className="h-10 w-10 items-center justify-center rounded-[14px]"
            style={{ backgroundColor: action.bgColor }}
          >
            <action.icon size={20} color={action.iconColor} />
          </View>
          <AppText font="sansBold" className="text-[11px] text-ink">
            {action.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

function ExpiringItemCard({ item }: { item: PantryItem }) {
  const days = daysUntilExpiry(item.expirationDate);
  const daysLeft = days ?? 0;
  const isCritical = daysLeft <= 1;
  const emoji = item.foodCache?.emoji;
  const initial = item.displayName[0].toUpperCase();

  const badgeBg = isCritical ? colors.berry.pale : colors.honey.pale;
  const badgeText = isCritical ? colors.berry.DEFAULT : colors.honey.DEFAULT;
  const label =
    daysLeft <= 0 ? 'Today' : daysLeft === 1 ? 'Tomorrow' : `${daysLeft} days`;

  return (
    <View
      className="items-center min-w-[100px] mr-2.5 gap-1.5 rounded-[18px] bg-white py-3.5 px-3"
      style={cardShadow}
    >
      {emoji ? (
        <Text className="text-[32px]">{emoji}</Text>
      ) : (
        <View className="h-10 w-10 items-center justify-center rounded-full bg-line">
          <AppText font="sansBold" className="text-[16px] text-stone">
            {initial}
          </AppText>
        </View>
      )}
      <AppText
        font="sansSemiBold"
        className="text-center text-[12px] text-espresso"
        numberOfLines={1}
      >
        {item.displayName}
      </AppText>
      <View
        className="py-0.5 px-2 rounded-[8px]"
        style={{ backgroundColor: badgeBg }}
      >
        <Text
          className="text-[10px] font-bold"
          style={{ color: badgeText }}
        >
          {label}
        </Text>
      </View>
    </View>
  );
}

function ExpiringList({
  items,
  onPress,
}: {
  items: PantryItem[];
  onPress: () => void;
}) {
  if (items.length === 0) return null;

  return (
    <View className="mt-6">
      <View className="mb-3 flex-row items-center justify-between px-6">
        <AppText font="serif" className="text-[18px] text-espresso">
          Expiring Soon
        </AppText>
        <Pressable onPress={onPress}>
          <AppText font="sansSemiBold" className="text-[13px] text-terra">
            View all
          </AppText>
        </Pressable>
      </View>
      <FlatList
        horizontal
        data={items}
        keyExtractor={item => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="px-6"
        renderItem={({ item }) => <ExpiringItemCard item={item} />}
      />
    </View>
  );
}

function MealRow({
  entry,
  onPress,
  showBorder,
}: {
  entry: MealPlanEntry;
  onPress: () => void;
  showBorder: boolean;
}) {
  const { recipe } = entry;
  const initial = recipe.title[0].toUpperCase();

  return (
    <Pressable
      onPress={onPress}
      className={`flex-row items-center gap-3.5 py-3.5 ${showBorder ? 'border-b border-line' : ''}`}
    >
      {/* Emoji / initial circle */}
      <View className="w-[52px] h-[52px] rounded-[16px] items-center justify-center bg-cream shrink-0">
        <Text className="text-[28px]">{initial}</Text>
      </View>

      <View className="flex-1">
        <AppText font="sansBold" className="text-[10px] uppercase tracking-[0.8px] text-terra">
          {entry.mealType}
        </AppText>
        <AppText
          font="serif"
          className="my-0.5 text-[16px] text-espresso"
          numberOfLines={1}
        >
          {recipe.title}
        </AppText>
        <View className="flex-row items-center">
          {recipe.nutrition?.calories != null && (
            <Text className="text-[12px] text-stone">
              {recipe.nutrition.calories} cal
            </Text>
          )}
          {recipe.nutrition?.calories != null && recipe.totalTimeMinutes > 0 && (
            <Text className="mx-1.5 text-[12px] text-stone">·</Text>
          )}
          {recipe.totalTimeMinutes > 0 && (
            <Text className="text-[12px] text-stone">
              {recipe.totalTimeMinutes} min
            </Text>
          )}
        </View>
      </View>

      {entry.isCooked && (
        <View className="flex-row items-center rounded-md bg-sage-pale px-2 py-1">
          <Check size={12} color={colors.sage.DEFAULT} />
          <Text className="ml-1 text-[11px] font-semibold text-sage">
            Cooked
          </Text>
        </View>
      )}

      <ChevronRight size={18} color={colors.dust} />
    </Pressable>
  );
}

function TodaysMeals() {
  const tabNav = useNavigation<TabNav>();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
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
          <ActivityIndicator size="small" color={colors.terra.DEFAULT} />
        </View>
      );
    }

    if (mealPlan?.status === 'error') {
      return (
        <View className="mx-6 items-center rounded-[18px] bg-white py-6" style={cardShadow}>
          <Text className="text-sm text-berry">
            Something went wrong generating your meal plan.
          </Text>
        </View>
      );
    }

    if (
      !mealPlan ||
      mealPlan.status === 'draft' ||
      todayEntries.length === 0
    ) {
      return (
        <View className="mx-6 items-center rounded-[18px] bg-white py-6" style={cardShadow}>
          <Text className="text-sm text-stone">No meal plan yet</Text>
          <Pressable onPress={() => tabNav.navigate('MealsStack')}>
            <AppText font="sansSemiBold" className="mt-2 text-sm text-terra">
              Generate Plan
            </AppText>
          </Pressable>
        </View>
      );
    }

    return (
      <View className="px-6">
        {todayEntries.map((entry, idx) => (
          <MealRow
            key={entry.id}
            entry={entry}
            showBorder={idx < todayEntries.length - 1}
            onPress={() =>
              navigation.navigate('RecipeDetail', {
                recipeId: entry.recipe.id,
                title: entry.recipe.title,
                entryId: entry.id,
                isCooked: entry.isCooked,
              })
            }
          />
        ))}
      </View>
    );
  };

  return (
    <View className="mt-7">
      <View className="mb-3 flex-row items-center justify-between px-6">
        <AppText font="serif" className="text-[18px] text-espresso">
          Today's Meals
        </AppText>
        <Pressable onPress={() => tabNav.navigate('MealsStack')}>
          <AppText font="sansSemiBold" className="text-[13px] text-terra">
            Full plan
          </AppText>
        </Pressable>
      </View>
      {renderContent()}
    </View>
  );
}

function PantrySnapshot({
  pantryItemCount,
  expiringCount,
  lowStockCount,
  onOpen,
}: {
  pantryItemCount: number;
  expiringCount: number;
  lowStockCount: number;
  onOpen: () => void;
}) {
  const stats = [
    { label: 'Items', value: pantryItemCount, color: colors.terra.DEFAULT },
    { label: 'Expiring', value: expiringCount, color: colors.honey.DEFAULT },
    { label: 'Low Stock', value: lowStockCount, color: colors.berry.DEFAULT },
  ];

  return (
    <View
      className="mt-7 mx-6 mb-6 py-[18px] px-5 rounded-[22px] bg-white"
      style={cardShadow}
    >
      <View className="mb-3.5 flex-row items-center justify-between">
        <AppText font="serif" className="text-[16px] text-espresso">
          Pantry
        </AppText>
        <Pressable onPress={onOpen}>
          <AppText font="sansSemiBold" className="text-[13px] text-terra">
            Open
          </AppText>
        </Pressable>
      </View>
      <View className="flex-row justify-around">
        {stats.map(stat => (
          <View key={stat.label} className="items-center">
            <AppText
              font="serifHeavy"
              className="text-[24px]"
              style={{ color: stat.color }}
            >
              {stat.value}
            </AppText>
            <AppText className="mt-0.5 text-[11px] text-stone">
              {stat.label}
            </AppText>
          </View>
        ))}
      </View>
    </View>
  );
}

// --- Main Screen ---

export default function HomeScreen() {
  const navigation = useNavigation<TabNav>();
  const { data: profile, isLoading: profileLoading } = useUserProfileQuery();
  const { data: pantryItems, isLoading: pantryLoading } = usePantryQuery();

  if (profileLoading || pantryLoading) {
    return <LoadingScreen color={colors.terra.DEFAULT} />;
  }

  const expiringItems = (pantryItems ?? []).filter(item => {
    const status = getExpiryStatus(item.expirationDate);
    return status === 'expired' || status === 'soon';
  });

  const lowStockCount = (pantryItems ?? []).filter(
    item => item.quantity <= 1,
  ).length;

  return (
    <SafeAreaView className="flex-1 bg-ivory" edges={['top']}>
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerClassName="pb-28"
      >
        {/* Greeting + Quick Actions inside gradient */}
        <LinearGradient colors={colors.gradient.warmBackground}>
          <View className="flex-row items-center justify-between px-6 pt-5 mb-5">
            <View>
              <AppText className="text-[14px] text-stone">
                {getGreeting()}
              </AppText>
              <AppText font="serifHeavy" className="mt-0.5 text-[28px] tracking-[-0.3px] text-espresso">
                {profile?.firstName ?? 'Chef'}
              </AppText>
            </View>
            <AvatarButton
              firstName={profile?.firstName}
              avatarUrl={profile?.avatarUrl}
              onPress={() => navigation.navigate('ProfileStack')}
            />
          </View>

          <View className="pb-6">
            <QuickActions />
          </View>
        </LinearGradient>

        {/* Expiring items */}
        <ExpiringList
          items={expiringItems}
          onPress={() => navigation.navigate('PantryStack')}
        />

        {/* Today's meals */}
        <TodaysMeals />

        {/* Pantry snapshot */}
        <PantrySnapshot
          pantryItemCount={(pantryItems ?? []).length}
          expiringCount={expiringItems.length}
          lowStockCount={lowStockCount}
          onOpen={() => navigation.navigate('PantryStack')}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
