import React, { useEffect, useRef } from 'react';
import { NavigationContainer, createNavigationContainerRef, getStateFromPath } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, StyleSheet, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './lib/colors';
import { api } from './lib/api';
import { AuthProvider, useAuth } from './app/contexts/AuthContext';
import { DemoModeProvider } from './app/contexts/DemoModeContext';
import { SnackbarProvider } from './app/contexts/SnackbarContext';
import { DeepLinkProvider, useDeepLink } from './app/contexts/DeepLinkContext';
import { createStudioService } from '@inkedin/shared/services';
import { UnreadCountProvider } from './app/contexts/UnreadCountContext';
import { MessageNotificationProvider } from './app/contexts/MessageNotificationContext';
import { PushNotificationProvider } from './app/contexts/PushNotificationContext';
import { parseDeepLink } from './app/utils/deepLinkParser';
import AuthStack from './app/navigation/AuthStack';
import MainTabs from './app/navigation/MainTabs';
import InboxStack from './app/navigation/InboxStack';
import LoadingScreen from './app/components/common/LoadingScreen';
import VerifyEmailGate from './app/components/auth/VerifyEmailGate';
import Snackbar from './app/components/common/Snackbar';
import MessageNotificationBanner from './app/components/common/MessageNotificationBanner';
import PushNotificationBanner from './app/components/common/PushNotificationBanner';
import WelcomeModal from './app/components/common/WelcomeModal';
import type { RootStackParamList } from './app/navigation/types';

const RootStack = createStackNavigator<RootStackParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const linking = {
  prefixes: ['https://getinked.in', 'https://www.getinked.in'],
  config: {
    screens: {
      Main: {
        screens: {
          HomeTab: {
            screens: {
              ArtistDetail: 'artists/:slug',
              TattooDetail: 'tattoos/:id',
            },
          },
        },
      },
      InboxStack: {
        screens: {
          Conversation: 'inbox/:conversationId',
          Inbox: 'inbox',
        },
      },
    },
  },
  getStateFromPath: (path: string, config: any) => {
    // Handle /tattoos?id=123 (the web's current query-param format)
    if (path.startsWith('/tattoos') && path.includes('?')) {
      const url = new URL(path, 'https://getinked.in');
      const id = url.searchParams.get('id');
      if (id && /^\d+$/.test(id)) {
        return {
          routes: [
            {
              name: 'Main' as const,
              state: {
                routes: [
                  {
                    name: 'HomeTab' as const,
                    state: {
                      routes: [
                        { name: 'Home' as const },
                        { name: 'TattooDetail' as const, params: { id: Number(id) } },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        };
      }
    }
    // Fall back to default path parsing for all other URLs
    return getStateFromPath(path, config);
  },
};

function navigateFromDeepLink(url: string) {
  const target = parseDeepLink(url);
  if (!target || !navigationRef.isReady()) return;

  switch (target.type) {
    case 'artist':
      navigationRef.navigate('Main', {
        screen: 'HomeTab',
        params: { screen: 'ArtistDetail', params: { slug: target.slug } },
      });
      break;
    case 'tattoo':
      navigationRef.navigate('Main', {
        screen: 'HomeTab',
        params: { screen: 'TattooDetail', params: { id: target.id } },
      });
      break;
    case 'conversation':
      navigationRef.navigate('InboxStack', {
        screen: 'Conversation',
        params: { conversationId: target.conversationId },
      });
      break;
    case 'inbox':
      navigationRef.navigate('InboxStack', {
        screen: 'Inbox',
      });
      break;
  }
}

function AuthenticatedApp() {
  const { consumePendingUrl } = useDeepLink();
  const hasConsumedRef = useRef(false);

  useEffect(() => {
    if (hasConsumedRef.current) return;
    // Small delay to ensure navigation is ready after mount
    const timer = setTimeout(() => {
      const url = consumePendingUrl();
      if (url) {
        hasConsumedRef.current = true;
        navigateFromDeepLink(url);
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [consumePendingUrl]);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      <RootStack.Screen name="Main" component={MainTabs} />
      <RootStack.Screen name="InboxStack" component={InboxStack} />
    </RootStack.Navigator>
  );
}

const studioService = createStudioService(api);

function usePendingStudio() {
  const { isAuthenticated, isEmailVerified, isLoading, refreshUser } = useAuth();
  const processedRef = useRef(false);

  useEffect(() => {
    // Wait until server data is loaded (isLoading=false) to avoid false positives
    // where isEmailVerified defaults to true before server responds
    if (isLoading || !isAuthenticated || !isEmailVerified || processedRef.current) return;

    const processPendingStudio = async () => {
      const raw = await AsyncStorage.getItem('pending_studio');
      if (!raw) {
        processedRef.current = true;
        return;
      }

      processedRef.current = true;

      try {
        const pendingData = JSON.parse(raw);
        await AsyncStorage.removeItem('pending_studio');

        let studioResponse: any;
        if (pendingData.studioResult?.id) {
          studioResponse = await studioService.claim(pendingData.studioResult.id, {
            bio: pendingData.bio,
            phone: pendingData.phone,
          });
        } else {
          studioResponse = await studioService.lookupOrCreate({
            name: pendingData.name,
            username: pendingData.username,
            bio: pendingData.bio,
            email: pendingData.email,
            phone: pendingData.phone,
            location: pendingData.location,
            location_lat_long: pendingData.locationLatLong,
          });
        }

        const studioId = studioResponse?.studio?.id;
        if (studioId && pendingData.uploadedImageId) {
          try {
            await studioService.uploadImage(studioId, pendingData.uploadedImageId);
          } catch {
            // Continue even if image association fails
          }
        }

        await refreshUser();
      } catch (err: any) {
        console.error('Failed to create/claim studio from pending data:', err);
        if (err?.status >= 500) {
          // Server error -- restore pending data and allow retry
          await AsyncStorage.setItem('pending_studio', raw);
          processedRef.current = false;
        } else {
          // 422/4xx -- stale data (studio likely already created during registration), discard
          await AsyncStorage.removeItem('pending_studio');
        }
      }
    };

    processPendingStudio();
  }, [isLoading, isAuthenticated, isEmailVerified, refreshUser]);
}

function RootNavigator(): React.JSX.Element {
  const { isAuthenticated, isEmailVerified, isLoading, user } = useAuth();
  usePendingStudio();

  if (isLoading) {
    return <LoadingScreen />;
  }

  // User is logged in but hasn't verified email
  if (isAuthenticated && !isEmailVerified) {
    return (
      <View style={styles.flex}>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        <VerifyEmailGate email={user?.email || ''} />
        <Snackbar />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <NavigationContainer
        ref={navigationRef}
        linking={isAuthenticated ? linking : undefined}
      >
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        {isAuthenticated ? (
          <UnreadCountProvider>
            <MessageNotificationProvider>
              <AuthenticatedApp />
              <MessageNotificationBanner />
              <PushNotificationBanner />
            </MessageNotificationProvider>
          </UnreadCountProvider>
        ) : (
          <AuthStack />
        )}
      </NavigationContainer>
      <WelcomeModal />
      <Snackbar />
    </View>
  );
}

function App(): React.JSX.Element {
  return (
    <PushNotificationProvider>
      <AuthProvider>
        <DeepLinkProvider>
          <DemoModeProvider>
            <SnackbarProvider>
              <RootNavigator />
            </SnackbarProvider>
          </DemoModeProvider>
        </DeepLinkProvider>
      </AuthProvider>
    </PushNotificationProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default App;
