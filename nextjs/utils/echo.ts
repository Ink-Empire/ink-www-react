import { getToken } from './auth';
import { fetchApi } from './api';

declare global {
  interface Window {
    Pusher: any;
    Echo: any;
  }
}

let echoInstance: any = null;

export function getEcho(): any {
  if (typeof window === 'undefined') return null;

  if (!process.env.NEXT_PUBLIC_PUSHER_APP_KEY) return null;

  const token = getToken('echo-init');
  if (!token) return null;

  if (!echoInstance) {
    try {
      const PusherModule = require('pusher-js');
      const EchoModule = require('laravel-echo');
      const Pusher = PusherModule.default || PusherModule;
      const Echo = EchoModule.default || EchoModule;

      window.Pusher = Pusher;
      echoInstance = new Echo({
        broadcaster: 'pusher',
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
        cluster: process.env.NEXT_PUBLIC_PUSHER_APP_CLUSTER,
        forceTLS: true,
        authorizer: (channel: { name: string }) => ({
          authorize: (socketId: string, callback: (error: any, data: any) => void) => {
            fetchApi('/broadcasting/auth', {
              method: 'POST',
              body: { socket_id: socketId, channel_name: channel.name },
              requiresAuth: true,
              useCache: false,
            })
              .then((response) => callback(null, response))
              .catch((error) => callback(error, null));
          },
        }),
      });
      window.Echo = echoInstance;
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
  if (typeof window !== 'undefined') {
    window.Echo = null;
  }
}
