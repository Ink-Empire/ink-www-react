import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import ArtistCard from '../components/cards/ArtistCard';
import TattooCard from '../components/cards/TattooCard';
import StudioCard from '../components/cards/StudioCard';
import EmptyState from '../components/common/EmptyState';

type Tab = 'artists' | 'tattoos' | 'studios';

export default function FavoritesScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('artists');

  const [savedArtists, setSavedArtists] = useState<any[]>([]);
  const [savedTattoos, setSavedTattoos] = useState<any[]>([]);
  const [savedStudios, setSavedStudios] = useState<any[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [tattoosLoading, setTattoosLoading] = useState(true);
  const [studiosLoading, setStudiosLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchFavorites = useCallback(async () => {
    mountedRef.current = true;

    setArtistsLoading(true);
    setTattoosLoading(true);
    setStudiosLoading(true);

    try {
      const [artistRes, tattooRes, studioRes] = await Promise.all([
        api.get<any>('/client/favorites', { requiresAuth: true }),
        api.get<any>('/client/saved-tattoos', { requiresAuth: true }),
        api.get<any>('/client/saved-studios', { requiresAuth: true }),
      ]);

      if (mountedRef.current) {
        setSavedArtists(Array.isArray(artistRes?.favorites) ? artistRes.favorites : []);
        setSavedTattoos(Array.isArray(tattooRes?.tattoos) ? tattooRes.tattoos : []);
        setSavedStudios(Array.isArray(studioRes?.studios) ? studioRes.studios : []);
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      if (mountedRef.current) {
        setArtistsLoading(false);
        setTattoosLoading(false);
        setStudiosLoading(false);
      }
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
      return () => { mountedRef.current = false; };
    }, [fetchFavorites])
  );

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

  const renderTattooItem = useCallback(({ item }: any) => (
    <TattooCard
      tattoo={item}
      onPress={() => navigation.push('TattooDetail', { id: item.id })}
    />
  ), [navigation]);

  const renderStudioItem = useCallback(({ item }: any) => (
    <StudioCard
      studio={item}
      onPress={() => navigation.push('StudioDetail', {
        slug: item.slug,
        name: item.name,
      })}
    />
  ), [navigation]);

  const isLoading =
    activeTab === 'artists' ? artistsLoading :
    activeTab === 'tattoos' ? tattoosLoading :
    studiosLoading;

  const items =
    activeTab === 'artists' ? savedArtists :
    activeTab === 'tattoos' ? savedTattoos :
    savedStudios;

  const emptyMessage =
    activeTab === 'artists' ? 'No saved artists yet. Browse and save your favorites!' :
    activeTab === 'tattoos' ? 'No saved tattoos yet. Browse and save your favorites!' :
    'No saved studios yet. Browse and save your favorites!';

  const browseTarget =
    activeTab === 'artists' ? 'ArtistsTab' :
    activeTab === 'studios' ? 'ArtistsTab' :
    'HomeTab';

  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'artists' && styles.tabActive]}
          onPress={() => setActiveTab('artists')}
        >
          <Text style={[styles.tabText, activeTab === 'artists' && styles.tabTextActive]}>
            Artists{!artistsLoading && savedArtists.length > 0 ? ` (${savedArtists.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'tattoos' && styles.tabActive]}
          onPress={() => setActiveTab('tattoos')}
        >
          <Text style={[styles.tabText, activeTab === 'tattoos' && styles.tabTextActive]}>
            Tattoos{!tattoosLoading && savedTattoos.length > 0 ? ` (${savedTattoos.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'studios' && styles.tabActive]}
          onPress={() => setActiveTab('studios')}
        >
          <Text style={[styles.tabText, activeTab === 'studios' && styles.tabTextActive]}>
            Studios{!studiosLoading && savedStudios.length > 0 ? ` (${savedStudios.length})` : ''}
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
      ) : items.length === 0 ? (
        <EmptyState
          message={emptyMessage}
          actionLabel="Browse"
          onAction={() => navigation.navigate(browseTarget)}
        />
      ) : activeTab === 'artists' ? (
        <FlatList
          key="artists-list"
          data={savedArtists}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderArtistItem}
          contentContainerStyle={styles.list}
        />
      ) : activeTab === 'tattoos' ? (
        <FlatList
          key="tattoos-grid"
          data={savedTattoos}
          numColumns={2}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderTattooItem}
          contentContainerStyle={styles.grid}
        />
      ) : (
        <FlatList
          key="studios-list"
          data={savedStudios}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderStudioItem}
          contentContainerStyle={styles.list}
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
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 8,
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
  list: {
    padding: 16,
  },
  grid: {
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  loader: {
    marginTop: 40,
  },
});
