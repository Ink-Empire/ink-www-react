import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'react-native';
import { colors } from './lib/colors';
import { AuthProvider, useAuth } from './app/contexts/AuthContext';
import AuthStack from './app/navigation/AuthStack';
import MainTabs from './app/navigation/MainTabs';
import LoadingScreen from './app/components/common/LoadingScreen';

function RootNavigator(): React.JSX.Element {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      {isAuthenticated ? <MainTabs /> : <AuthStack />}
    </NavigationContainer>
  );
}

function App(): React.JSX.Element {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

export default App;
