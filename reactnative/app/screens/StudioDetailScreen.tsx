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
  TextInput,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { tattooCardUrl } from '@inkedin/shared/utils/imgix';
import { api } from '../../lib/api';
import { useStudio, useStudioGallery, useStudioArtists, useStudioSpotlights, useStudioGuides } from '@inkedin/shared/hooks';
import {
  type SectionKey,
  bandLayout,
  bandOf,
  resolveArrangement,
} from '@inkedin/shared/utils/studioSections';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorView from '../components/common/ErrorView';
import StyleTag from '../components/common/StyleTag';
import Button from '../components/common/Button';
import Avatar from '../components/common/Avatar';
import { studioService } from '../../lib/services';

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

function StudioInviteCard({ studioId, showSnackbar }: { studioId: number; showSnackbar: (msg: string, type?: string) => void }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSend = useCallback(async () => {
    if (!email) return;
    setLoading(true);
    try {
      await studioService.inviteStudioOwner(studioId, email);
      setSent(true);
      setEmail('');
      showSnackbar('Invitation sent successfully');
    } catch {
      showSnackbar('Failed to send invitation', 'error');
    } finally {
      setLoading(false);
    }
  }, [email, studioId, showSnackbar]);

  return (
    <View style={styles.inviteCard}>
      <MaterialIcons name="storefront" size={24} color={colors.accent} />
      <Text style={styles.inviteTitle}>Know the owner?</Text>
      <Text style={styles.inviteDescription}>
        Invite them to claim this studio profile.
      </Text>
      {sent ? (
        <Text style={styles.inviteSuccess}>Invitation sent!</Text>
      ) : (
        <View style={styles.inviteForm}>
          <TextInput
            style={styles.inviteInput}
            placeholder="owner@email.com"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />
          <Button
            title={loading ? 'Sending...' : 'Send Invite'}
            onPress={handleSend}
            disabled={loading || !email}
            style={styles.inviteButton}
          />
        </View>
      )}
    </View>
  );
}

