import React, { useEffect, useState, useCallback, useMemo } from 'react';
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
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useUserProfile, useUserTattoos } from '@inkedin/shared/hooks';
import { createTattooService } from '@inkedin/shared/services';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';

const screenWidth = Dimensions.get('window').width;

export default function UserProfileScreen({ route, navigation }: any) {
  const { slug } = route.params;
  const { profile, loading: profileLoading, refetch: refetchProfile } = useUserProfile(api, slug);
  const { tattoos, loading: tattoosLoading, loadMore, removeTattoo, refetch: refetchTattoos } = useUserTattoos(api, slug);
  const { user } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [refreshing, setRefreshing] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const tattooService = useMemo(() => createTattooService(api), []);

  const isOwner = user?.slug === slug;

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

  const toggleSelectMode = useCallback(() => {
    setSelectMode(prev => {
      if (prev) setSelectedIds(new Set());
      return !prev;
    });
  }, []);

  const toggleSelected = useCallback((id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(prev => prev.size === tattoos.length ? new Set() : new Set(tattoos.map(t => t.id)));
  }, [tattoos]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      `Delete ${selectedIds.size} upload${selectedIds.size > 1 ? 's' : ''}?`,
      'This will permanently remove the selected tattoos and their images. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              const idsToDelete = [...selectedIds];
              const result = await tattooService.bulkDelete(idsToDelete);
              const count = (result as any)?.deleted_count ?? idsToDelete.length;
              idsToDelete.forEach(id => DeviceEventEmitter.emit('tattoo-deleted', { id }));
              showSnackbar(`Deleted ${count} upload${count !== 1 ? 's' : ''}`);
              setSelectMode(false);
              setSelectedIds(new Set());
              refetchTattoos();
            } catch (err: any) {
              showSnackbar('Failed to delete uploads', 'error');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [selectedIds, tattooService, showSnackbar, refetchTattoos]);

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

      {isOwner && tattoos.length > 0 && (
        selectMode ? (
          <View style={s.selectBar}>
            <TouchableOpacity onPress={selectAll} activeOpacity={0.7}>
              <Text style={s.selectBarLink}>
                {selectedIds.size === tattoos.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>
            <View style={s.selectBarRight}>
              {selectedIds.size > 0 && (
                <TouchableOpacity
                  style={s.deleteBtn}
                  onPress={handleBulkDelete}
                  disabled={deleting}
                  activeOpacity={0.7}
                >
                  <MaterialIcons name="delete-outline" size={18} color="#fff" />
                  <Text style={s.deleteBtnText}>
                    {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={toggleSelectMode} activeOpacity={0.7}>
                <Text style={s.selectBarLink}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={s.selectBar}>
            <TouchableOpacity onPress={toggleSelectMode} activeOpacity={0.7}>
              <Text style={s.selectBarLink}>Select</Text>
            </TouchableOpacity>
          </View>
        )
      )}
    </View>
  );

  const renderTattoo = ({ item }: { item: any }) => {
    const imageUri = item.primary_image?.uri || item.images?.[0]?.uri;
    const isSelected = selectedIds.has(item.id);
    const cardSize = (screenWidth - 48) / 3;
    return (
      <TouchableOpacity
        style={[s.gridItem, { width: cardSize, height: cardSize }, selectMode && isSelected && s.gridItemSelected]}
        activeOpacity={0.8}
        onPress={() => {
          if (selectMode) {
            toggleSelected(item.id);
          } else {
            navigation.navigate('TattooDetail', { id: item.id });
          }
        }}
        onLongPress={() => {
          if (isOwner && !selectMode) {
            setSelectMode(true);
            setSelectedIds(new Set([item.id]));
          }
        }}
      >
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={s.gridImage} />
        ) : (
          <View style={s.gridPlaceholder}>
            <MaterialIcons name="image" size={28} color={colors.textMuted} />
          </View>
        )}
        {selectMode && (
          <View style={s.checkOverlay}>
            <View style={[s.checkbox, isSelected && s.checkboxSelected]}>
              {isSelected && <MaterialIcons name="check" size={16} color="#fff" />}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

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
  selectBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  selectBarRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  selectBarLink: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  gridItem: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    margin: 4,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridItemSelected: {
    opacity: 0.7,
  },
  checkOverlay: {
    position: 'absolute',
    top: 6,
    right: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
});
