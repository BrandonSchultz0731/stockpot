import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { getCurrentWeekStartDate } from '../utils/dayOfWeek';
import type { MealPlan, MealPlanEntry } from './useCurrentMealPlanQuery';
import type { Difficulty, MealType } from '../shared/enums';

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
