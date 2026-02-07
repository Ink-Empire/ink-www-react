import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../../lib/colors';
import UploadScreen from '../screens/UploadScreen';
import type { UploadStackParamList } from './types';

const Stack = createStackNavigator<UploadStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { color: colors.textPrimary },
};

export default function UploadStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Upload" component={UploadScreen} options={{ title: 'Upload Tattoo' }} />
    </Stack.Navigator>
  );
}
