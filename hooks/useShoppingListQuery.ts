import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import type { ShoppingListItem } from '../shared/enums';

export type { ShoppingListItem };

export interface ShoppingListResponse {
  id: string;
  mealPlanId: string;
  items: ShoppingListItem[];
  summary: {
    toBuy: number;
    low: number;
    alreadyHave: number;
    total: number;
  };
}

export function useShoppingListQuery(mealPlanId: string | undefined) {
  return useQuery({
    queryKey: QUERY_KEYS.SHOPPING_LISTS.BY_MEAL_PLAN(mealPlanId ?? ''),
    queryFn: async () => {
      try {
        return await api.get<ShoppingListResponse>(
          ROUTES.SHOPPING_LISTS.BY_MEAL_PLAN(mealPlanId!),
        );
      } catch (err: any) {
        if (err?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!mealPlanId,
    refetchInterval: (query) => {
      // Shopping list generates in the background after the plan becomes active.
      // Poll until it appears.
      if (query.state.data === null) return 3000;
      return false;
    },
  });
}