export default function StudioDetailScreen({ navigation, route }: any) {
  const { slug } = route.params;
  const { studio, loading, error } = useStudio(api, slug);
  const { gallery, loading: galleryLoading } = useStudioGallery(api, slug);
  const { artists, loading: artistsLoading } = useStudioArtists(api, slug);
  const { spotlights } = useStudioSpotlights(api, slug);
  const { guides } = useStudioGuides(api, slug);
  const { user, toggleFavorite } = useAuth();
  const { showSnackbar } = useSnackbar();

  const [activeStyleFilter, setActiveStyleFilter] = useState<number | null>(null);
  const [announcementsExpanded, setAnnouncementsExpanded] = useState(false);

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

  const spotlightSection = spotlights.length > 0 && (
        <View style={styles.spotlightSection}>
          <Text style={styles.spotlightHeading}>Spotlight</Text>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            data={spotlights}
            keyExtractor={(item: any) => String(item.id)}
            contentContainerStyle={styles.spotlightRow}
            renderItem={({ item }: any) => {
              const pinned = item.item;
              if (!pinned) return null;
              const isArtist = item.type === 'artist';
              const uri = isArtist ? pinned.image?.uri : pinned.primary_image?.uri;
              const label = isArtist ? pinned.name : (pinned.title || 'Untitled');
              const caption = isArtist ? 'Artist' : (pinned.primary_style || 'Tattoo');

              return (
                <TouchableOpacity
                  style={styles.spotlightCard}
                  onPress={() => isArtist
                    ? navigation.push('ArtistDetail', { slug: pinned.slug })
                    : navigation.push('TattooDetail', { id: pinned.id })}
                >
                  {uri ? (
                    <Image source={{ uri }} style={styles.spotlightImage} />
                  ) : (
                    <View style={[styles.spotlightImage, styles.spotlightPlaceholder]}>
                      <Text style={styles.spotlightInitials}>
                        {String(label).substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.spotlightLabel} numberOfLines={1}>{label}</Text>
                  <Text style={styles.spotlightCaption} numberOfLines={1}>{caption}</Text>
                </TouchableOpacity>
              );
            }}
          />
        </View>
      );

  const artistsSection = artists.length > 0 && (
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
      );

  const hoursSection = hours.length > 0 && (
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
      );

  const contactSection = (s.phone || s.email || s.website) && (
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
      );

  const locationSection = (s.address || s.city) && (
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
      );

  const guidesSection = guides.length > 0 && (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Guides</Text>
      {guides.map((guide: any) => {
        // A guide written but not yet published has no slug, and so no page.
        const opens = Boolean(guide.url && guide.slug);

        return (
          <TouchableOpacity
            key={guide.id ?? guide.slug ?? guide.title}
            style={styles.guideCard}
            activeOpacity={opens ? 0.7 : 1}
            disabled={!opens}
            onPress={() => navigation.push('StudioPost', {
              studioSlug: slug,
              postSlug: guide.slug,
              kind: 'guides',
              title: guide.title,
            })}
          >
            <Text style={styles.guideKind}>
              {guide.type_label || 'Guide'}
            </Text>
            <Text style={styles.guideTitle}>{guide.title}</Text>
            {!!guide.excerpt && (
              <Text style={styles.guideExcerpt} numberOfLines={2}>{guide.excerpt}</Text>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const arrangement = resolveArrangement(s);

  /**
   * The sections a studio can move. Everything else on this screen - the
   * banner, the announcements, the header, the portfolio - is structure, and
   * stays where it is on the web too.
   */
  const sectionNodes: Partial<Record<SectionKey, React.ReactNode>> = {
    spotlight: spotlightSection,
    artists: artistsSection,
    hours: hoursSection,
    contact: contactSection,
    location: locationSection,
    guides: guidesSection,
  };

  /**
   * A band, in the order the studio arranged it.
   *
   * A phone is one column, so the two-column grid the web lays out collapses
   * to its reading order: each row's left cell, then its right. Widths and
   * columns still decide that order, they just stop deciding anything visual.
   */
  const renderBand = (lane: 'feature' | 'info') => {
    const { rows } = bandLayout(lane, arrangement, (key) => sectionNodes[key] !== undefined);

    return rows
      .flatMap((row) => (row.full ? [row.full] : [row.left, row.right]))
      .filter(Boolean)
      .map((key) => (
        <React.Fragment key={String(key)}>{sectionNodes[key as SectionKey]}</React.Fragment>
      ));
  };

  const renderHeader = () => (
    <View>
      {/* Banner - only when the studio has set one, so a studio that never
          touches this keeps the original header */}
      {s.banner?.uri && (
        <Image source={{ uri: s.banner.uri }} style={styles.banner} resizeMode="cover" />
      )}

      {/* Announcements - newest filled, the rest quiet, anything past the
          first two collapsed. Absent entirely when there are none. */}
      {(s.announcements || []).length > 0 && (
        <View style={styles.announcements}>
          {(announcementsExpanded ? s.announcements : s.announcements.slice(0, 2)).map(
            (announcement: any, index: number) => {
              const isLead = index === 0;
              // Only some kinds get a page of their own - a "walk-ins today"
              // notice deliberately does not - so only some of these open.
              const opens = Boolean(announcement.url && announcement.slug);

              return (
                <TouchableOpacity
                  key={announcement.id ?? announcement.title}
                  style={[styles.announcement, isLead ? styles.announcementLead : styles.announcementQuiet]}
                  activeOpacity={opens ? 0.7 : 1}
                  disabled={!opens}
                  onPress={() => navigation.push('StudioPost', {
                    studioSlug: slug,
                    postSlug: announcement.slug,
                    kind: 'news',
                    title: announcement.title,
                  })}
                >
                  <MaterialIcons
                    name="campaign"
                    size={20}
                    color={isLead ? colors.background : colors.accent}
                  />
                  <View style={styles.announcementBody}>
                    {!!announcement.type_label && announcement.type !== 'general' && (
                      <Text style={[styles.announcementKind, isLead && styles.announcementKindLead]}>
                        {announcement.type_label}
                      </Text>
                    )}
                    <Text style={[styles.announcementTitle, isLead && styles.announcementTitleLead]}>
                      {announcement.title}
                    </Text>
                    <Text style={[styles.announcementText, isLead && styles.announcementTextLead]}>
                      {announcement.content}
                    </Text>
                  </View>
                  {opens && (
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={isLead ? colors.background : colors.textMuted}
                    />
                  )}
                </TouchableOpacity>
              );
            },
          )}

          {s.announcements.length > 2 && (
            <TouchableOpacity onPress={() => setAnnouncementsExpanded((open: boolean) => !open)}>
              <Text style={styles.announcementToggle}>
                {announcementsExpanded
                  ? 'Show less'
                  : `${s.announcements.length - 2} more ${s.announcements.length - 2 === 1 ? 'announcement' : 'announcements'}`}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

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

      {/* What the studio put in the band above the fold. On the web this
          sits above the Portfolio and Info tabs; here it is the first thing
          under the header, which carries the same meaning. */}
      {renderBand('feature')}

      {/* Actions */}
      <View style={styles.actions}>
        {s.phone && s.is_claimed && (
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

      {/* Unclaimed Studio Invite */}
      {!s.is_claimed && user && (
        <>
          <StudioInviteCard studioId={studio.id} showSnackbar={showSnackbar} />
          <TouchableOpacity
            style={styles.claimLink}
            onPress={() => Linking.openURL(`https://getinked.in/register?userType=studio&studioSlug=${slug}`)}
          >
            <Text style={styles.claimLinkText}>This is my studio</Text>
            <MaterialIcons name="chevron-right" size={18} color={colors.accent} />
          </TouchableOpacity>
        </>
      )}

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

      {/* Only while the artist list belongs to no band. Every layout but
          team pins it here, exactly as the web pins it to the portfolio
          sidebar - but a studio can lift it into a band, and then the band
          places it instead. */}
      {bandOf('artists', arrangement.template, arrangement.bands) === null && artistsSection}

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

      {/* What the studio put behind the Info tab on the web. Here it is
          simply further down the page, which carries the same meaning. */}
      {renderBand('info')}

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
    const rawUri = item.primary_image?.uri || item.images?.[0]?.uri;
    const editParams = item.primary_image?.edit_params || item.images?.[0]?.edit_params;
    const imageSource = rawUri ? tattooCardUrl(rawUri, editParams) : undefined;
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

  banner: {
    width: '100%',
    aspectRatio: 4,
    backgroundColor: colors.surface,
  },

  // Announcements
  announcements: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 8,
  },
  announcement: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
  },
  announcementLead: {
    backgroundColor: colors.accent,
  },
  announcementQuiet: {
    backgroundColor: 'rgba(201, 169, 98, 0.08)',
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
  },
  announcementBody: {
    flex: 1,
  },
  announcementKind: {
    fontSize: 10,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: 1,
  },
  announcementKindLead: {
    color: 'rgba(15, 15, 15, 0.65)',
  },
  announcementTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  announcementTitleLead: {
    color: colors.background,
    fontWeight: '700',
  },
  announcementText: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  announcementTextLead: {
    color: 'rgba(15, 15, 15, 0.78)',
  },
  announcementToggle: {
    fontSize: 13,
    color: colors.textSecondary,
    paddingVertical: 4,
  },

  // Spotlight
  spotlightSection: {
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  spotlightHeading: {
    fontSize: 18,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  spotlightRow: {
    paddingHorizontal: 16,
    gap: 12,
  },
  spotlightCard: {
    width: 110,
  },
  spotlightImage: {
    width: 110,
    height: 110,
    borderRadius: 10,
    backgroundColor: colors.surface,
  },
  spotlightPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotlightInitials: {
    fontSize: 24,
    color: colors.accent,
  },
  spotlightLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 6,
  },
  spotlightCaption: {
    fontSize: 11,
    color: colors.textSecondary,
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

  // Invite card
  inviteCard: {
    margin: 16,
    padding: 20,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  inviteTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  inviteDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 12,
  },
  inviteForm: {
    width: '100%',
    gap: 8,
  },
  inviteInput: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
  },
  inviteButton: {
    width: '100%',
  },
  inviteSuccess: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
  },
  claimLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginBottom: 4,
  },
  claimLinkText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '500',
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
  guideCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 12,
    marginBottom: 8,
  },
  guideKind: {
    fontSize: 11,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    color: colors.accent,
    marginBottom: 2,
  },
  guideTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  guideExcerpt: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
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
