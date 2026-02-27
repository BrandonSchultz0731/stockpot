import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Info, Minus, Plus, Square, SquareCheck } from 'lucide-react-native';
import colors from '../../theme/colors';
import { api } from '../../services/api';
import { ROUTES } from '../../services/routes';
import { QUERY_KEYS } from '../../services/queryKeys';
import { getCurrentWeekStartDate } from '../../utils/dayOfWeek';
import {
  useCookPreviewQuery,
  useConfirmCookMutation,
  type CookDeductionSuggestion,
} from '../../hooks/useMealPlanMutations';
import type { MealsStackParamList } from '../../navigation/types';

type ScreenProps = NativeStackScreenProps<MealsStackParamList, 'CookedReview'>;

interface DeductionRow extends CookDeductionSuggestion {
  checked: boolean;
  adjustedQuantity: number;
}

function formatQuantity(qty: number): string {
  if (qty === 0) return '0';
  if (Number.isInteger(qty)) return String(qty);
  return qty % 1 === 0 ? String(qty) : qty.toFixed(2).replace(/0+$/, '').replace(/\.$/, '');
}

export default function CookedReviewScreen() {
  const navigation =
    useNavigation<NativeStackNavigationProp<MealsStackParamList>>();
  const route = useRoute<ScreenProps['route']>();
  const { entryId } = route.params;
  const queryClient = useQueryClient();

  const { data: preview, isPending: isPreviewLoading, isError: isPreviewError } = useCookPreviewQuery(entryId);
  const confirmMutation = useConfirmCookMutation();

  const [rows, setRows] = useState<DeductionRow[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (preview && !initializedRef.current) {
      initializedRef.current = true;
      setRows(
        preview.deductions.map((d) => ({
          ...d,
          checked: d.pantryItemId != null,
          adjustedQuantity: d.deductQuantity,
        })),
      );
    }
  }, [preview]);

  const toggleRow = useCallback((index: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, checked: !r.checked } : r)),
    );
  }, []);

  const adjustQuantity = useCallback(
    (index: number, delta: number) => {
      setRows((prev) =>
        prev.map((r, i) => {
          if (i !== index) return r;
          const next = Math.round((r.adjustedQuantity + delta) * 100) / 100;
          const clamped = Math.max(0, Math.min(next, r.currentQuantity));
          return { ...r, adjustedQuantity: clamped };
        }),
      );
    },
    [],
  );

  const checkedRows = rows.filter((r) => r.checked && r.pantryItemId);
  const checkedCount = checkedRows.length;
  const totalCount = rows.length;

  const handleConfirm = useCallback(() => {
    const deductions = checkedRows.map((r) => ({
      pantryItemId: r.pantryItemId!,
      deductQuantity: r.adjustedQuantity,
      deductUnit: r.deductUnit,
    }));

    confirmMutation.mutate(
      { entryId, deductions },
      {
        onSuccess: () => {
          navigation.popToTop();
        },
      },
    );
  }, [checkedRows, confirmMutation, entryId, navigation]);

  const handleSkip = useCallback(async () => {
    await api.patch(ROUTES.MEAL_PLANS.UPDATE_ENTRY(entryId), {
      isCooked: true,
    });
    queryClient.invalidateQueries({
      queryKey: QUERY_KEYS.MEAL_PLANS.WEEK(getCurrentWeekStartDate()),
    });
    navigation.popToTop();
  }, [entryId, navigation, queryClient]);

  const recipeTitle = preview?.recipeTitle ?? '';

  // Loading state
  if (isPreviewLoading) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-cream">
        <View className="flex-row items-center px-5 py-3">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <ChevronLeft size={22} color={colors.navy.DEFAULT} />
          </Pressable>
          <Text className="ml-3 text-[18px] font-bold text-navy">
            Update Pantry
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={colors.orange.DEFAULT} />
          <Text className="mt-4 text-[14px] text-muted">
            Analyzing recipe ingredients...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (isPreviewError) {
    return (
      <SafeAreaView edges={['top']} className="flex-1 bg-cream">
        <View className="flex-row items-center px-5 py-3">
          <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
            <ChevronLeft size={22} color={colors.navy.DEFAULT} />
          </Pressable>
          <Text className="ml-3 text-[18px] font-bold text-navy">
            Update Pantry
          </Text>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <Text className="text-center text-[14px] text-muted">
            Failed to load deduction suggestions.
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
      <View className="flex-row items-center px-5 py-3">
        <Pressable onPress={() => navigation.goBack()} hitSlop={8}>
          <ChevronLeft size={22} color={colors.navy.DEFAULT} />
        </Pressable>
        <View className="ml-3 flex-1">
          <Text className="text-[18px] font-bold text-navy">
            Update Pantry
          </Text>
          {recipeTitle ? (
            <Text className="text-[13px] text-muted" numberOfLines={1}>
              {recipeTitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Info banner */}
      <View className="mx-4 mb-3 flex-row items-start rounded-[14px] bg-orange-pale px-4 py-3">
        <Info size={16} color={colors.orange.DEFAULT} className="mt-0.5" />
        <Text className="ml-2.5 flex-1 text-[12px] leading-[18px] text-body">
          We estimated how much of each ingredient was used. Adjust quantities
          or uncheck items you don't want to deduct.
        </Text>
      </View>

      {/* Ingredient rows */}
      <FlatList
        data={rows}
        keyExtractor={(_, i) => String(i)}
        className="flex-1"
        contentContainerClassName="px-4 pb-4"
        renderItem={({ item, index }) => (
          <View
            className={`mb-2 rounded-[14px] border border-border bg-white p-3.5 ${
              !item.checked ? 'opacity-50' : ''
            }`}
          >
            <Pressable
              onPress={() => toggleRow(index)}
              className="flex-row items-center"
            >
              {item.checked ? (
                <SquareCheck
                  size={22}
                  color={colors.success.DEFAULT}
                  fill={colors.success.DEFAULT}
                />
              ) : (
                <Square size={22} color={colors.border} />
              )}
              <View className="ml-3 flex-1">
                <Text className="text-[14px] font-semibold text-dark">
                  {item.recipeIngredientName}
                </Text>
                {item.pantryItemId == null && (
                  <View className="mt-1 self-start rounded bg-danger-pale px-1.5 py-0.5">
                    <Text className="text-[10px] font-bold uppercase text-danger">
                      Not in pantry
                    </Text>
                  </View>
                )}
              </View>
            </Pressable>

            {item.checked && item.pantryItemId != null && (
              <View className="mt-3 flex-row items-center justify-center">
                <Pressable
                  onPress={() => adjustQuantity(index, -0.25)}
                  className="h-8 w-8 items-center justify-center rounded-lg border border-border"
                >
                  <Minus size={14} color={colors.dark} />
                </Pressable>
                <Text className="mx-4 min-w-[48px] text-center text-[18px] font-bold text-orange">
                  {formatQuantity(item.adjustedQuantity)}
                </Text>
                <Pressable
                  onPress={() => adjustQuantity(index, 0.25)}
                  className="h-8 w-8 items-center justify-center rounded-lg border border-border"
                >
                  <Plus size={14} color={colors.dark} />
                </Pressable>
                <Text className="ml-2 text-[13px] text-muted">
                  {item.deductUnit}
                </Text>
              </View>
            )}

            {item.notes ? (
              <Text className="mt-2 text-[11px] text-muted">{item.notes}</Text>
            ) : null}
          </View>
        )}
      />

      {/* Footer */}
      <View className="border-t border-border bg-white px-4 pb-6 pt-4">
        <Text className="mb-3 text-center text-[13px] text-muted">
          {checkedCount} of {totalCount} ingredients will be deducted
        </Text>
        <Pressable
          onPress={handleConfirm}
          disabled={confirmMutation.isPending}
          className={`mb-2.5 items-center rounded-[14px] bg-success py-3.5 ${
            confirmMutation.isPending ? 'opacity-50' : ''
          }`}
        >
          {confirmMutation.isPending ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-[15px] font-bold text-white">
              Confirm & Update Pantry
            </Text>
          )}
        </Pressable>
        <Pressable onPress={handleSkip} className="items-center py-2">
          <Text className="text-[13px] font-semibold text-muted">
            Skip — Don't update pantry
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
