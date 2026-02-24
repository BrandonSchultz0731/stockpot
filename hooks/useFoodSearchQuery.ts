import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';

export interface FoodSearchResult {
  id: string;
  fdcId: number | null;
  name: string;
  usdaDescription: string | null;
  category: string | null;
  brand: string | null;
  barcode: string | null;
}

function useDebouncedValue(value: string, delayMs: number): string {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}

export function useFoodSearchQuery(query: string, limit = 20) {
  const { isAuthenticated } = useAuth();
  const trimmed = useDebouncedValue(query.trim(), 500);

  return useQuery({
    queryKey: QUERY_KEYS.FOOD_SEARCH(trimmed),
    queryFn: () =>
      api.get<FoodSearchResult[]>(
        `${ROUTES.FOOD.SEARCH}?q=${encodeURIComponent(trimmed)}&limit=${limit}`,
      ),
    enabled: trimmed.length >= 2 && isAuthenticated,
  });
}
