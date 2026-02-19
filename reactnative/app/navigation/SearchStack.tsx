import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../../lib/colors';
import SearchScreen from '../screens/SearchScreen';
import ArtistListScreen from '../screens/ArtistListScreen';
import ArtistDetailScreen from '../screens/ArtistDetailScreen';
import TattooDetailScreen from '../screens/TattooDetailScreen';
import EditTattooScreen from '../screens/EditTattooScreen';
import StudioDetailScreen from '../screens/StudioDetailScreen';
import type { SearchStackParamList } from './types';

const Stack = createStackNavigator<SearchStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { color: colors.textPrimary },
};

export default function SearchStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Search" component={SearchScreen} options={{ title: 'Search' }} />
      <Stack.Screen name="ArtistList" component={ArtistListScreen} options={{ title: 'Artists' }} />
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
    </Stack.Navigator>
  );
}
