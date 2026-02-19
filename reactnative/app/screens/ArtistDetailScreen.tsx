import React, { useState, useMemo, useCallback, useEffect } from 'react';
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
  DeviceEventEmitter,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useArtist } from '@inkedin/shared/hooks';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorView from '../components/common/ErrorView';
import StyleTag from '../components/common/StyleTag';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import ArtistOwnerDashboard from '../components/artist/ArtistOwnerDashboard';

const screenWidth = Dimensions.get('window').width;
const GRID_PADDING = 12;
const GRID_GAP = 4;
const COLUMN_WIDTH = (screenWidth - GRID_PADDING * 2 - GRID_GAP) / 2;

const SOCIAL_ICONS: Record<string, string> = {
  instagram: 'camera-alt',
  facebook: 'facebook',
  x: 'tag',
  tiktok: 'music-note',
  bluesky: 'cloud',
};

export default function ArtistDetailScreen({ navigation, route }: any) {
  const { slug, name: routeName } = route.params;
  const { artist, loading, error, refetch } = useArtist(api, slug);
  const { user, toggleFavorite } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [activeStyleFilter, setActiveStyleFilter] = useState<number | null>(null);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tattoo-deleted', () => {
      refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  const a = artist as any;
  const portfolio = (a?.tattoos as any[]) || [];

  const filteredPortfolio = useMemo(() => {
    if (!activeStyleFilter) return portfolio;
    return portfolio.filter((tattoo: any) => {
      const tattooStyles = tattoo.styles || [];
      return tattooStyles.some((s: any) => {
        const id = typeof s === 'number' ? s : s?.id;
        return id === activeStyleFilter;
      });
    });
  }, [portfolio, activeStyleFilter]);

  const isFavorited = user?.favorites?.artists?.includes(artist?.id);

  const handleToggleFavorite = useCallback(async () => {
    if (!artist) return;
    try {
      await toggleFavorite('artist', artist.id);
      showSnackbar(isFavorited ? 'Removed from saved' : 'Artist saved');
    } catch {
      showSnackbar('Something went wrong', 'error');
    }
  }, [toggleFavorite, artist?.id, isFavorited, showSnackbar]);

  if (loading) return <LoadingScreen />;
  if (error || !artist) return <ErrorView message={error?.message || 'Artist not found'} />;

  const imageUri = a.primary_image?.uri || (typeof a.image === 'string' && a.image ? a.image : a.image?.uri);
  const socialLinks: any[] = a.social_media_links || [];
  const artistStyles: any[] = artist.styles || [];
  const settings = a.settings || {};

  const hasBookingInfo =
    settings.hourly_rate ||
    settings.consultation_fee ||
    settings.minimum_session ||
    settings.deposit_amount;

  const renderHeader = () => (
    <View>
      {/* Hero Header */}
      <View style={styles.header}>
        <View style={styles.avatarBorder}>
          <Avatar uri={imageUri} name={artist.name || routeName} size={100} />
        </View>
        <Text style={styles.name}>{artist.name || routeName}</Text>
        {a.studio?.name && (
          <TouchableOpacity
            onPress={() => a.studio?.slug && navigation.push('StudioDetail', {
              slug: a.studio.slug,
              name: a.studio.name,
            })}
            activeOpacity={a.studio?.slug ? 0.7 : 1}
          >
            <Text style={styles.studio}>{a.studio.name}</Text>
          </TouchableOpacity>
        )}
        {artist.location && (
          <View style={styles.locationRow}>
            <MaterialIcons name="location-on" size={14} color={colors.textMuted} />
            <Text style={styles.locationText}>{artist.location}</Text>
          </View>
        )}
      </View>

      {/* Actions */}
      {user?.id === artist?.id ? (
        <ArtistOwnerDashboard
          artistId={artist.id}
          artistName={artist.name}
          artistSlug={slug}
          navigation={navigation}
        />
      ) : (
        <View style={styles.actions}>
          <Button
            title={!settings.books_open ? 'Not Currently Booking' : 'Book'}
            onPress={() => navigation.navigate('Calendar', {
              artistId: artist.id,
              artistName: artist.name,
              artistSlug: slug,
            })}
            disabled={!settings.books_open}
            style={styles.actionButton}
          />
          {user && (
            <Button
              title={isFavorited ? 'Saved' : 'Save'}
              onPress={handleToggleFavorite}
              variant={isFavorited ? 'secondary' : 'outline'}
              style={styles.actionButton}
            />
          )}
        </View>
      )}

      {/* About */}
      {a.about ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>{a.about}</Text>
        </View>
      ) : null}

      {/* Styles */}
      {artistStyles.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Styles</Text>
          <View style={styles.tagsRow}>
            {artistStyles.map((style: any) => (
              <StyleTag key={style.id} label={style.name} />
            ))}
          </View>
        </View>
      )}

      {/* Booking Info */}
      {hasBookingInfo && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Booking Info</Text>
          <View style={styles.bookingCard}>
            {settings.accepts_consultations && (
              <View style={styles.bookingRow}>
                <Text style={styles.bookingLabel}>Consultation</Text>
                <Text style={styles.bookingValue}>
                  {settings.consultation_fee ? `$${settings.consultation_fee}` : 'Free'}
                </Text>
              </View>
            )}
            {settings.hourly_rate ? (
              <View style={styles.bookingRow}>
                <Text style={styles.bookingLabel}>Hourly Rate</Text>
                <Text style={styles.bookingValue}>${settings.hourly_rate}</Text>
              </View>
            ) : null}
            {settings.minimum_session ? (
              <View style={styles.bookingRow}>
                <Text style={styles.bookingLabel}>Min Session</Text>
                <Text style={styles.bookingValue}>{settings.minimum_session} hours</Text>
              </View>
            ) : null}
            {settings.deposit_amount ? (
              <View style={styles.bookingRow}>
                <Text style={styles.bookingLabel}>Deposit</Text>
                <Text style={styles.bookingValue}>${settings.deposit_amount}</Text>
              </View>
            ) : null}
          </View>
        </View>
      )}

      {/* Social Links */}
      {socialLinks.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Media</Text>
          {socialLinks.map((link: any) => (
            <TouchableOpacity
              key={link.platform}
              style={styles.socialRow}
              onPress={() => { if (link.url) Linking.openURL(link.url); }}
            >
              <MaterialIcons
                name={SOCIAL_ICONS[link.platform] || 'link'}
                size={18}
                color={colors.accent}
              />
              <View style={styles.socialInfo}>
                <Text style={styles.socialPlatform}>
                  {link.platform.charAt(0).toUpperCase() + link.platform.slice(1)}
                </Text>
                <Text style={styles.socialUsername}>@{link.username}</Text>
              </View>
              <MaterialIcons name="open-in-new" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Portfolio Header + Style Filter */}
      <View style={styles.section}>
        <View style={styles.portfolioHeader}>
          <Text style={styles.sectionTitle}>
            Portfolio{!loading && portfolio.length > 0 ? ` (${filteredPortfolio.length})` : ''}
          </Text>
        </View>

        {artistStyles.length > 1 && portfolio.length > 0 && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterPill, !activeStyleFilter && styles.filterPillActive]}
              onPress={() => setActiveStyleFilter(null)}
            >
              <Text style={[styles.filterPillText, !activeStyleFilter && styles.filterPillTextActive]}>
                All
              </Text>
            </TouchableOpacity>
            {artistStyles.map((style: any) => (
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

      {loading && (
        <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
      )}

      {!loading && filteredPortfolio.length === 0 && (
        <Text style={styles.emptyText}>
          {activeStyleFilter ? 'No tattoos match this style' : 'No tattoos yet'}
        </Text>
      )}
    </View>
  );

  const renderFooter = () => (
    <View>
      {/* Contact */}
      {(artist.email || artist.phone) && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact</Text>
          {artist.email && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`mailto:${artist.email}`)}
            >
              <MaterialIcons name="email" size={18} color={colors.accent} />
              <Text style={styles.contactText}>{artist.email}</Text>
            </TouchableOpacity>
          )}
          {artist.phone && (
            <TouchableOpacity
              style={styles.contactRow}
              onPress={() => Linking.openURL(`tel:${artist.phone}`)}
            >
              <MaterialIcons name="phone" size={18} color={colors.accent} />
              <Text style={styles.contactText}>{artist.phone}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
      <View style={styles.bottomPadding} />
    </View>
  );

  const renderTattoo = ({ item }: any) => {
    const imageSource = item.primary_image?.uri || item.images?.[0]?.uri;
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
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={loading ? [] : filteredPortfolio}
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
  studio: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '500',
    marginTop: 4,
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

  // Booking Info
  bookingCard: {
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    padding: 14,
  },
  bookingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  bookingLabel: {
    color: colors.textMuted,
    fontSize: 14,
  },
  bookingValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },

  // Social
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  socialInfo: {
    flex: 1,
  },
  socialPlatform: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  socialUsername: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 1,
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
