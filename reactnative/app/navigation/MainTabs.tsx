import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { getFocusedRouteNameFromRoute } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { useAuth } from '../contexts/AuthContext';
import HomeStack from './HomeStack';
import ArtistsStack from './ArtistsStack';
import UploadStack from './UploadStack';
import FavoritesStack from './FavoritesStack';
import ProfileStack from './ProfileStack';
import TattooMachineIcon from '../components/icons/TattooMachineIcon';
import ChairIcon from '../components/icons/ChairIcon';
import type { MainTabParamList } from './types';

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
        options={({ route }) => {
          const routeName = getFocusedRouteNameFromRoute(route) ?? 'ProfileMain';
          const isOnProfile = routeName === 'ProfileMain';
          return {
            tabBarLabel: isOnProfile ? 'Settings' : 'Profile',
            tabBarIcon: ({ color }) => (
              <MaterialIcons
                name={isOnProfile ? 'settings' : 'person-outline'}
                size={28}
                color={color}
              />
            ),
          };
        }}
        listeners={({ navigation, route }) => ({
          tabPress: (e) => {
            const isTabFocused = navigation.isFocused();
            const currentRoute = getFocusedRouteNameFromRoute(route) ?? 'ProfileMain';
            if (isTabFocused && currentRoute === 'ProfileMain') {
              // Already viewing profile, tap again goes to settings
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
});
