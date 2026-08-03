import React from 'react';
import { View, ActivityIndicator, SafeAreaView } from 'react-native';
import { colors } from '../../lib/colors';
import { useAuth } from '../contexts/AuthContext';
import ArtistDetailScreen from './ArtistDetailScreen';
import UserProfileScreen from './UserProfileScreen';

export default function ProfileMainScreen({ navigation }: any) {
  const { user } = useAuth();
  const isArtist = user?.type === 'artist' || user?.type_id === 2;

  if (!user?.slug) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (isArtist) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
        <ArtistDetailScreen
          navigation={navigation}
          route={{ params: { slug: user.slug, name: user.name } }}
        />
      </SafeAreaView>
    );
  }

  return (
    <UserProfileScreen
      navigation={navigation}
      route={{ params: { slug: user.slug, name: user.name } }}
    />
  );
}
