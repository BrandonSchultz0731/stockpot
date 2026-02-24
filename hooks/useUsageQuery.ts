import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';

export interface UsageRecord {
  id: string;
  periodStart: string;
  receiptScans: number;
  mealPlansGenerated: number;
  recipesGenerated: number;
  aiChatMessages: number;
  substitutionRequests: number;
}

export function useUsageQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.USAGE_CURRENT,
    queryFn: () => api.get<UsageRecord>(ROUTES.USAGE.CURRENT),
    enabled: isAuthenticated,
  });
}
