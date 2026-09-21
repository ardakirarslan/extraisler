import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/**
 * Requests notification permission and saves this device's Expo push token
 * for the signed-in user, so the "acil ilan" webhook can reach them. Safe to
 * call on every app start / login — it just upserts.
 *
 * Requires `extra.eas.projectId` in app.json (set once via `eas init`); until
 * that's configured this silently no-ops instead of crashing the app.
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (!Device.isDevice) return;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId;
  if (!projectId) {
    console.warn('registerPushToken: extra.eas.projectId missing in app.json, skipping.');
    return;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('urgent-jobs', {
      name: 'Acil İlanlar',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });

  const { error } = await supabase.from('push_tokens').upsert({ user_id: userId, token, updated_at: new Date().toISOString() });
  if (error) console.warn('Failed to save push token:', error.message);
}
