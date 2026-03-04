import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import type { MealPlan } from './useCurrentMealPlanQuery';

export function useMealPlanByWeekQuery(weekStartDate: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.MEAL_PLANS.WEEK(weekStartDate ?? ''),
    queryFn: async () => {
      try {
        return await api.get<MealPlan>(ROUTES.MEAL_PLANS.WEEK(weekStartDate!));
      } catch (err: unknown) {
        if ((err as { status?: number })?.status === 404) return null;
        throw err;
      }
    },
    enabled: isAuthenticated && weekStartDate != null,
  });
}
