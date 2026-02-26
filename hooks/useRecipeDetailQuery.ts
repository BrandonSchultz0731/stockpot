import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import type { Recipe } from '../shared/enums';

export function useRecipeDetailQuery(recipeId: string) {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.RECIPES.DETAIL(recipeId),
    queryFn: () => api.get<Recipe>(ROUTES.RECIPES.DETAIL(recipeId)),
    enabled: isAuthenticated && !!recipeId,
  });
}
