import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import type { Neighborhood } from '@/contexts/NeighborhoodContext';

const notificationPreferenceKey = (userId: string) => `nadhafadz:notifications:${userId}`;

export async function getStoredNotificationPreference(userId: string) {
  return (await AsyncStorage.getItem(notificationPreferenceKey(userId))) === 'enabled';
}

async function setStoredNotificationPreference(userId: string, enabled: boolean) {
  await AsyncStorage.setItem(notificationPreferenceKey(userId), enabled ? 'enabled' : 'disabled');
}

export async function getPushNotificationEnabled(userId: string) {
  const { data, error } = await supabase
    .from('push_tokens')
    .select('id')
    .eq('user_id', userId)
    .eq('enabled', true)
    .limit(1);

  if (error) throw error;
  const enabled = Boolean(data?.length);
  if (enabled) await setStoredNotificationPreference(userId, true);
  return enabled;
}

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
    await setStoredNotificationPreference(userId, false);
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
      vibrationPattern: [0, 250, 180, 250],
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
  await setStoredNotificationPreference(userId, true);
  return token;
}

export async function restorePushNotifications(userId: string, neighborhood: Neighborhood) {
  const shouldRestore = await getStoredNotificationPreference(userId);
  if (!shouldRestore) return false;
  await registerPushNotifications(userId, neighborhood);
  return true;
}

export async function disablePushToken(userId: string) {
  const { error } = await supabase
    .from('push_tokens')
    .update({ enabled: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) throw error;
  await setStoredNotificationPreference(userId, false);
}
