import { useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import {
  useSaveRecipeMutation,
  useUnsaveRecipeMutation,
} from './useMealPlanMutations';
import type { Recipe } from '../shared/enums';

export interface SavedRecipeItem {
  id: string;
  recipeId: string;
  isFavorite: boolean;
  rating: number | null;
  notes: string | null;
  savedAt: string;
  recipe: Recipe;
}

export function useSavedRecipes() {
  const { isAuthenticated } = useAuth();

  const {
    data: savedRecipes,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: QUERY_KEYS.RECIPES.SAVED,
    queryFn: () => api.get<SavedRecipeItem[]>(ROUTES.RECIPES.SAVED),
    enabled: isAuthenticated,
  });

  const saveMutation = useSaveRecipeMutation();
  const unsaveMutation = useUnsaveRecipeMutation();

  const savedRecipeIds = useMemo(() => {
    if (!savedRecipes) return new Set<string>();
    return new Set(savedRecipes.map((r) => r.recipeId));
  }, [savedRecipes]);

  const isSaved = useCallback(
    (recipeId: string) => savedRecipeIds.has(recipeId),
    [savedRecipeIds],
  );

  const toggleSave = useCallback(
    (recipeId: string) => {
      if (savedRecipeIds.has(recipeId)) {
        unsaveMutation.mutate(recipeId);
      } else {
        saveMutation.mutate(recipeId);
      }
    },
    [savedRecipeIds, saveMutation, unsaveMutation],
  );

  return { savedRecipes, savedRecipeIds, isSaved, toggleSave, isLoading, refetch, isRefetching };
}
