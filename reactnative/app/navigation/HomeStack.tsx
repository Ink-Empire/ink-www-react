import React from 'react';
import { Image } from 'react-native';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../../lib/colors';
import HomeScreen from '../screens/HomeScreen';
import ArtistDetailScreen from '../screens/ArtistDetailScreen';
import TattooDetailScreen from '../screens/TattooDetailScreen';
import EditTattooScreen from '../screens/EditTattooScreen';
import CalendarScreen from '../screens/CalendarScreen';
import StudioDetailScreen from '../screens/StudioDetailScreen';
import InboxHeaderButton from '../components/inbox/InboxHeaderButton';
import type { HomeStackParamList } from './types';

const Stack = createStackNavigator<HomeStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { color: colors.textPrimary },
};

function LogoHeader() {
  return (
    <Image
      source={require('../assets/images/inkedin-text.png')}
      style={{ width: 140, height: 33, resizeMode: 'contain' }}
    />
  );
}

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ headerTitle: () => <LogoHeader />, headerRight: () => <InboxHeaderButton /> }}
      />
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
        name="Calendar"
        component={CalendarScreen}
        options={({ route }) => ({
          title: route.params?.artistName ? `${route.params.artistName}'s Calendar` : 'Calendar',
        })}
      />
    </Stack.Navigator>
  );
}
