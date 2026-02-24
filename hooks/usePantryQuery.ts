import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import { UnitOfMeasure } from '../shared/enums';

export interface FoodCacheItem {
  id: string;
  fdcId: number | null;
  name: string;
  usdaDescription: string | null;
  usdaDataType: string | null;
  category: string | null;
  isPerishable: boolean | null;
  shelfLife: { fridge?: number; freezer?: number; pantry?: number } | null;
  nutritionPer100g: Record<string, number> | null;
  barcode: string | null;
  brand: string | null;
  imageUrl: string | null;
  aliases: string[] | null;
  createdAt: string;
}

export interface PantryItem {
  id: string;
  userId: string;
  foodCacheId: string;
  displayName: string;
  quantity: number;
  unit: UnitOfMeasure;
  storageLocation: string | null;
  expirationDate: string | null;
  expiryIsEstimated: boolean;
  opened: boolean;
  notes: string | null;
  addedAt: string;
  updatedAt: string;
  foodCache: FoodCacheItem;
}

export function usePantryQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.PANTRY_ITEMS,
    queryFn: () => api.get<PantryItem[]>(ROUTES.PANTRY.LIST),
    enabled: isAuthenticated,
  });
}
