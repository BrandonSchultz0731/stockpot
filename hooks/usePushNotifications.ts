import { useEffect } from 'react';
import { Platform } from 'react-native';
import messaging, {
  FirebaseMessagingTypes,
} from '@react-native-firebase/messaging';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { ROUTES } from '../services/routes';
import { navigationRef } from '../navigation/navigationRef';
import type { TabParamList } from '../navigation/types';
import { NotificationType } from '../shared/enums';

async function registerToken(token: string) {
  try {
    await api.post(ROUTES.NOTIFICATIONS.REGISTER_TOKEN, {
      pushToken: token,
      pushPlatform: Platform.OS,
    });
  } catch {
    // Silent failure — will retry on next app launch
  }
}

const NOTIFICATION_TAB_MAP: Record<string, keyof TabParamList> = {
  [NotificationType.ExpiringItems]: 'PantryStack',
  [NotificationType.MealReminder]: 'MealsStack',
  [NotificationType.MealPlanNudge]: 'MealsStack',
};

function handleNotificationOpen(
  message: FirebaseMessagingTypes.RemoteMessage | null,
) {
  if (!message?.data?.type) return;
  const tab = NOTIFICATION_TAB_MAP[message.data.type as string];
  if (!tab || !navigationRef.isReady()) return;

  // Navigate to MainTabs then the target tab
  navigationRef.navigate('MainTabs', { screen: tab });
}

export function usePushNotifications() {
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribeRefresh: (() => void) | undefined;
    let unsubscribeOpen: (() => void) | undefined;

    async function setup() {
      try {
        const authStatus = await messaging().requestPermission();
        const granted =
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL;

        if (!granted) return;

        const token = await messaging().getToken();
        if (token) {
          await registerToken(token);
        }

        unsubscribeRefresh = messaging().onTokenRefresh((newToken) => {
          registerToken(newToken);
        });

        // Handle tap when app is in background
        unsubscribeOpen = messaging().onNotificationOpenedApp((message) => {
          handleNotificationOpen(message);
        });

        // Handle tap that launched the app from killed state
        const initialMessage = await messaging().getInitialNotification();
        handleNotificationOpen(initialMessage);
      } catch {
        // Silent failure — Firebase may not be configured
      }
    }

    setup();

    return () => {
      unsubscribeRefresh?.();
      unsubscribeOpen?.();
    };
  }, [isAuthenticated]);
}
