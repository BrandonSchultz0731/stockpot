import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import { getCurrentWeekStartDate } from '../utils/dayOfWeek';
import type { MealType, RecipeIngredient, RecipeNutrition } from '../shared/enums';

export interface MealPlanRecipe {
  id: string;
  title: string;
  description: string;
  prepTimeMinutes: number;
  cookTimeMinutes: number;
  totalTimeMinutes: number;
  servings: number;
  difficulty: string;
  cuisine: string;
  mealType: MealType;
  ingredients: RecipeIngredient[];
  nutrition: RecipeNutrition | null;
}

export interface MealPlanEntry {
  id: string;
  dayOfWeek: number;
  mealType: MealType;
  servings: number;
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

export function useCurrentMealPlanQuery() {
  const { isAuthenticated } = useAuth();
  const weekStart = getCurrentWeekStartDate();

  return useQuery({
    queryKey: QUERY_KEYS.MEAL_PLANS.WEEK(weekStart),
    queryFn: async () => {
      try {
        return await api.get<MealPlan>(ROUTES.MEAL_PLANS.WEEK(weekStart));
      } catch (err: any) {
        // 404 means no plan for this week — return null instead of throwing
        if (err?.status === 404) return null;
        throw err;
      }
    },
    enabled: isAuthenticated,
  });
}
