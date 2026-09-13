import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import type { Neighborhood } from '@/contexts/NeighborhoodContext';

export async function registerPushNotifications(userId: string, neighborhood: Neighborhood) {
  if (!Device.isDevice) {
    throw new Error('Push notifications require a physical device.');
  }

  const current = await Notifications.getPermissionsAsync();
  let finalStatus = current.status;

  if (finalStatus !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') {
    throw new Error('Notification permission was not granted.');
  }

  const projectId = Constants.easConfig?.projectId ?? Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    throw new Error('Missing EAS project ID. Run EAS initialization before testing remote push notifications.');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('truck-alerts', {
      name: 'تنبيهات شاحنة النظافة',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;

  const { error } = await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      token,
      neighborhood,
      platform: Platform.OS,
      enabled: true,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );

  if (error) throw error;
  return token;
}

export async function disablePushToken(userId: string) {
  const { error } = await supabase
    .from('push_tokens')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw error;
}
