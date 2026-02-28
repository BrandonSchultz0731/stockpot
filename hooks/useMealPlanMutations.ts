import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { getCurrentWeekStartDate } from '../utils/dayOfWeek';
import type { MealPlan, MealPlanEntry } from './useCurrentMealPlanQuery';
import type { Difficulty, MealType } from '../shared/enums';
import type { ShoppingListResponse } from './useShoppingListQuery';

export interface GenerateMealPlanRequest {
  weekStartDate: string;
  mealTypes?: MealType[];
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
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEAL_PLANS.WEEK(variables.weekStartDate),
      });
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
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEAL_PLANS.WEEK(getCurrentWeekStartDate()),
      });
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
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEAL_PLANS.WEEK(getCurrentWeekStartDate()),
      });
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
}

export interface ConfirmCookResponse {
  entryId: string;
  isCooked: boolean;
  pantryUpdated: number;
  pantryRemoved: number;
}

export function useCookPreviewQuery(entryId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.MEAL_PLANS.COOK_PREVIEW(entryId),
    queryFn: () =>
      api.post<CookPreviewResponse>(ROUTES.MEAL_PLANS.COOK_PREVIEW(entryId)),
    staleTime: 5 * 60 * 1000, // 5 minutes — avoid repeat AI calls
  });
}

export function useConfirmCookMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ entryId, deductions }: ConfirmCookRequest) =>
      api.post<ConfirmCookResponse>(
        ROUTES.MEAL_PLANS.COOK_CONFIRM(entryId),
        { deductions },
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEAL_PLANS.WEEK(getCurrentWeekStartDate()),
      });
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
        const toBuy = items.filter((i) => !i.inPantry).length;
        const alreadyHave = items.filter((i) => i.inPantry).length;
        return {
          ...old,
          items,
          summary: { toBuy, alreadyHave, total: items.length },
        };
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

export function useUnsaveRecipeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (recipeId: string) =>
      api.delete(ROUTES.RECIPES.SAVE(recipeId)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.RECIPES.SAVED });
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.MEAL_PLANS.WEEK(getCurrentWeekStartDate()),
      });
    },
  });
}
