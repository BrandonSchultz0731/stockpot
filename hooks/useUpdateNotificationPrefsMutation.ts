import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { QUERY_KEYS } from '../services/queryKeys';
import type { NotificationPrefs } from '../shared/enums';

export function useUpdateNotificationPrefsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NotificationPrefs>) =>
      api.patch<NotificationPrefs>(ROUTES.NOTIFICATIONS.PREFERENCES, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER_PROFILE });
    },
  });
}
