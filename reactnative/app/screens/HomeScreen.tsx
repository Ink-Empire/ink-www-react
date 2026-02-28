import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  DeviceEventEmitter,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useTattoos, useStyles, useTags } from '@inkedin/shared/hooks';
import { getCachedTattoos, saveTattoosToCache } from '../../lib/tattooCache';
import SearchBar from '../components/search/SearchBar';
import FilterDrawer, { type AppliedFilters } from '../components/search/FilterDrawer';
import TattooCard from '../components/cards/TattooCard';
import EmptyState from '../components/common/EmptyState';
import GrowingBanner from '../components/common/GrowingBanner';

export default function HomeScreen({ navigation, route }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AppliedFilters>({});
  const [drawerVisible, setDrawerVisible] = useState(false);

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

  const searchParams = {
    searchString: searchQuery || undefined,
    sort: filters.sort,
    styles: filters.styles,
    tags: filters.tags,
    tagNames: filters.tagNames,
    distance: filters.distance,
    distanceUnit: filters.distanceUnit,
    useAnyLocation: filters.useAnyLocation,
  };

  const [cachedTattoos, setCachedTattoos] = useState<any[] | null>(null);
  const hasFilters = !!(searchQuery || filters.sort || filters.styles?.length || filters.tags?.length || filters.tagNames?.length);

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

  const { tattoos, loading, refetch, removeTattoo } = useTattoos(api, searchParams as any);
  const { styles: stylesList } = useStyles(api);
  const { tags: tagsList } = useTags(api);

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
      </View>

      {showSpinner ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : displayTattoos.length === 0 && !loading ? (
        <EmptyState message="No tattoos found. Try adjusting your search." />
      ) : (
        <FlatList
          data={displayTattoos}
          numColumns={2}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
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
});
