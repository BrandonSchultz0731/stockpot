import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import type { MealType, Recipe } from '../shared/enums';

export type MealPlanRecipe = Omit<Recipe, 'steps' | 'tags' | 'dietaryFlags'>;

export interface MealPlanEntry {
  id: string;
  dayOfWeek: number;
  mealType: MealType;
  servings: number;
  servingsToCook: number | null;
  leftoverSourceEntryId: string | null;
  leftoverEntries?: MealPlanEntry[];
  isLocked: boolean;
  isCooked: boolean;
  recipe: MealPlanRecipe;
}

export interface MealPlan {
  id: string;
  weekStartDate: string;
  status: string;
  source: string;
  entries: MealPlanEntry[];
}

/** How many servings this person eats — only differs from 1 when the user explicitly adjusted via stepper. */
export function getEatServings(entry: MealPlanEntry): number {
  return entry.servingsToCook != null ? entry.servings : 1;
}

export function useCurrentMealPlanQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.MEAL_PLANS.CURRENT,
    queryFn: async () => {
      try {
        return await api.get<MealPlan>(ROUTES.MEAL_PLANS.CURRENT);
      } catch (err: any) {
        // 404 means no plan — return null instead of throwing
        if (err?.status === 404) return null;
        throw err;
      }
    },
    enabled: isAuthenticated,
  });
}
