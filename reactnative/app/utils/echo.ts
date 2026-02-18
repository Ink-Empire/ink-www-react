import Config from 'react-native-config';
import { api } from '../../lib/api';

let echoInstance: any = null;

export function getEcho(): any {
  const key = Config.PUSHER_APP_KEY;
  const cluster = Config.PUSHER_APP_CLUSTER;
  if (!key || !cluster) return null;

  if (!echoInstance) {
    try {
      const PusherModule = require('pusher-js/react-native');
      const EchoModule = require('laravel-echo');
      const Pusher = PusherModule.default || PusherModule;
      const Echo = EchoModule.default || EchoModule;

      (globalThis as any).Pusher = Pusher;

      echoInstance = new Echo({
        broadcaster: 'pusher',
        key,
        cluster,
        forceTLS: true,
        authorizer: (channel: { name: string }) => ({
          authorize: (socketId: string, callback: (error: any, data: any) => void) => {
            api.post<any>('/broadcasting/auth', {
              socket_id: socketId,
              channel_name: channel.name,
            }, { requiresAuth: true })
              .then((response: any) => callback(null, response))
              .catch((error: any) => callback(error, null));
          },
        }),
      });

      // Register global socket ID getter for X-Socket-Id header
      (globalThis as any).__echoSocketId = () => {
        try {
          return echoInstance?.connector?.pusher?.connection?.socket_id || null;
        } catch {
          return null;
        }
      };
    } catch (err) {
      console.error('Failed to initialize Echo:', err);
      return null;
    }
  }

  return echoInstance;
}

export function disconnectEcho(): void {
  try {
    if (echoInstance) {
      echoInstance.disconnect();
      echoInstance = null;
    }
  } catch (err) {
    console.error('Failed to disconnect Echo:', err);
    echoInstance = null;
  }
  (globalThis as any).__echoSocketId = undefined;
}
