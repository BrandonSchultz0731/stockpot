import { useCallback, useMemo } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SectionList,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  AlertTriangle,
  Camera,
  ChevronLeft,
  Share2,
  Square,
  SquareCheck,
  Plus,
} from 'lucide-react-native';
import colors from '../../theme/colors';
import { PantryStatus, FOOD_CATEGORIES } from '../../shared/enums';
import type { ShoppingListItem } from '../../shared/enums';
import type { MealsStackParamList } from '../../navigation/types';
import {
  useShoppingListQuery,
} from '../../hooks/useShoppingListQuery';
import {
  useToggleShoppingListItemMutation,
} from '../../hooks/useMealPlanMutations';
import { formatWeekDateRange } from './MealPlanComponents';

type ScreenProps = NativeStackScreenProps<MealsStackParamList, 'ShoppingList'>;

interface Section {
  title: string;
  toBuyCount: number;
  data: ShoppingListItem[];
}

export default function ShoppingListScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MealsStackParamList>>();
  const route = useRoute<ScreenProps['route']>();
  const { mealPlanId, weekStartDate } = route.params;

  const { data: shoppingList, isPending, isError } =
    useShoppingListQuery(mealPlanId);

  const toggleMutation = useToggleShoppingListItemMutation(mealPlanId);

  const sections: Section[] = useMemo(() => {
    if (!shoppingList?.items) return [];

    const categoryOrder = new Map(
      FOOD_CATEGORIES.map((cat, idx) => [cat, idx]),
    );

    const grouped = new Map<string, ShoppingListItem[]>();
    for (const item of shoppingList.items) {
      const cat = item.category || 'Other';
      if (!grouped.has(cat)) grouped.set(cat, []);
      grouped.get(cat)!.push(item);
    }

    return Array.from(grouped.entries())
      .sort(
        ([a], [b]) =>
          (categoryOrder.get(a) ?? 999) - (categoryOrder.get(b) ?? 999),
      )
      .map(([title, data]) => ({
        title,
        toBuyCount: data.filter((i) => i.pantryStatus !== PantryStatus.Enough).length,
        data,
      }));
  }, [shoppingList?.items]);

  const handleToggle = useCallback(
    (itemId: string) => {
      if (!shoppingList) return;
      toggleMutation.mutate({ listId: shoppingList.id, itemId });
    },
    [shoppingList, toggleMutation],
  );

  const handleScanReceipt = useCallback(() => {
    navigation.navigate('ReceiptScan');
  }, [navigation]);

  const handleDone = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const weekLabel = formatWeekDateRange(weekStartDate);
  const summary = shoppingList?.summary;

  // Loading
  if (isPending) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-cream">
        <View className="flex-row items-center px-5 py-3">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <ChevronLeft size={22} color={colors.navy.DEFAULT} />
          </Pressable>
          <Text className="ml-3 text-[18px] font-bold text-navy">
            Shopping List
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.orange.DEFAULT} />
        </View>
      </SafeAreaView>
    );
  }

  // Error
  if (isError || !shoppingList) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-cream">
        <View className="flex-row items-center px-5 py-3">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <ChevronLeft size={22} color={colors.navy.DEFAULT} />
          </Pressable>
          <Text className="ml-3 text-[18px] font-bold text-navy">
            Shopping List
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[14px] text-muted">
            No shopping list available yet. Generate a meal plan first.
          </Text>
          <Pressable onPress={() => navigation.goBack()} className="mt-3">
            <Text className="text-[14px] font-semibold text-orange">
              Go Back
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-cream">
      {/* Header */}
      <View className="flex-row items-center justify-between px-5 py-3">
        <View className="flex-row items-center flex-1">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <ChevronLeft size={22} color={colors.navy.DEFAULT} />
          </Pressable>
          <View className="ml-3 flex-1">
            <Text className="text-[18px] font-bold text-navy">
              Shopping List
            </Text>
            <Text className="text-[13px] text-muted">{weekLabel}</Text>
          </View>
        </View>
        <Pressable
          hitSlop={8}
          className="h-8 w-8 items-center justify-center rounded-full bg-cream opacity-50"
        >
          <Share2 size={18} color={colors.navy.DEFAULT} />
        </Pressable>
      </View>

      {/* Summary Card */}
      {summary && (
        <View className="mx-4 mb-3 flex-row justify-around rounded-[14px] border border-border bg-white px-4 py-3.5">
          <View className="items-center">
            <Text className="text-[20px] font-bold text-orange">
              {summary.toBuy}
            </Text>
            <Text className="mt-0.5 text-[10px] text-muted">To Buy</Text>
          </View>
          {summary.low > 0 && (
            <View className="items-center">
              <Text className="text-[20px] font-bold" style={{ color: colors.warning.icon }}>
                {summary.low}
              </Text>
              <Text className="mt-0.5 text-[10px] text-muted">Low</Text>
            </View>
          )}
          <View className="items-center">
            <Text className="text-[20px] font-bold text-success">
              {summary.alreadyHave}
            </Text>
            <Text className="mt-0.5 text-[10px] text-muted">Have</Text>
          </View>
          <View className="items-center">
            <Text className="text-[20px] font-bold text-navy">
              {summary.total}
            </Text>
            <Text className="mt-0.5 text-[10px] text-muted">Total</Text>
          </View>
        </View>
      )}

      {/* Section List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        className="flex-1"
        contentContainerClassName="px-4 pb-4"
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View className="mt-3 mb-1.5 flex-row items-center justify-between">
            <Text className="text-[13px] font-bold uppercase tracking-[0.5px] text-navy">
              {section.title}
            </Text>
            {section.toBuyCount > 0 && (
              <View className="rounded-full bg-orange-pale px-2 py-0.5">
                <Text className="text-[10px] font-bold text-orange">
                  {section.toBuyCount} to buy
                </Text>
              </View>
            )}
          </View>
        )}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => handleToggle(item.id)}
            className={`mb-1.5 flex-row items-center rounded-[14px] border border-border bg-white px-3.5 py-3 ${item.pantryStatus === PantryStatus.Enough ? 'opacity-60' : ''
              }`}
          >
            {item.isChecked ? (
              <SquareCheck
                size={22}
                color={colors.success.DEFAULT}
                fill={colors.success.DEFAULT}
              />
            ) : (
              <Square size={22} color={colors.border} />
            )}
            <View className="ml-3 flex-1">
              <Text
                className={`text-[14px] font-semibold ${item.pantryStatus === PantryStatus.Enough
                    ? 'text-muted line-through'
                    : 'text-dark'
                  }`}
                numberOfLines={1}
              >
                {item.displayName}
              </Text>
            </View>
            <View className="ml-2 items-end">
              <Text className="text-[12px] text-muted">
                {item.neededQuantity} {item.unit}
              </Text>
              {item.pantryStatus === PantryStatus.Low && (
                <Text className="text-[10px] text-muted">
                  have {Math.round((item.quantity - item.neededQuantity) * 100) / 100} {item.unit}
                </Text>
              )}
            </View>
            {item.pantryStatus === PantryStatus.Low && (
              <View className="ml-2 flex-row items-center rounded bg-warning-pale px-1.5 py-0.5">
                <AlertTriangle size={8} color={colors.warning.icon} />
                <Text className="ml-0.5 text-[9px] font-bold uppercase" style={{ color: colors.warning.icon }}>
                  Low
                </Text>
              </View>
            )}
            {item.pantryStatus === PantryStatus.Enough && (
              <View className="ml-2 rounded bg-success-pale px-1.5 py-0.5">
                <Text className="text-[9px] font-bold uppercase text-success">
                  Have
                </Text>
              </View>
            )}
          </Pressable>
        )}
        ListFooterComponent={
          <View className="mt-4 mb-2 flex-row items-center justify-center rounded-[14px] border-2 border-dashed border-border py-3.5 opacity-50">
            <Plus size={16} color={colors.muted} />
            <Text className="ml-2 text-[13px] font-semibold text-muted">
              Add Custom Item
            </Text>
          </View>
        }
      />

      {/* Sticky Footer */}
      <View className="border-t border-border bg-white px-4 pb-6 pt-4">
        <Pressable
          onPress={handleScanReceipt}
          className="mb-2.5 flex-row items-center justify-center rounded-[14px] bg-success py-3.5"
        >
          <Camera size={18} color="#fff" />
          <Text className="ml-2 text-[15px] font-bold text-white">
            Scan Receipt to Add to Pantry
          </Text>
        </Pressable>
        <Pressable onPress={handleDone} className="items-center py-2">
          <Text className="text-[13px] font-semibold text-muted">
            Done
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
