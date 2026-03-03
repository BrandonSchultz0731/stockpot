import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import type { DietaryProfile, NutritionalGoals } from '../shared/enums';

interface UpdateProfilePayload {
  dietaryProfile?: DietaryProfile;
  nutritionalGoals?: NutritionalGoals;
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateProfilePayload) =>
      api.patch(ROUTES.USERS.UPDATE_PROFILE, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
    },
  });
}
