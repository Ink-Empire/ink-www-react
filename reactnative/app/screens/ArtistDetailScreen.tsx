import React from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useArtist, useArtistPortfolio } from '@inkedin/shared/hooks';
import { useAuth } from '../contexts/AuthContext';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorView from '../components/common/ErrorView';
import StyleTag from '../components/common/StyleTag';
import TattooCard from '../components/cards/TattooCard';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';

export default function ArtistDetailScreen({ navigation, route }: any) {
  const { slug } = route.params;
  const { artist, loading, error } = useArtist(api, slug);
  const { portfolio, loading: portfolioLoading } = useArtistPortfolio(api, slug);
  const { user, toggleFavorite } = useAuth();

  if (loading) return <LoadingScreen />;
  if (error || !artist) return <ErrorView message={error?.message || 'Artist not found'} />;

  const isFavorited = user?.favorites?.artists?.includes(artist.id);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Avatar uri={artist.image?.uri} name={artist.name} size={80} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{artist.name}</Text>
          {(artist as any).studio?.name && (
            <Text style={styles.studio}>{(artist as any).studio.name}</Text>
          )}
          {artist.location && (
            <Text style={styles.location}>{artist.location}</Text>
          )}
        </View>
      </View>

      <View style={styles.actions}>
        <Button
          title="Book"
          onPress={() => navigation.navigate('Calendar', {
            artistId: artist.id,
            artistName: artist.name,
            artistSlug: slug,
          })}
          style={styles.actionButton}
        />
        {user && (
          <Button
            title={isFavorited ? 'Saved' : 'Save'}
            onPress={() => toggleFavorite('artist', artist.id)}
            variant={isFavorited ? 'secondary' : 'outline'}
            style={styles.actionButton}
          />
        )}
      </View>

      {(artist as any).about && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{(artist as any).about}</Text>
        </View>
      )}

      {artist.styles && artist.styles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Styles</Text>
          <View style={styles.tagsRow}>
            {artist.styles.map((style: any) => (
              <StyleTag key={style.id} label={style.name} />
            ))}
          </View>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Portfolio</Text>
        {portfolioLoading ? (
          <Text style={styles.mutedText}>Loading portfolio...</Text>
        ) : portfolio.length === 0 ? (
          <Text style={styles.mutedText}>No tattoos yet</Text>
        ) : (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={portfolio}
            keyExtractor={(item: any) => String(item.id)}
            renderItem={({ item }: any) => (
              <TattooCard
                tattoo={item}
                size="small"
                onPress={() => navigation.navigate('TattooDetail', { id: item.id })}
              />
            )}
          />
        )}
      </View>

      <View style={styles.section}>
        {artist.email && (
          <TouchableOpacity onPress={() => Linking.openURL(`mailto:${artist.email}`)}>
            <Text style={styles.contactLink}>Email: {artist.email}</Text>
          </TouchableOpacity>
        )}
        {artist.phone && (
          <TouchableOpacity onPress={() => Linking.openURL(`tel:${artist.phone}`)}>
            <Text style={styles.contactLink}>Phone: {artist.phone}</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  headerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  studio: {
    color: colors.accent,
    fontSize: 14,
    marginTop: 2,
  },
  location: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 8,
  },
  actionButton: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  aboutText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  mutedText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  contactLink: {
    color: colors.accent,
    fontSize: 14,
    paddingVertical: 4,
  },
  bottomPadding: {
    height: 32,
  },
});
