import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { useAuth } from '../contexts/AuthContext';
import HomeStack from './HomeStack';
import ArtistsStack from './ArtistsStack';
import UploadStack from './UploadStack';
import FavoritesStack from './FavoritesStack';
import ProfileStack from './ProfileStack';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const { user } = useAuth();
  const isArtist = user?.type === 'artist' || user?.type_id === 2;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ArtistsTab"
        component={ArtistsStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="brush" size={size} color={color} />
          ),
        }}
      />
      {isArtist && (
        <Tab.Screen
          name="UploadTab"
          component={UploadStack}
          options={{
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="add-circle-outline" size={size + 6} color={color} />
            ),
          }}
        />
      )}
      <Tab.Screen
        name="FavoritesTab"
        component={FavoritesStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="bookmark-border" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileStack}
        options={{
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
