import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Dimensions,
  Image,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useStudio, useStudioGallery, useStudioArtists } from '@inkedin/shared/hooks';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorView from '../components/common/ErrorView';
import StyleTag from '../components/common/StyleTag';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';

const screenWidth = Dimensions.get('window').width;
const GRID_PADDING = 12;
const GRID_GAP = 4;
const COLUMN_WIDTH = (screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2;

function formatHours(hours: any[]): { day: string; time: string }[] {
  if (!Array.isArray(hours) || hours.length === 0) return [];
  return hours.map((h: any) => ({
    day: h.day || '',
    time: h.hours || `${h.open_time} - ${h.close_time}`,
  }));
}

export default function StudioDetailScreen({ navigation, route }: any) {
  const { slug } = route.params;
  const { studio, loading, error } = useStudio(api, slug);
  const { gallery, loading: galleryLoading } = useStudioGallery(api, slug);
  const { artists, loading: artistsLoading } = useStudioArtists(api, slug);
  const { user, toggleFavorite } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [activeStyleFilter, setActiveStyleFilter] = useState<number | null>(null);

  const s = studio as any;

  // Collect unique styles from studio artists
  const studioStyles = useMemo(() => {
    const styleMap = new Map<number, { id: number; name: string }>();
    artists.forEach((artist: any) => {
      (artist.styles || []).forEach((style: any) => {
        if (style.id && !styleMap.has(style.id)) {
          styleMap.set(style.id, { id: style.id, name: style.name });
        }
      });
    });
    return Array.from(styleMap.values());
  }, [artists]);

  const filteredGallery = useMemo(() => {
    if (!activeStyleFilter) return gallery;
    return gallery.filter((tattoo: any) => {
      const tattooStyles = tattoo.styles || [];
      return tattooStyles.some((st: any) => {
        const id = typeof st === 'number' ? st : st?.id;
        return id === activeStyleFilter;
      });
    });
  }, [gallery, activeStyleFilter]);

  const isFavorited = user?.favorites?.studios?.includes(studio?.id);

  const handleToggleFavorite = useCallback(async () => {
    if (!studio) return;
    try {
      await toggleFavorite('studio', studio.id);
      showSnackbar(isFavorited ? 'Removed from saved' : 'Studio saved');
    } catch {
      showSnackbar('Something went wrong', 'error');
    }
  }, [toggleFavorite, studio?.id, isFavorited, showSnackbar]);

  if (loading) return <LoadingScreen />;
  if (error || !studio) return <ErrorView message={error?.message || 'Studio not found'} />;

  const imageUri = s.primary_image?.uri || (typeof s.image === 'string' && s.image ? s.image : s.image?.uri);
  const hours = formatHours(s.hours || []);

  const renderHeader = () => (
    <View>
      {/* Hero Header */}
      <View style={styles.header}>
        <View style={styles.avatarBorder}>
          <Avatar uri={imageUri} name={s.name} size={100} />
        </View>
        <Text style={styles.name}>{s.name}</Text>
        {s.location && (
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={14} color={colors.textMuted} />
            <Text style={styles.locationText}>{s.location}</Text>
          </View>
        )}
        {artists.length > 0 && (
          <Text style={styles.artistCount}>
            {artists.length} {artists.length === 1 ? 'Artist' : 'Artists'}
          </Text>
        )}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        {s.phone && (
          <Button
            title="Contact"
            onPress={() => Linking.openURL(`tel:${s.phone}`)}
            style={styles.actionButton}
          />
        )}
        {user && (
          <Button
            title={isFavorited ? 'Saved' : 'Save'}
            onPress={handleToggleFavorite}
            variant={isFavorited ? 'secondary' : 'outline'}
            style={styles.actionButton}
          />
        )}
      </View>

      {/* About */}
      {s.about ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{s.about}</Text>
        </View>
      ) : null}

      {/* Guest Artists */}
      {s.seeking_guest_artists && s.guest_spot_details ? (
        <View style={styles.section}>
          <View style={styles.guestBadge}>
            <MaterialIcons name="star" size={16} color={colors.accent} />
            <Text style={styles.guestBadgeText}>Seeking Guest Artists</Text>
          </View>
          <Text style={styles.guestDetails}>{s.guest_spot_details}</Text>
        </View>
      ) : null}

      {/* Artists */}
      {artists.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Artists</Text>
          {artists.map((artist: any) => {
            const artistImage = artist.primary_image?.uri || (typeof artist.image === 'string' ? artist.image : artist.image?.uri);
            return (
              <TouchableOpacity
                key={artist.id}
                style={styles.artistRow}
                onPress={() => navigation.push('ArtistDetail', {
                  slug: artist.slug,
                  name: artist.name,
                })}
              >
                <Avatar uri={artistImage} name={artist.name} size={44} />
                <View style={styles.artistInfo}>
                  <Text style={styles.artistName}>{artist.name}</Text>
                  {artist.styles && artist.styles.length > 0 && (
                    <Text style={styles.artistSpecialty} numberOfLines={1}>
                      {artist.styles.map((st: any) => st.name).join(', ')}
                    </Text>
                  )}
                </View>
                <MaterialIcons name="chevron-right" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Styles */}
      {studioStyles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Styles</Text>
          <View style={styles.tagsRow}>
            {studioStyles.map(style => (
              <StyleTag key={style.id} label={style.name} />
            ))}
          </View>
        </View>
      )}

      {/* Hours */}
      {hours.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hours</Text>
          <View style={styles.hoursCard}>
            {hours.map((h, i) => (
              <View key={i} style={styles.hoursRow}>
                <Text style={styles.hoursDay}>{h.day}</Text>
                <Text style={styles.hoursTime}>{h.time}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Contact Info */}
      {(s.phone || s.email || s.website) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {s.phone && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${s.phone}`)}
            >
              <MaterialIcons name="phone" size={18} color={colors.accent} />
              <Text style={styles.contactText}>{s.phone}</Text>
            </TouchableOpacity>
          )}
          {s.email && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`mailto:${s.email}`)}
            >
              <MaterialIcons name="email" size={18} color={colors.accent} />
              <Text style={styles.contactText}>{s.email}</Text>
            </TouchableOpacity>
          )}
          {s.website && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => {
                const url = s.website.startsWith('http') ? s.website : `https://${s.website}`;
                Linking.openURL(url);
              }}
            >
              <MaterialIcons name="language" size={18} color={colors.accent} />
              <Text style={styles.contactText}>{s.website}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Address / Directions */}
      {(s.address || s.city) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <TouchableOpacity
            style={styles.contactRow}
            onPress={() => {
              const query = encodeURIComponent(
                [s.address, s.city, s.state, s.postal_code].filter(Boolean).join(', ')
              );
              Linking.openURL(`https://maps.google.com/?q=${query}`);
            }}
          >
            <MaterialIcons name="directions" size={18} color={colors.accent} />
            <View>
              {s.address && <Text style={styles.contactText}>{s.address}</Text>}
              <Text style={styles.addressLine}>
                {[s.city, s.state, s.postal_code].filter(Boolean).join(', ')}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* Portfolio Header + Style Filter */}
      <View style={styles.section}>
        <View style={styles.portfolioHeader}>
          <Text style={styles.sectionTitle}>
            Portfolio{!galleryLoading && gallery.length > 0 ? ` (${filteredGallery.length})` : ''}
          </Text>
        </View>

        {studioStyles.length > 1 && gallery.length > 0 && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterPill, !activeStyleFilter && styles.filterPillActive]}
              onPress={() => setActiveStyleFilter(null)}
            >
              <Text style={[styles.filterPillText, !activeStyleFilter && styles.filterPillTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {studioStyles.map(style => (
              <TouchableOpacity
                key={style.id}
                style={[styles.filterPill, activeStyleFilter === style.id && styles.filterPillActive]}
                onPress={() => setActiveStyleFilter(activeStyleFilter === style.id ? null : style.id)}
              >
                <Text style={[
                  styles.filterPillText,
                  activeStyleFilter === style.id && styles.filterPillTextActive,
                ]}>
                  {style.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {galleryLoading && (
        <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
      )}

      {!galleryLoading && filteredGallery.length === 0 && (
        <Text style={styles.emptyText}>
          {activeStyleFilter ? 'No tattoos match this style' : 'No tattoos yet'}
        </Text>
      )}
    </View>
  );

  const renderFooter = () => <View style={styles.bottomPadding} />;

  const renderTattoo = ({ item }: any) => {
    const imageSource = item.primary_image?.uri || item.images?.[0]?.uri;
    const tattooArtistName = item.artist?.name || item.artist_name;
    const tattooArtistSlug = item.artist?.slug || item.artist_slug;
    return (
      <TouchableOpacity
        style={styles.gridItem}
        activeOpacity={0.8}
        onPress={() => navigation.push('TattooDetail', { id: item.id })}
      >
        {imageSource ? (
          <Image source={{ uri: imageSource }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridPlaceholder}>
            <MaterialIcons name="image" size={28} color={colors.textMuted} />
          </View>
        )}
        {tattooArtistName && (
          <TouchableOpacity
            style={styles.gridArtistOverlay}
            onPress={() => tattooArtistSlug && navigation.push('ArtistDetail', {
              slug: tattooArtistSlug,
              name: tattooArtistName,
            })}
            activeOpacity={tattooArtistSlug ? 0.7 : 1}
          >
            <Text style={styles.gridArtistName} numberOfLines={1}>{tattooArtistName}</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={galleryLoading ? [] : filteredGallery}
      numColumns={2}
      keyExtractor={(item: any) => String(item.id)}
      renderItem={renderTattoo}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    alignItems: 'center',
    paddingVertical: 28,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarBorder: {
    borderWidth: 2,
    borderColor: colors.accent,
    borderRadius: 54,
    padding: 2,
  },
  name: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 14,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 4,
  },
  locationText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  artistCount: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
  },

  // Actions
  actions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionButton: {
    flex: 1,
  },

  // Sections
  section: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  aboutText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // Guest artists
  guestBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  guestBadgeText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  guestDetails: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  // Artists
  artistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  artistInfo: {
    flex: 1,
  },
  artistName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  artistSpecialty: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },

  // Hours
  hoursCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    padding: 14,
  },
  hoursRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  hoursDay: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  hoursTime: {
    color: colors.textMuted,
    fontSize: 14,
  },

  // Contact
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  contactText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  addressLine: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },

  // Portfolio
  portfolioHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: -4,
  },
  filterPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  filterPillText: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  filterPillTextActive: {
    color: colors.accent,
  },

  // Grid
  gridItem: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH,
    margin: GRID_GAP / 2,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    marginLeft: GRID_PADDING / 2,
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
  gridArtistOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  gridArtistName: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },

  // Misc
  loader: {
    marginVertical: 24,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 24,
  },
  bottomPadding: {
    height: 32,
  },
});
