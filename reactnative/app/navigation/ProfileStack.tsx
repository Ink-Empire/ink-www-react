import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { colors } from '../../lib/colors';
import ProfileScreen from '../screens/ProfileScreen';
import EditProfileScreen from '../screens/EditProfileScreen';
import ArtistDetailScreen from '../screens/ArtistDetailScreen';
import TattooDetailScreen from '../screens/TattooDetailScreen';
import EditTattooScreen from '../screens/EditTattooScreen';
import CalendarScreen from '../screens/CalendarScreen';
import StudioDetailScreen from '../screens/StudioDetailScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import InboxHeaderButton from '../components/inbox/InboxHeaderButton';
import type { ProfileStackParamList } from './types';

const Stack = createStackNavigator<ProfileStackParamList>();

const screenOptions = {
  headerStyle: { backgroundColor: colors.surface },
  headerTintColor: colors.textPrimary,
  headerTitleStyle: { color: colors.textPrimary },
};

export default function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile', headerRight: () => <InboxHeaderButton /> }} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notifications' }} />
      <Stack.Screen
        name="ArtistDetail"
        component={ArtistDetailScreen}
        options={({ route }) => ({ title: route.params.name || 'Artist' })}
      />
      <Stack.Screen
        name="TattooDetail"
        component={TattooDetailScreen}
        options={{ title: 'Tattoo' }}
      />
      <Stack.Screen name="EditTattoo" component={EditTattooScreen} options={{ title: 'Edit Tattoo' }} />
      <Stack.Screen
        name="StudioDetail"
        component={StudioDetailScreen}
        options={({ route }) => ({ title: route.params?.name || 'Studio' })}
      />
      <Stack.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{ title: '', headerBackTitle: 'Back' }}
      />
    </Stack.Navigator>
  );
}
