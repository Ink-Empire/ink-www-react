import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../../lib/colors';
import FavoritesScreen from '../screens/FavoritesScreen';
import ArtistDetailScreen from '../screens/ArtistDetailScreen';
import TattooDetailScreen from '../screens/TattooDetailScreen';
import EditTattooScreen from '../screens/EditTattooScreen';
import StudioDetailScreen from '../screens/StudioDetailScreen';
import UserProfileScreen from '../screens/UserProfileScreen';
import InboxHeaderButton from '../components/inbox/InboxHeaderButton';
import type { FavoritesStackParamList } from './types';

const Stack = createStackNavigator<FavoritesStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { color: colors.textPrimary },
};

export default function FavoritesStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Favorites" component={FavoritesScreen} options={{ title: 'Saved', headerRight: () => <InboxHeaderButton /> }} />
      <Stack.Screen
        name="ArtistDetail"
        component={ArtistDetailScreen}
        options={({ route }) => ({ title: route.params?.name || 'Artist' })}
      />
      <Stack.Screen name="TattooDetail" component={TattooDetailScreen} options={{ title: 'Tattoo' }} />
      <Stack.Screen name="EditTattoo" component={EditTattooScreen} options={{ title: 'Edit Tattoo' }} />
      <Stack.Screen
        name="StudioDetail"
        component={StudioDetailScreen}
        options={({ route }) => ({ title: route.params?.name || 'Studio' })}
      />
      <Stack.Screen
        name="UserProfile"
        component={UserProfileScreen}
        options={({ route }) => ({ title: route.params?.name || 'Profile' })}
      />
    </Stack.Navigator>
  );
}
