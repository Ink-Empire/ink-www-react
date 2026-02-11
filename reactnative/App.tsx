import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors } from './lib/colors';
import { api } from './lib/api';
import { AuthProvider, useAuth } from './app/contexts/AuthContext';
import { DemoModeProvider } from './app/contexts/DemoModeContext';
import { SnackbarProvider } from './app/contexts/SnackbarContext';
import { createStudioService } from '@inkedin/shared/services';
import { UnreadCountProvider } from './app/contexts/UnreadCountContext';
import AuthStack from './app/navigation/AuthStack';
import MainTabs from './app/navigation/MainTabs';
import InboxStack from './app/navigation/InboxStack';
import LoadingScreen from './app/components/common/LoadingScreen';
import VerifyEmailGate from './app/components/auth/VerifyEmailGate';
import Snackbar from './app/components/common/Snackbar';
import WelcomeModal from './app/components/common/WelcomeModal';
import type { RootStackParamList } from './app/navigation/types';

const RootStack = createStackNavigator<RootStackParamList>();

function AuthenticatedApp() {
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
          // Server error — restore pending data and allow retry
          await AsyncStorage.setItem('pending_studio', raw);
          processedRef.current = false;
        } else {
          // 422/4xx — stale data (studio likely already created during registration), discard
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
      <NavigationContainer>
        <StatusBar barStyle="light-content" backgroundColor={colors.background} />
        {isAuthenticated ? (
          <UnreadCountProvider>
            <AuthenticatedApp />
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
    <AuthProvider>
      <DemoModeProvider>
        <SnackbarProvider>
          <RootNavigator />
        </SnackbarProvider>
      </DemoModeProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default App;
