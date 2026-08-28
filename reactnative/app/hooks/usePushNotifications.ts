import { useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import {
  getMessaging,
  getToken,
  onTokenRefresh,
  onMessage,
  requestPermission,
  AuthorizationStatus,
} from '@react-native-firebase/messaging';
import { createNotificationService } from '@inkedin/shared/services';
import { api } from '../../lib/api';
import { usePushNotificationBanner } from '../contexts/PushNotificationContext';

const notificationService = createNotificationService(api);

let onPushReceivedCallback: (() => void) | null = null;

export function setOnPushReceivedCallback(cb: (() => void) | null) {
  onPushReceivedCallback = cb;
}

export function usePushNotifications(isAuthenticated: boolean) {
  const tokenRef = useRef<string | null>(null);
  const { show } = usePushNotificationBanner();

  const registerToken = useCallback(async (fcmToken: string) => {
    try {
      await notificationService.registerDeviceToken(fcmToken, Platform.OS);
      tokenRef.current = fcmToken;
    } catch (err) {
      console.error('Failed to register device token:', err);
    }
  }, []);

  const unregisterToken = useCallback(async () => {
    if (!tokenRef.current) return;
    try {
      await notificationService.unregisterDeviceToken(tokenRef.current);
      tokenRef.current = null;
    } catch (err) {
      console.error('Failed to unregister device token:', err);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;

    let unsubscribeRefresh: (() => void) | undefined;
    let unsubscribeMessage: (() => void) | undefined;

    const setup = async () => {
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
        );
      }

      const msgInstance = getMessaging();
      const authStatus = await requestPermission(msgInstance);
      const enabled =
        authStatus === AuthorizationStatus.AUTHORIZED ||
        authStatus === AuthorizationStatus.PROVISIONAL;

      if (!enabled) return;

      const fcmToken = await getToken(msgInstance);
      if (fcmToken) {
        await registerToken(fcmToken);
      }

      unsubscribeRefresh = onTokenRefresh(msgInstance, async (newToken) => {
        await registerToken(newToken);
      });

      unsubscribeMessage = onMessage(msgInstance, async (remoteMessage) => {
        const { notification, data } = remoteMessage;
        if (notification?.title) {
          show({
            title: notification.title,
            body: notification.body || '',
            data: data as Record<string, string> | undefined,
          });
          onPushReceivedCallback?.();
        }
      });
    };

    setup();

    return () => {
      unsubscribeRefresh?.();
      unsubscribeMessage?.();
    };
  }, [isAuthenticated, registerToken, show]);

  return { unregisterToken };
}
