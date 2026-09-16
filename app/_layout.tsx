import { useEffect } from 'react';
import { Stack, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { NeighborhoodProvider, useNeighborhood } from '@/contexts/NeighborhoodContext';
import { restorePushNotifications } from '@/lib/pushNotifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

function NotificationBridge() {
  const { user } = useAuth();
  const { neighborhood } = useNeighborhood();

  useEffect(() => {
    if (!user) return;
    void restorePushNotifications(user.id, neighborhood).catch(() => {
      // A temporary network or OS permission issue should never block app startup.
    });
  }, [user, neighborhood]);

  useEffect(() => {
    function openNotification(response: Notifications.NotificationResponse | null) {
      if (!response) return;
      const data = response.notification.request.content.data;
      if (data?.type === 'truck_confirmed') {
        router.push('/(app)/map');
      }
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(openNotification);
    void Notifications.getLastNotificationResponseAsync().then(openNotification).catch(() => undefined);

    return () => subscription.remove();
  }, []);

  return null;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <NeighborhoodProvider>
        <NotificationBridge />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }} />
      </NeighborhoodProvider>
    </AuthProvider>
  );
}
