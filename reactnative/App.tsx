import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar, View, StyleSheet } from 'react-native';
import { colors } from './lib/colors';
import { AuthProvider, useAuth } from './app/contexts/AuthContext';
import { SnackbarProvider } from './app/contexts/SnackbarContext';
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

function RootNavigator(): React.JSX.Element {
  const { isAuthenticated, isEmailVerified, isLoading, user } = useAuth();

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
      <SnackbarProvider>
        <RootNavigator />
      </SnackbarProvider>
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
});

export default App;
