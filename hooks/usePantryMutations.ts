import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { UnitOfMeasure, type ShelfLife } from '../shared/enums';
import type { PantryItem } from './usePantryQuery';

export interface CreatePantryItemRequest {
  foodCacheId?: string;
  fdcId?: number;
  displayName: string;
  quantity: number;
  unit: UnitOfMeasure;
  storageLocation?: string;
  expirationDate?: string;
  expiryIsEstimated?: boolean;
  opened?: boolean;
  notes?: string;
  estimatedShelfLife?: ShelfLife;
}

export interface UpdatePantryItemRequest {
  displayName?: string;
  quantity?: number;
  unit?: UnitOfMeasure;
  storageLocation?: string;
  expirationDate?: string;
  expiryIsEstimated?: boolean;
  opened?: boolean;
  notes?: string;
}

function invalidatePantryDependents(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PANTRY_ITEMS });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SHOPPING_LISTS.ALL });
  queryClient.invalidateQueries({ queryKey: QUERY_KEYS.MEAL_PLANS.ALL });
}

export function useCreatePantryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePantryItemRequest) =>
      api.post<PantryItem>(ROUTES.PANTRY.CREATE, data),
    onSuccess: () => invalidatePantryDependents(queryClient),
  });
}

export function useBulkCreatePantryItemsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: CreatePantryItemRequest[]) =>
      api.post<PantryItem[]>(ROUTES.PANTRY.BULK_CREATE, items),
    onSuccess: () => invalidatePantryDependents(queryClient),
  });
}

export function useUpdatePantryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePantryItemRequest }) =>
      api.patch<PantryItem>(ROUTES.PANTRY.UPDATE(id), data),
    onSuccess: () => invalidatePantryDependents(queryClient),
  });
}

export function useDeletePantryItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.delete<void>(ROUTES.PANTRY.DELETE(id)),
    onSuccess: () => invalidatePantryDependents(queryClient),
  });
}
