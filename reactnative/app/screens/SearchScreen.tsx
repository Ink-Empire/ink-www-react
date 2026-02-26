import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  DeviceEventEmitter,
} from 'react-native';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useTattoos, useArtists, useStyles } from '@inkedin/shared/hooks';
import SearchBar from '../components/search/SearchBar';
import FilterBar from '../components/search/FilterBar';
import TattooCard from '../components/cards/TattooCard';
import ArtistCard from '../components/cards/ArtistCard';
import EmptyState from '../components/common/EmptyState';

type Tab = 'tattoos' | 'artists';

export default function SearchScreen({ navigation, route }: any) {
  const initialTab = route?.params?.tab || 'tattoos';
  const [activeTab, setActiveTab] = useState<Tab>(initialTab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);

  const searchParams = {
    searchString: searchQuery || undefined,
    styles: selectedStyles.length > 0 ? selectedStyles : undefined,
  };

  const { tattoos, loading: tattoosLoading, removeTattoo } = useTattoos(
    api,
    activeTab === 'tattoos' ? searchParams : undefined,
    { skip: activeTab !== 'tattoos' },
  );
  const { artists, loading: artistsLoading } = useArtists(
    api,
    activeTab === 'artists' ? searchParams : undefined,
    { skip: activeTab !== 'artists' },
  );

  const { styles: stylesData } = useStyles(api);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tattoo-deleted', ({ id }: { id: number }) => {
      removeTattoo(id);
    });
    return () => sub.remove();
  }, [removeTattoo]);
  const stylesList = Array.isArray(stylesData) ? stylesData : [];

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  const toggleStyle = useCallback((id: number) => {
    setSelectedStyles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  }, []);

  const renderTattooItem = useCallback(({ item }: any) => (
    <TattooCard
      tattoo={item}
      onPress={() => navigation.push('TattooDetail', { id: item.id })}
    />
  ), [navigation]);

  const renderArtistItem = useCallback(({ item }: any) => (
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

  const isLoading = activeTab === 'tattoos' ? tattoosLoading : artistsLoading;
  const data = activeTab === 'tattoos' ? tattoos : artists;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <SearchBar
          onSearch={handleSearch}
          placeholder={activeTab === 'tattoos' ? 'Search tattoos...' : 'Search artists...'}
        />
        <FilterBar styles={stylesList} selectedIds={selectedStyles} onToggle={toggleStyle} />

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'tattoos' && styles.tabActive]}
            onPress={() => setActiveTab('tattoos')}
          >
            <Text style={[styles.tabText, activeTab === 'tattoos' && styles.tabTextActive]}>
              Tattoos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'artists' && styles.tabActive]}
            onPress={() => setActiveTab('artists')}
          >
            <Text style={[styles.tabText, activeTab === 'artists' && styles.tabTextActive]}>
              Artists
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
      ) : data.length === 0 ? (
        <EmptyState message={`No ${activeTab} found. Try adjusting your search.`} />
      ) : activeTab === 'tattoos' ? (
        <FlatList
          data={tattoos}
          numColumns={2}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderTattooItem}
          contentContainerStyle={styles.grid}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <FlatList
          data={artists}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderArtistItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 15,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.accent,
  },
  grid: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  loader: {
    marginTop: 40,
  },
});
