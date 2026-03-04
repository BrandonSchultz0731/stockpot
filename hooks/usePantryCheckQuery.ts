import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import type { PantryStatus, RecipeIngredient } from '../shared/enums';

/**
 * Re-checks pantry status for a recipe's ingredients at a given scale.
 * When scale is 1, returns the original ingredients unchanged (no network call).
 */
export function usePantryCheckQuery(
  recipeId: string,
  ingredients: RecipeIngredient[] | undefined,
  scale: number,
): RecipeIngredient[] {
  const { isAuthenticated } = useAuth();

  // Debounce the scale so rapid stepper taps don't spam requests
  const [debouncedScale, setDebouncedScale] = useState(1);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setDebouncedScale(scale);
    }, 500);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scale]);

  const { data: pantryCheckData } = useQuery({
    queryKey: QUERY_KEYS.RECIPES.PANTRY_CHECK(recipeId, debouncedScale),
    queryFn: () =>
      api.post<Record<string, PantryStatus>>(ROUTES.RECIPES.PANTRY_CHECK(recipeId), {
        scale: debouncedScale,
      }),
    enabled: isAuthenticated && !!ingredients && debouncedScale !== 1,
  });

  if (!ingredients) return [];

  if (debouncedScale !== 1 && pantryCheckData) {
    return ingredients.map((ing, i) => ({
      ...ing,
      pantryStatus: pantryCheckData[i] ?? ing.pantryStatus,
    }));
  }

  return ingredients;
}
