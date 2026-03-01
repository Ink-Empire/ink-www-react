import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute, useNavigationState } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { useAuth } from '../contexts/AuthContext';
import { useUnreadNotifications } from '../contexts/UnreadNotificationContext';
import HomeStack from './HomeStack';
import ArtistsStack from './ArtistsStack';
import UploadStack from './UploadStack';
import FavoritesStack from './FavoritesStack';
import ProfileStack from './ProfileStack';
import TattooMachineIcon from '../components/icons/TattooMachineIcon';
import ChairIcon from '../components/icons/ChairIcon';
import type { MainTabParamList } from './types';

function ProfileTabIcon({ color }: { color: string }) {
  const navState = useNavigationState(state => state);
  const { unreadCount } = useUnreadNotifications();
  const activeTab = navState.routes[navState.index];
  const isProfileTabActive = activeTab.name === 'ProfileTab';
  const profileRoute = isProfileTabActive
    ? getFocusedRouteNameFromRoute(activeTab) ?? 'ProfileMain'
    : null;
  const showSettings = isProfileTabActive && profileRoute === 'ProfileMain';
  return (
    <View>
      <MaterialIcons
        name={showSettings ? 'settings' : 'person-outline'}
        size={28}
        color={color}
      />
      {unreadCount > 0 && <View style={styles.notifDot} />}
    </View>
  );
}

function ProfileTabLabel({ color }: { color: string }) {
  const navState = useNavigationState(state => state);
  const activeTab = navState.routes[navState.index];
  const isProfileTabActive = activeTab.name === 'ProfileTab';
  const profileRoute = isProfileTabActive
    ? getFocusedRouteNameFromRoute(activeTab) ?? 'ProfileMain'
    : null;
  const showSettings = isProfileTabActive && profileRoute === 'ProfileMain';
  return (
    <Text style={{ color, fontSize: 10, fontWeight: '600', marginTop: -2 }}>
      {showSettings ? 'Settings' : 'Profile'}
    </Text>
  );
}

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const { user } = useAuth();
  const isArtist = user?.type === 'artist' || user?.type_id === 2;
  const isLoggedIn = !!user;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: -2,
        },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 6,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarLabel: 'Tattoos',
          tabBarIcon: ({ color }) => (
            <MaterialIcons name="anchor" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ArtistsTab"
        component={ArtistsStack}
        options={{
          tabBarLabel: 'Artists',
          tabBarIcon: ({ color }) => (
            <ChairIcon size={28} color={color} />
          ),
        }}
      />
      {isLoggedIn && (
        <Tab.Screen
          name="UploadTab"
          component={UploadStack}
          options={{
            tabBarLabel: () => null,
            tabBarIcon: ({ color }) => (
              <View style={styles.uploadButton}>
                <MaterialIcons name="add" size={28} color={colors.surface} />
              </View>
            ),
          }}
        />
      )}
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesStack}
        options={{
          tabBarLabel: 'Saved',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bookmark-border" size={28} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color }) => <ProfileTabIcon color={color} />,
          tabBarLabel: ({ color }) => <ProfileTabLabel color={color} />,
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const isTabFocused = navigation.isFocused();
            const currentRoute = getFocusedRouteNameFromRoute(route) ?? 'ProfileMain';
            if (isTabFocused && currentRoute === 'ProfileMain') {
              e.preventDefault();
              navigation.navigate('ProfileTab', { screen: 'Profile' });
            }
          },
        })}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  uploadButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
  },
  notifDot: {
    position: 'absolute',
    top: 0,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.error,
  },
});
