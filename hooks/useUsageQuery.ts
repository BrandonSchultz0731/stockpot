import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import { MessageType } from '../shared/enums';

export interface UsageRecord {
  id: string;
  periodStart: string;
  featureCounts: Partial<Record<MessageType, number>>;
}

export function useUsageQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.USAGE_CURRENT,
    queryFn: () => api.get<UsageRecord>(ROUTES.USAGE.CURRENT),
    enabled: isAuthenticated,
  });
}
