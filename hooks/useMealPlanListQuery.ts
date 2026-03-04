import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';

export interface MealPlanSummary {
  id: string;
  weekStartDate: string;
  status: string;
}

export function useMealPlanListQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.MEAL_PLANS.LIST,
    queryFn: () => api.get<MealPlanSummary[]>(ROUTES.MEAL_PLANS.LIST),
    enabled: isAuthenticated,
  });
}
