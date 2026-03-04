import { Alert } from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import type { MealPlan, MealPlanEntry } from './useCurrentMealPlanQuery';
import { countByPantryStatus } from '../shared/pantryStatusCounts';
import type { Difficulty, MealType, MealScheduleSlot } from '../shared/enums';
import type { ShoppingListResponse } from './useShoppingListQuery';

export interface GenerateMealPlanRequest {
  weekStartDate: string;
  mealTypes?: MealType[];
  mealSchedule?: MealScheduleSlot[];
  servingsPerMeal?: number;
  cuisine?: string;
  difficulty?: Difficulty;
  dietaryFlags?: string[];
}

export function useGenerateMealPlanMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GenerateMealPlanRequest) =>
      api.post<MealPlan>(ROUTES.MEAL_PLANS.GENERATE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEAL_PLANS.ALL });
    },
  });
}

export interface AddMealPlanEntryRequest {
  mealPlanId: string;
  dayOfWeek: number;
  mealType: MealType;
  url?: string;
  imageBase64?: string;
  mimeType?: string;
}

export function useAddMealPlanEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddMealPlanEntryRequest) =>
      api.post<MealPlanEntry>(ROUTES.MEAL_PLANS.ADD_ENTRY, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEAL_PLANS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SHOPPING_LISTS.ALL });
    },
    onError: (error: any) => {
      const message =
        error?.message || 'Something went wrong';
      Alert.alert('Failed to Add Meal', message);
    },
  });
}

export interface SwapMealPlanEntryRequest {
  entryId: string;
  data?: {
    cuisine?: string;
    difficulty?: Difficulty;
    dietaryFlags?: string[];
  };
}

export function useSwapMealPlanEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, data }: SwapMealPlanEntryRequest) =>
      api.post<MealPlanEntry>(ROUTES.MEAL_PLANS.SWAP_ENTRY(entryId), data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEAL_PLANS.ALL });
    },
  });
}

export function useSaveRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) =>
      api.post(ROUTES.RECIPES.SAVE(recipeId), { isFavorite: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RECIPES.SAVED });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEAL_PLANS.ALL });
    },
  });
}

// ---------------------------------------------------------------------------
// Cook preview / confirm
// ---------------------------------------------------------------------------

export interface CookDeductionSuggestion {
  recipeIngredientName: string;
  pantryItemId: string | null;
  pantryItemName: string;
  currentQuantity: number;
  currentUnit: string;
  deductQuantity: number;
  deductUnit: string;
  notes: string;
}

export interface CookPreviewResponse {
  entryId: string;
  recipeTitle: string;
  deductions: CookDeductionSuggestion[];
}

export interface ConfirmCookRequest {
  entryId: string;
  deductions: {
    pantryItemId: string;
    deductQuantity: number;
    deductUnit: string;
  }[];
  servingsToCook?: number;
  servingsToEat?: number;
}

export interface ConfirmCookResponse {
  entryId: string;
  isCooked: boolean;
  pantryUpdated: number;
  pantryRemoved: number;
}

export function useCookPreviewQuery(entryId: string, servingsToCook?: number) {
  return useQuery({
    queryKey: QUERY_KEYS.MEAL_PLANS.COOK_PREVIEW(entryId, servingsToCook),
    queryFn: () =>
      api.post<CookPreviewResponse>(
        ROUTES.MEAL_PLANS.COOK_PREVIEW(entryId),
        servingsToCook ? { servingsToCook } : undefined,
      ),
    staleTime: 30 * 1000, // 30 seconds — most deductions are instant
  });
}

export function useConfirmCookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, deductions, servingsToCook, servingsToEat }: ConfirmCookRequest) =>
      api.post<ConfirmCookResponse>(
        ROUTES.MEAL_PLANS.COOK_CONFIRM(entryId),
        { deductions, servingsToCook, servingsToEat },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEAL_PLANS.ALL });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.PANTRY_ITEMS,
      });
    },
  });
}

// ---------------------------------------------------------------------------
// Shopping list mutations
// ---------------------------------------------------------------------------

export function useToggleShoppingListItemMutation(mealPlanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, itemId }: { listId: string; itemId: string }) =>
      api.patch(ROUTES.SHOPPING_LISTS.TOGGLE_ITEM(listId, itemId)),
    onMutate: async ({ itemId }) => {
      const queryKey = QUERY_KEYS.SHOPPING_LISTS.BY_MEAL_PLAN(mealPlanId);
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old: ShoppingListResponse | null | undefined) => {
        if (!old) return old;
        const items = old.items.map((i) =>
          i.id === itemId ? { ...i, isChecked: !i.isChecked } : i,
        );
        const counts = countByPantryStatus(items);
        const summary = { toBuy: counts.none, low: counts.low, alreadyHave: counts.enough, total: items.length };
        return { ...old, items, summary };
      });

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          QUERY_KEYS.SHOPPING_LISTS.BY_MEAL_PLAN(mealPlanId),
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.SHOPPING_LISTS.BY_MEAL_PLAN(mealPlanId),
      });
    },
  });
}

export interface AddCustomShoppingListItemRequest {
  listId: string;
  displayName: string;
  quantity: number;
  unit: string;
}

export function useAddCustomShoppingListItemMutation(mealPlanId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ listId, displayName, quantity, unit }: AddCustomShoppingListItemRequest) =>
      api.post<ShoppingListResponse>(ROUTES.SHOPPING_LISTS.ADD_ITEM(listId), {
        displayName,
        quantity,
        unit,
      }),
    onSuccess: (data) => {
      queryClient.setQueryData(
        QUERY_KEYS.SHOPPING_LISTS.BY_MEAL_PLAN(mealPlanId),
        data,
      );
    },
    onError: (error: any) => {
      const message = error?.message || 'Something went wrong';
      Alert.alert('Failed to Add Item', message);
    },
  });
}

export function useUnsaveRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) =>
      api.delete(ROUTES.RECIPES.SAVE(recipeId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RECIPES.SAVED });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEAL_PLANS.ALL });
    },
  });
}

// ---------------------------------------------------------------------------
// Leftovers
// ---------------------------------------------------------------------------

export interface AvailableLeftover {
  sourceEntryId: string;
  recipeId: string;
  recipeTitle: string;
  recipeImageUrl: string | null;
  availableServings: number;
}

export function useAvailableLeftoversQuery(planId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.MEAL_PLANS.LEFTOVERS(planId ?? ''),
    queryFn: () =>
      api.get<AvailableLeftover[]>(ROUTES.MEAL_PLANS.LEFTOVERS(planId!)),
    enabled: !!planId,
  });
}

export interface AddLeftoverEntryRequest {
  mealPlanId: string;
  sourceEntryId: string;
  dayOfWeek: number;
  mealType: MealType;
  servings: number;
}

export function useAddLeftoverEntryMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AddLeftoverEntryRequest) =>
      api.post<MealPlanEntry>(ROUTES.MEAL_PLANS.ADD_LEFTOVER, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEAL_PLANS.ALL });
    },
    onError: (error: unknown) => {
      const message =
        (error as { message?: string })?.message || 'Something went wrong';
      Alert.alert('Failed to Add Leftover', message);
    },
  });
}
