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
  RefreshControl,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { useArtist } from '@inkedin/shared/hooks';
import { createTattooService } from '@inkedin/shared/services';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorView from '../components/common/ErrorView';
import StyleTag from '../components/common/StyleTag';
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

type TabType = 'portfolio' | 'info';

export default function ArtistDetailScreen({ navigation, route }: any) {
  const { slug, name: routeName } = route.params;
  const { artist, loading, error, refetch } = useArtist(api, slug);
  const { user, toggleFavorite } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [activeTab, setActiveTab] = useState<TabType>('portfolio');
  const [activeStyleFilter, setActiveStyleFilter] = useState<number | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const tattooService = useMemo(() => createTattooService(api), []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  useEffect(() => {
    const sub = DeviceEventEmitter.addListener('tattoo-deleted', () => {
      refetch();
    });
    return () => sub.remove();
  }, [refetch]);

  const a = artist as any;
  const canMessage = a?.type === 'artist' || (a?.type === 'studio' && a?.is_claimed);
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

  const isStudio = a?.type === 'studio';
  const favoriteType = isStudio ? 'studio' : 'artist';
  const isFavorited = isStudio
    ? user?.favorites?.studios?.includes(artist?.id)
    : user?.favorites?.artists?.includes(artist?.id);

  const handleToggleFavorite = useCallback(async () => {
    if (!artist) return;
    try {
      await toggleFavorite(favoriteType, artist.id);
      showSnackbar(isFavorited ? 'Removed from saved' : (isStudio ? 'Studio saved' : 'Artist saved'));
    } catch {
      showSnackbar('Something went wrong', 'error');
    }
  }, [toggleFavorite, artist?.id, favoriteType, isFavorited, isStudio, showSnackbar]);

  const isOwner = user?.id === artist?.id;

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
    const allIds = filteredPortfolio.map((t: any) => t.id);
    setSelectedIds(prev => prev.size === allIds.length ? new Set() : new Set(allIds));
  }, [filteredPortfolio]);

  const handleBulkDelete = useCallback(() => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      `Delete ${selectedIds.size} post${selectedIds.size > 1 ? 's' : ''}?`,
      'This will permanently remove the selected tattoos and their images. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeleting(true);
            try {
              console.log('[BulkDelete] ids:', [...selectedIds]);
              const idsToDelete = [...selectedIds];
              const result = await tattooService.bulkDelete(idsToDelete);
              console.log('[BulkDelete] result:', JSON.stringify(result));
              const count = (result as any)?.deleted_count ?? idsToDelete.length;
              // Notify other screens (home feed, search, user profile) to remove these tattoos
              idsToDelete.forEach(id => DeviceEventEmitter.emit('tattoo-deleted', { id }));
              showSnackbar(`Deleted ${count} post${count !== 1 ? 's' : ''}`);
              setSelectMode(false);
              setSelectedIds(new Set());
              refetch();
            } catch (err: any) {
              console.error('[BulkDelete] error:', err?.message, err?.status, JSON.stringify(err?.data));
              showSnackbar('Failed to delete posts', 'error');
            } finally {
              setDeleting(false);
            }
          },
        },
      ],
    );
  }, [selectedIds, tattooService, showSnackbar, refetch]);

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
      {isOwner ? (
        <ArtistOwnerDashboard
          artistId={artist.id}
          artistName={artist.name}
          artistSlug={slug}
          navigation={navigation}
        />
      ) : (
        <View style={styles.actions}>
          {user && (
            <View style={styles.actionsTopRow}>
              <TouchableOpacity
                style={[styles.iconActionButton, !canMessage && styles.iconActionButtonDisabled]}
                onPress={() => navigation.navigate('InboxStack', {
                  screen: 'Conversation',
                  params: { clientId: artist.id, participantName: artist.name },
                })}
                activeOpacity={canMessage ? 0.7 : 1}
                disabled={!canMessage}
              >
                <MaterialIcons name="chat-bubble-outline" size={18} color={canMessage ? colors.textPrimary : colors.textMuted} />
                <Text style={[styles.iconActionButtonText, !canMessage && { color: colors.textMuted }]}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.iconActionButton}
                onPress={handleToggleFavorite}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={isFavorited ? 'bookmark' : 'bookmark-border'}
                  size={18}
                  color={isFavorited ? colors.accent : colors.textPrimary}
                />
                <Text style={[styles.iconActionButtonText, isFavorited && { color: colors.accent }]}>
                  {isFavorited ? 'Saved' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <TouchableOpacity
            style={[styles.bookButton, !settings.books_open && styles.bookButtonDisabled]}
            onPress={() => navigation.navigate('Calendar', {
              artistId: artist.id,
              artistName: artist.name,
              artistSlug: slug,
            })}
            disabled={!settings.books_open}
            activeOpacity={0.7}
          >
            <MaterialIcons name="event" size={20} color={settings.books_open ? colors.textOnLight : colors.textMuted} />
            <Text style={[styles.bookButtonText, !settings.books_open && styles.bookButtonTextDisabled]}>
              {settings.books_open ? 'Request to Book' : 'Not Currently Booking'}
            </Text>
          </TouchableOpacity>
          {settings.accepts_walk_ins && (
            <View style={styles.walkInsRow}>
              <MaterialIcons name="directions-walk" size={16} color={colors.success} />
              <Text style={styles.walkInsText}>Walk-ins Welcome</Text>
            </View>
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

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'portfolio' && styles.tabActive]}
          onPress={() => setActiveTab('portfolio')}
        >
          <MaterialIcons
            name="grid-on"
            size={20}
            color={activeTab === 'portfolio' ? colors.accent : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'portfolio' && styles.tabTextActive]}>
            Portfolio
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'info' && styles.tabActive]}
          onPress={() => setActiveTab('info')}
        >
          <MaterialIcons
            name="info-outline"
            size={20}
            color={activeTab === 'info' ? colors.accent : colors.textMuted}
          />
          <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
            Info
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'portfolio' ? (
        <>
          {/* Select mode bar OR Style filters */}
          {selectMode ? (
            <View style={styles.selectBar}>
              <TouchableOpacity onPress={selectAll} activeOpacity={0.7}>
                <Text style={styles.selectBarLink}>
                  {selectedIds.size === filteredPortfolio.length ? 'Deselect All' : 'Select All'}
                </Text>
              </TouchableOpacity>
              <View style={styles.selectBarRight}>
                {selectedIds.size > 0 && (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={handleBulkDelete}
                    disabled={deleting}
                    activeOpacity={0.7}
                  >
                    <MaterialIcons name="delete-outline" size={18} color="#fff" />
                    <Text style={styles.deleteBtnText}>
                      {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
                    </Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={toggleSelectMode} activeOpacity={0.7}>
                  <Text style={styles.selectBarLink}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              {isOwner && portfolio.length > 0 && (
                <View style={styles.selectBar}>
                  <TouchableOpacity onPress={toggleSelectMode} activeOpacity={0.7}>
                    <Text style={styles.selectBarLink}>Select</Text>
                  </TouchableOpacity>
                </View>
              )}
              {artistStyles.length > 1 && portfolio.length > 0 && (
                <View style={styles.filterSection}>
                  <TouchableOpacity
                    style={[styles.filterPill, !activeStyleFilter && styles.filterPillActive]}
                    onPress={() => setActiveStyleFilter(null)}
                  >
                    <Text style={[styles.filterPillText, !activeStyleFilter && styles.filterPillTextActive]}>
                      All ({portfolio.length})
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
            </>
          )}

          {loading && (
            <ActivityIndicator color={colors.accent} size="large" style={styles.loader} />
          )}

          {!loading && filteredPortfolio.length === 0 && (
            <Text style={styles.emptyText}>
              {activeStyleFilter ? 'No tattoos match this style' : 'No tattoos yet'}
            </Text>
          )}
        </>
      ) : (
        <View>
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

          {!hasBookingInfo && socialLinks.length === 0 && !artist.email && !artist.phone && (
            <Text style={styles.emptyText}>No additional info available</Text>
          )}

          <View style={styles.bottomPadding} />
        </View>
      )}
    </View>
  );

  const renderTattoo = ({ item }: any) => {
    const imageSource = item.primary_image?.uri || item.images?.[0]?.uri;
    const isSelected = selectedIds.has(item.id);
    return (
      <TouchableOpacity
        style={[styles.gridItem, selectMode && isSelected && styles.gridItemSelected]}
        activeOpacity={0.8}
        onPress={() => {
          if (selectMode) {
            toggleSelected(item.id);
          } else {
            navigation.push('TattooDetail', { id: item.id });
          }
        }}
        onLongPress={() => {
          if (isOwner && !selectMode) {
            setSelectMode(true);
            setSelectedIds(new Set([item.id]));
          }
        }}
      >
        {imageSource ? (
          <Image source={{ uri: imageSource }} style={styles.gridImage} />
        ) : (
          <View style={styles.gridPlaceholder}>
            <MaterialIcons name="image" size={28} color={colors.textMuted} />
          </View>
        )}
        {selectMode && (
          <View style={styles.checkOverlay}>
            <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
              {isSelected && <MaterialIcons name="check" size={16} color="#fff" />}
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      style={styles.container}
      data={activeTab === 'portfolio' && !loading ? filteredPortfolio : []}
      numColumns={2}
      keyExtractor={(item: any) => String(item.id)}
      renderItem={renderTattoo}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={activeTab === 'portfolio' ? <View style={styles.bottomPadding} /> : null}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.accent}
        />
      }
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionsTopRow: {
    flexDirection: 'row',
    gap: 10,
  },
  iconActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  iconActionButtonDisabled: {
    opacity: 0.5,
  },
  iconActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  bookButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 8,
    backgroundColor: colors.accent,
  },
  bookButtonDisabled: {
    opacity: 0.5,
  },
  bookButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textOnLight,
  },
  bookButtonTextDisabled: {
    color: colors.textMuted,
  },
  walkInsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  walkInsText: {
    color: colors.success,
    fontSize: 13,
    fontWeight: '600',
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

  // Tab Bar
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: colors.accent,
  },
  tabText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  tabTextActive: {
    color: colors.accent,
  },

  // Filter
  filterSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
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

  // Select mode
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
