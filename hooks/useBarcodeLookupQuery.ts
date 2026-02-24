import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import type { FoodSearchResult } from './useFoodSearchQuery';

export function useBarcodeLookupQuery(barcode: string | null) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.FOOD_BARCODE(barcode ?? ''),
    queryFn: () =>
      api.get<FoodSearchResult>(ROUTES.FOOD.BARCODE(barcode!)),
    enabled: !!barcode && isAuthenticated,
  });
}
