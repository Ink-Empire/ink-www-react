import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../../lib/colors';
import { useAuth } from '../contexts/AuthContext';
import UploadScreen from '../screens/UploadScreen';
import ClientUploadScreen from '../screens/ClientUploadScreen';
import type { UploadStackParamList } from './types';

const Stack = createStackNavigator<UploadStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { color: colors.textPrimary },
};

export default function UploadStack() {
  const { user } = useAuth();
  const isArtist = user?.type === 'artist' || user?.type_id === 2;

  return (
    <Stack.Navigator screenOptions={screenOptions}>
      {isArtist ? (
        <Stack.Screen name="Upload" component={UploadScreen} options={{ title: 'Upload Tattoo' }} />
      ) : (
        <Stack.Screen name="ClientUpload" component={ClientUploadScreen} options={{ title: 'Share Your Tattoo' }} />
      )}
    </Stack.Navigator>
  );
}
