import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../../lib/colors';
import ArtistListScreen from '../screens/ArtistListScreen';
import ArtistDetailScreen from '../screens/ArtistDetailScreen';
import TattooDetailScreen from '../screens/TattooDetailScreen';
import CalendarScreen from '../screens/CalendarScreen';
import StudioDetailScreen from '../screens/StudioDetailScreen';
import type { ArtistsStackParamList } from './types';

const Stack = createStackNavigator<ArtistsStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { color: colors.textPrimary },
};

export default function ArtistsStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="ArtistList" component={ArtistListScreen} options={{ title: 'Artists' }} />
      <Stack.Screen
        name="ArtistDetail"
        component={ArtistDetailScreen}
        options={({ route }) => ({ title: route.params?.name || 'Artist' })}
      />
      <Stack.Screen name="TattooDetail" component={TattooDetailScreen} options={{ title: 'Tattoo' }} />
      <Stack.Screen
        name="StudioDetail"
        component={StudioDetailScreen}
        options={({ route }) => ({ title: route.params?.name || 'Studio' })}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={({ route }) => ({
          title: route.params?.artistName ? `${route.params.artistName}'s Calendar` : 'Calendar',
        })}
      />
    </Stack.Navigator>
  );
}
