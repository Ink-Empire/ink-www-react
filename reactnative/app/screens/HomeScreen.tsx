import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  DeviceEventEmitter,
  RefreshControl,
  Modal,
  Pressable,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useTattoos, useStyles, useTags } from '@inkedin/shared/hooks';
import { getCachedTattoos, saveTattoosToCache, clearTattooCache } from '../../lib/tattooCache';
import SearchBar from '../components/search/SearchBar';
import FilterDrawer, { type AppliedFilters } from '../components/search/FilterDrawer';
import TattooCard from '../components/cards/TattooCard';
import EmptyState from '../components/common/EmptyState';
import GrowingBanner from '../components/common/GrowingBanner';
import { useAuth } from '../contexts/AuthContext';

export default function HomeScreen({ navigation, route }: any) {
  const { user } = useAuth();
  const isArtist = user?.type_id === 2;
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AppliedFilters>({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [showSeeking, setShowSeeking] = useState<boolean>(isArtist);
  const [infoOpen, setInfoOpen] = useState(false);

  // Default seeking ON for artists once user loads
  useEffect(() => {
    if (isArtist) setShowSeeking(true);
  }, [isArtist]);

  // Apply filters from navigation params (e.g. tapping a style/tag on TattooDetail)
  useEffect(() => {
    const params = route?.params;
    if (params?.filterStyles) {
      setFilters(prev => ({ ...prev, styles: params.filterStyles }));
      navigation.setParams({ filterStyles: undefined });
    }
    if (params?.filterTags) {
      setFilters(prev => ({ ...prev, tags: params.filterTags }));
      navigation.setParams({ filterTags: undefined });
    }
    if (params?.filterTagNames) {
      setFilters(prev => ({ ...prev, tagNames: params.filterTagNames }));
      navigation.setParams({ filterTagNames: undefined });
    }
  }, [route?.params?.filterStyles, route?.params?.filterTags, route?.params?.filterTagNames]);

  const postTypes = useMemo<Array<'portfolio' | 'flash' | 'seeking'>>(() => {
    const types: Array<'portfolio' | 'flash' | 'seeking'> = ['portfolio'];
    if (showFlash) types.push('flash');
    if (showSeeking) types.push('seeking');
    return types;
  }, [showFlash, showSeeking]);

  const searchParams = {
    searchString: searchQuery || undefined,
    sort: filters.sort,
    styles: filters.styles,
    tags: filters.tags,
    tagNames: filters.tagNames,
    distance: filters.distance,
    distanceUnit: filters.distanceUnit,
    useAnyLocation: filters.useAnyLocation,
    post_types: postTypes,
  };

  const chipsAtDefault = !showFlash && (isArtist ? showSeeking : !showSeeking);
  const [cachedTattoos, setCachedTattoos] = useState<any[] | null>(null);
  const hasFilters = !!(
    searchQuery ||
    filters.sort ||
    filters.styles?.length ||
    filters.tags?.length ||
    filters.tagNames?.length ||
    !chipsAtDefault
  );

  // Load cached tattoos on mount (only for unfiltered default feed)
  const cacheLoaded = useRef(false);
  useEffect(() => {
    if (cacheLoaded.current || hasFilters) return;
    cacheLoaded.current = true;
    getCachedTattoos().then(cached => {
      if (cached && cached.length > 0) {
        setCachedTattoos(cached);
      }
    });
  }, []);

  const { tattoos, loading, loadingMore, hasMore, loadMore, refetch, removeTattoo } = useTattoos(api, searchParams as any);
  const { styles: stylesList } = useStyles(api);
  const { tags: tagsList } = useTags(api);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    clearTattooCache();
    setCachedTattoos(null);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Save fresh results to cache (only for unfiltered default feed)
  useEffect(() => {
    if (!loading && tattoos.length > 0 && !hasFilters) {
      saveTattoosToCache(tattoos);
      setCachedTattoos(null); // clear cached state once fresh data is in
    }
  }, [tattoos, loading, hasFilters]);

  // Show cached data while API is loading the default feed
  const displayTattoos = (loading && !hasFilters && cachedTattoos) ? cachedTattoos : tattoos;
  const showSpinner = loading && displayTattoos.length === 0;

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tattoo-deleted', ({ id }: { id: number }) => {
      removeTattoo(id);
    });
    return () => sub.remove();
  }, [removeTattoo]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleApplyFilters = useCallback((applied: AppliedFilters) => {
    setFilters(applied);
  }, []);

  const activeFilterCount =
    (filters.sort ? 1 : 0) +
    (filters.styles?.length || 0) +
    (filters.tags?.length || 0) +
    (filters.tagNames?.length || 0);

  const renderItem = ({ item }: any) => (
    <TattooCard
      tattoo={item}
      onPress={() => navigation.push('TattooDetail', { id: item.id })}
    />
  );

  return (
    <View style={styles.container}>
      <GrowingBanner />
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchBarWrap}>
            <SearchBar onSearch={handleSearch} placeholder="Search tattoos..." />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setDrawerVisible(true)}
          >
            <MaterialIcons name="tune" size={24} color={colors.textPrimary} />
            {activeFilterCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Quick filter chips */}
        <View style={styles.chipRow}>
          <TouchableOpacity
            onPress={() => setShowFlash(!showFlash)}
            style={[
              styles.chip,
              showFlash && { borderColor: colors.flash, backgroundColor: colors.flashDim },
            ]}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="flash-on"
              size={14}
              color={showFlash ? colors.flash : colors.textSecondary}
            />
            <Text style={[styles.chipText, showFlash && { color: colors.flash }]}>Flash</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowSeeking(!showSeeking)}
            style={[
              styles.chip,
              showSeeking && { borderColor: colors.seeking, backgroundColor: colors.seekingDim },
            ]}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name="search"
              size={14}
              color={showSeeking ? colors.seeking : colors.textSecondary}
            />
            <Text style={[styles.chipText, showSeeking && { color: colors.seeking }]}>
              Seeking Work
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setInfoOpen(true)}
            style={styles.infoBtn}
            activeOpacity={0.7}
            accessibilityLabel="What do these toggles show?"
          >
            <MaterialIcons name="info-outline" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* What's this? info modal */}
      <Modal
        visible={infoOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setInfoOpen(false)}>
          <Pressable style={styles.modalCard} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>What do these show?</Text>
              <TouchableOpacity onPress={() => setInfoOpen(false)}>
                <MaterialIcons name="close" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalRow}>
              <MaterialIcons name="flash-on" size={18} color={colors.flash} />
              <View style={styles.modalRowText}>
                <Text style={[styles.modalLabel, { color: colors.flash }]}>Flash</Text>
                <Text style={styles.modalDesc}>
                  Available designs artists are ready to tattoo, often with a set price.
                </Text>
              </View>
            </View>
            <View style={styles.modalRow}>
              <MaterialIcons name="search" size={18} color={colors.seeking} />
              <View style={styles.modalRowText}>
                <Text style={[styles.modalLabel, { color: colors.seeking }]}>Seeking Work</Text>
                <Text style={styles.modalDesc}>
                  Clients looking for an artist to bring their idea to life.
                </Text>
              </View>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {showSpinner ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : displayTattoos.length === 0 && !loading ? (
        (() => {
          let message = 'No tattoos found. Try adjusting your search.';
          let actionLabel: string | undefined;
          let onAction: (() => void) | undefined;

          if (showFlash && !showSeeking) {
            if (isArtist) {
              message = 'No flash posts available.\nHave some flash to sell? Add it here.';
              actionLabel = 'Add Flash';
              onAction = () => navigation.navigate('UploadTab' as never);
            } else {
              message = 'No flash posts available.\nCheck back soon — artists are adding flash all the time.';
            }
          } else if (showSeeking && !showFlash) {
            if (!isArtist) {
              message = 'No seeking posts right now.\nLooking for an artist? Post your idea and let them find you.';
              actionLabel = 'Post a Request';
              onAction = () => navigation.navigate('UploadTab' as never);
            } else {
              message = 'No seeking posts right now.\nCheck back soon — clients post new ideas every day.';
            }
          } else if (showFlash && showSeeking) {
            if (isArtist) {
              message = 'No flash or seeking posts available.\nHave flash to sell? Add it here.';
              actionLabel = 'Add Flash';
              onAction = () => navigation.navigate('UploadTab' as never);
            } else {
              message = 'No flash or seeking posts available.\nLooking for an artist? Post your idea.';
              actionLabel = 'Post a Request';
              onAction = () => navigation.navigate('UploadTab' as never);
            }
          }

          return <EmptyState message={message} actionLabel={actionLabel} onAction={onAction} />;
        })()
      ) : (
        <FlatList
          data={displayTattoos}
          numColumns={2}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
          onEndReached={() => { if (hasMore && !loadingMore) loadMore(); }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={loadingMore ? (
            <ActivityIndicator color={colors.accent} style={{ paddingVertical: 16 }} />
          ) : null}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
        />
      )}

      <FilterDrawer
        visible={drawerVisible}
        onClose={() => setDrawerVisible(false)}
        onApply={handleApplyFilters}
        styles={stylesList}
        tags={tagsList}
        currentFilters={filters}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchBarWrap: {
    flex: 1,
  },
  filterButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
    marginBottom: 12,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: colors.accent,
    borderRadius: 9,
    width: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '700',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingHorizontal: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
    fontWeight: '500',
  },
  infoBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 10,
  },
  modalRowText: {
    flex: 1,
  },
  modalLabel: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  modalDesc: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
});
