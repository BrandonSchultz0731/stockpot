import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import { useAuth } from '../contexts/AuthContext';
import { DietaryProfile, NutritionalGoals, SubscriptionTier } from '../shared/enums';

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  onboardingComplete: boolean;
  subscriptionTier: SubscriptionTier;
  dietaryProfile: DietaryProfile | null;
  nutritionalGoals: NutritionalGoals | null;
  createdAt: string;
}

export function useUserProfileQuery() {
  const { isAuthenticated } = useAuth();

  return useQuery({
    queryKey: QUERY_KEYS.USER_PROFILE,
    queryFn: () => api.get<UserProfile>(ROUTES.USERS.ME),
    enabled: isAuthenticated,
  });
}
