import './global.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './contexts/AuthContext';
import RootNavigator from './navigation/RootNavigator';
import { usePushNotifications } from './hooks/usePushNotifications';

const queryClient = new QueryClient();

function PushNotificationRegistrar() {
  usePushNotifications();
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <PushNotificationRegistrar />
        <RootNavigator />
      </AuthProvider>
    </QueryClientProvider>
  );
}
