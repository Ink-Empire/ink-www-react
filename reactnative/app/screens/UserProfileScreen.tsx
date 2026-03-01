import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  TouchableOpacity,
  DeviceEventEmitter,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useUserProfile, useUserTattoos } from '@inkedin/shared/hooks';
import TattooCard from '../components/cards/TattooCard';

const screenWidth = Dimensions.get('window').width;

export default function UserProfileScreen({ route, navigation }: any) {
  const { slug } = route.params;
  const { profile, loading: profileLoading, refetch: refetchProfile } = useUserProfile(api, slug);
  const { tattoos, loading: tattoosLoading, loadMore, removeTattoo, refetch: refetchTattoos } = useUserTattoos(api, slug);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([refetchProfile(), refetchTattoos()]);
    setRefreshing(false);
  }, [refetchProfile, refetchTattoos]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tattoo-deleted', ({ id }) => {
      removeTattoo(id);
    });
    return () => sub.remove();
  }, [removeTattoo]);

  if (profileLoading) {
    return (
      <SafeAreaView style={s.container}>
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.emptyState}>
          <Text style={s.emptyText}>User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderHeader = () => (
    <View style={s.header}>
      {profile.image?.uri ? (
        <Image source={{ uri: profile.image.uri }} style={s.avatar} />
      ) : (
        <View style={[s.avatar, s.avatarPlaceholder]}>
          <MaterialIcons name="person" size={40} color={colors.textMuted} />
        </View>
      )}

      <Text style={s.name}>{profile.name}</Text>

      {profile.location && (
        <View style={s.locationRow}>
          <MaterialIcons name="place" size={14} color={colors.textMuted} />
          <Text style={s.location}>{profile.location}</Text>
        </View>
      )}

      {profile.about && <Text style={s.about}>{profile.about}</Text>}

      {profile.social_media_links && profile.social_media_links.length > 0 && (
        <View style={s.socialRow}>
          {profile.social_media_links.map(link => (
            <View key={link.platform} style={s.socialChip}>
              <Text style={s.socialText}>@{link.username}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={s.divider} />
    </View>
  );

  const renderTattoo = ({ item }: { item: any }) => (
    <TattooCard
      tattoo={item}
      onPress={() => navigation.navigate('TattooDetail', { id: item.id })}
      size="small"
    />
  );

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={tattoos}
        renderItem={renderTattoo}
        keyExtractor={(item) => String(item.id)}
        numColumns={3}
        columnWrapperStyle={s.gridRow}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          tattoosLoading ? (
            <ActivityIndicator size="small" color={colors.accent} style={{ marginTop: 20 }} />
          ) : (
            <View style={s.emptyState}>
              <Text style={s.emptyText}>No tattoos yet</Text>
            </View>
          )
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
          />
        }
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  listContent: { paddingBottom: 40 },
  header: { alignItems: 'center', paddingHorizontal: 20, paddingTop: 20 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarPlaceholder: {
    backgroundColor: colors.surfaceElevated, justifyContent: 'center', alignItems: 'center',
  },
  name: { color: colors.textPrimary, fontSize: 22, fontWeight: '700' },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  location: { color: colors.textMuted, fontSize: 14 },
  about: {
    color: colors.textSecondary, fontSize: 14, lineHeight: 20,
    textAlign: 'center', marginTop: 12, paddingHorizontal: 20,
  },
  socialRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  socialChip: {
    backgroundColor: colors.surfaceElevated, borderRadius: 16,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  socialText: { color: colors.textSecondary, fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 24, marginTop: 16 },
  stat: { alignItems: 'center' },
  statValue: { color: colors.textPrimary, fontSize: 20, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  divider: {
    width: '100%', height: 1, backgroundColor: colors.border, marginVertical: 16,
  },
  gridRow: { paddingHorizontal: 8, gap: 4 },
  emptyState: { alignItems: 'center', paddingTop: 40 },
  emptyText: { color: colors.textMuted, fontSize: 16 },
});
