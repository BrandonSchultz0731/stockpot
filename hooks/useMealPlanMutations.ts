import { useMutation, useQueryClient } from '@tanstack/react-query';
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
