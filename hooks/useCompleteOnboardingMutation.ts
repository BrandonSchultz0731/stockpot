import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import type { OnboardingData } from '../contexts/OnboardingContext';

export function useCompleteOnboardingMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: OnboardingData) =>
      api.patch(ROUTES.USERS.COMPLETE_ONBOARDING, {
        dietaryProfile: {
          diets: data.diets,
          excludedIngredients: data.excludedIngredients,
          householdSize: data.householdSize,
          cookingSkill: data.cookingSkill,
        },
        nutritionalGoals: {
          goalType: data.goalType,
          dailyCalories: data.dailyCalories,
          dailyProteinGrams: data.dailyProteinGrams,
          dailyCarbsGrams: data.dailyCarbsGrams,
          dailyFatGrams: data.dailyFatGrams,
        },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
    },
  });
}
