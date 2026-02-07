import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import EmptyState from '../components/common/EmptyState';

type Tab = 'artists' | 'tattoos';

export default function FavoritesScreen({ navigation }: any) {
  const [activeTab, setActiveTab] = useState<Tab>('artists');

  const [savedArtists, setSavedArtists] = useState<any[]>([]);
  const [savedTattoos, setSavedTattoos] = useState<any[]>([]);
  const [artistsLoading, setArtistsLoading] = useState(true);
  const [tattoosLoading, setTattoosLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchFavorites = useCallback(async () => {
    mountedRef.current = true;

    setArtistsLoading(true);
    setTattoosLoading(true);

    try {
      const [artistRes, tattooRes] = await Promise.all([
        api.get<any>('/client/favorites', { requiresAuth: true }),
        api.get<any>('/client/saved-tattoos', { requiresAuth: true }),
      ]);

      if (mountedRef.current) {
        setSavedArtists(Array.isArray(artistRes?.favorites) ? artistRes.favorites : []);
        setSavedTattoos(Array.isArray(tattooRes?.tattoos) ? tattooRes.tattoos : []);
      }
    } catch (err) {
      console.error('Failed to fetch favorites:', err);
    } finally {
      if (mountedRef.current) {
        setArtistsLoading(false);
        setTattoosLoading(false);
      }
    }
  }, []);

  // Refresh when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchFavorites();
      return () => { mountedRef.current = false; };
    }, [fetchFavorites])
  );

  const renderArtistItem = useCallback(({ item }: any) => (
    <ArtistCard
      artist={item}
      onPress={() => navigation.navigate('ArtistDetail', {
        slug: item.slug,
        name: item.name,
      })}
      onStudioPress={item.studio?.slug ? () => navigation.navigate('StudioDetail', {
        slug: item.studio.slug,
        name: item.studio.name,
      }) : undefined}
    />
  ), [navigation]);

  const renderTattooItem = useCallback(({ item }: any) => (
    <TattooCard
      tattoo={item}
      onPress={() => navigation.navigate('TattooDetail', { id: item.id })}
    />
  ), [navigation]);

  const isLoading = activeTab === 'artists' ? artistsLoading : tattoosLoading;
  const items = activeTab === 'artists' ? savedArtists : savedTattoos;

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
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
      ) : items.length === 0 ? (
        <EmptyState
          message={`No saved ${activeTab} yet. Browse and save your favorites!`}
          actionLabel="Browse"
          onAction={() => navigation.navigate('HomeTab')}
        />
      ) : activeTab === 'artists' ? (
        <FlatList
          key="artists-list"
          data={savedArtists}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderArtistItem}
          contentContainerStyle={styles.list}
        />
      ) : (
        <FlatList
          key="tattoos-grid"
          data={savedTattoos}
          numColumns={2}
          keyExtractor={(item: any) => String(item.id)}
          renderItem={renderTattooItem}
          contentContainerStyle={styles.grid}
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
