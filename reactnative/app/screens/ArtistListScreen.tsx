import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { userService } from '../../lib/services';
import { useArtists, useStyles, useTags } from '@inkedin/shared/hooks';
import SearchBar from '../components/search/SearchBar';
import FilterDrawer, { type AppliedFilters } from '../components/search/FilterDrawer';
import ArtistCard from '../components/cards/ArtistCard';
import EmptyState from '../components/common/EmptyState';
import GrowingBanner from '../components/common/GrowingBanner';

export default function ArtistListScreen({ navigation, route }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<AppliedFilters>({});
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [clientResults, setClientResults] = useState<any[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const lastClientQuery = useRef('');

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
  }, [route?.params?.filterStyles, route?.params?.filterTags]);

  const searchParams = {
    searchString: searchQuery || undefined,
    sort: filters.sort,
    styles: filters.styles,
    tags: filters.tags,
    distance: filters.distance,
    distanceUnit: filters.distanceUnit,
    useAnyLocation: filters.useAnyLocation,
  };

  const { artists, loading, refetch } = useArtists(api, searchParams as any);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);
  const { styles: stylesList } = useStyles(api);
  const { tags: tagsList } = useTags(api);

  // Auto-fetch client results when artist search returns empty
  useEffect(() => {
    if (loading || artists.length > 0 || searchQuery.length < 2) {
      if (searchQuery !== lastClientQuery.current) {
        setClientResults([]);
        lastClientQuery.current = '';
      }
      return;
    }
    if (searchQuery === lastClientQuery.current) return;
    lastClientQuery.current = searchQuery;
    setClientsLoading(true);
    userService.searchUsers({ searchString: searchQuery })
      .then((response) => setClientResults(response?.users || []))
      .catch(() => setClientResults([]))
      .finally(() => setClientsLoading(false));
  }, [loading, artists.length, searchQuery]);

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const handleApplyFilters = useCallback((applied: AppliedFilters) => {
    setFilters(applied);
  }, []);

  const activeFilterCount =
    (filters.sort ? 1 : 0) +
    (filters.styles?.length || 0) +
    (filters.tags?.length || 0);

  const renderItem = useCallback(({ item }: any) => (
    <ArtistCard
      artist={item}
      onPress={() => navigation.push('ArtistDetail', {
        slug: item.slug,
        name: item.name,
      })}
      onStudioPress={item.studio?.slug ? () => navigation.push('StudioDetail', {
        slug: item.studio.slug,
        name: item.studio.name,
      }) : undefined}
    />
  ), [navigation]);

  const renderClientItem = useCallback(({ item }: any) => (
    <ArtistCard
      artist={item}
      onPress={() => navigation.push('UserProfile', {
        slug: item.slug,
        name: item.name,
      })}
    />
  ), [navigation]);

  const showClientFallback =
    !loading &&
    artists.length === 0 &&
    searchQuery.length >= 2;

  return (
    <View style={styles.container}>
      <GrowingBanner />
      <View style={styles.header}>
        <View style={styles.searchRow}>
          <View style={styles.searchBarWrap}>
            <SearchBar onSearch={handleSearch} placeholder="Search artists..." />
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

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
        </View>
      ) : showClientFallback ? (
        <ScrollView contentContainerStyle={styles.list}>
          {clientsLoading ? (
            <ActivityIndicator color={colors.accent} size="small" style={{ marginTop: 20 }} />
          ) : clientResults.length > 0 ? (
            <>
              <Text style={styles.sectionBannerText}>No artists match - showing user results</Text>
              {clientResults.map((item) => (
                <View key={item.id}>
                  {renderClientItem({ item })}
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>
      ) : artists.length === 0 ? (
        <EmptyState message="No artists found. Try adjusting your search." />
      ) : (
        <FlatList
          data={artists}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="on-drag"
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
  list: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  sectionBannerText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
});
