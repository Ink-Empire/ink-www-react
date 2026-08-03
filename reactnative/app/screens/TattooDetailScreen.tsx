import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  FlatList,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Alert,
  DeviceEventEmitter,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { api } from '../../lib/api';
import { tattooService, messageService } from '../../lib/services';
import { tattooModalUrl, profileImageUrl } from '@inkedin/shared/utils/imgix';
import { useTattoo } from '@inkedin/shared/hooks';
import { useAuth } from '../contexts/AuthContext';
import { useSnackbar } from '../contexts/SnackbarContext';
import LoadingScreen from '../components/common/LoadingScreen';
import ErrorView from '../components/common/ErrorView';
import StyleTag from '../components/common/StyleTag';
import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';

const screenWidth = Dimensions.get('window').width;

export default function TattooDetailScreen({ navigation, route }: any) {
  const { id } = route.params;
  const { tattoo, loading, error, refetch } = useTattoo(api, id);
  const { user, toggleFavorite } = useAuth();
  const { showSnackbar } = useSnackbar();
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      refetch();
    });
    return unsubscribe;
  }, [navigation, refetch]);

  const isOwner = user?.id === tattoo?.artist_id || user?.id === tattoo?.uploaded_by_user_id;

  const handleEditPress = useCallback(() => {
    if (!tattoo) return;
    Alert.alert('Manage Tattoo', undefined, [
      {
        text: 'Edit',
        onPress: () => navigation.push('EditTattoo', { id: tattoo.id }),
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          Alert.alert(
            'Delete Tattoo',
            'Are you sure you want to delete this tattoo? This cannot be undone.',
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  try {
                    await tattooService.delete(tattoo.id);
                    DeviceEventEmitter.emit('tattoo-deleted', { id: tattoo.id });
                    showSnackbar('Tattoo deleted');
                    navigation.goBack();
                  } catch {
                    showSnackbar('Failed to delete tattoo', 'error');
                  }
                },
              },
            ],
          );
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }, [tattoo, navigation, showSnackbar]);

  const allImages = useMemo(() => {
    if (!tattoo) return [];
    const imgs: { uri: string }[] = [];
    if (tattoo.images && Array.isArray(tattoo.images)) {
      tattoo.images.forEach((img: any) => {
        const uri = typeof img === 'string' ? img : img?.uri;
        const ep = typeof img === 'object' ? img?.edit_params : undefined;
        if (uri) imgs.push({ uri: tattooModalUrl(uri, ep) });
      });
    }
    if (imgs.length === 0) {
      const primaryUri = tattoo.primary_image?.uri;
      const ep = tattoo.primary_image?.edit_params;
      if (primaryUri) imgs.push({ uri: tattooModalUrl(primaryUri, ep) });
    }
    return imgs;
  }, [tattoo]);

  const onScrollEnd = useCallback((e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / screenWidth);
    setActiveIndex(index);
  }, []);

  const isFavorited = user?.favorites?.tattoos?.includes(tattoo?.id);

  const handleToggleFavorite = useCallback(async () => {
    if (!tattoo) return;
    try {
      await toggleFavorite('tattoo', tattoo.id);
      showSnackbar(isFavorited ? 'Removed from saved' : 'Tattoo saved');
    } catch {
      showSnackbar('Something went wrong', 'error');
    }
  }, [toggleFavorite, tattoo?.id, isFavorited, showSnackbar]);

  if (loading) return <LoadingScreen />;
  if (error || !tattoo) return <ErrorView message={error?.message || 'Tattoo not found'} />;

  const isSeeking = (tattoo as any).post_type === 'seeking';
  const artist = tattoo.artist;
  const artistId = artist?.id || (tattoo as any).artist_id;
  const artistName = artist?.name || (tattoo as any).artist_name;
  const artistSlug = artist?.slug || (tattoo as any).artist_slug;
  const rawArtistImageUri = artist?.primary_image?.uri || artist?.image?.uri || (tattoo as any).artist_image_uri;
  const artistImageUri = rawArtistImageUri ? profileImageUrl(rawArtistImageUri) : undefined;
  const studio = tattoo.studio || artist?.studio;
  const studioName = studio?.name || (tattoo as any).studio_name;
  const studioSlug = studio?.slug;
  const location = studio?.location || (tattoo as any).artist_location;
  const duration = (tattoo as any).duration;
  const uploaderName = (tattoo as any).uploader_name;
  const uploaderSlug = (tattoo as any).uploader_slug;
  const uploaderImageUri = (tattoo as any).uploader_image_uri ? profileImageUrl((tattoo as any).uploader_image_uri) : undefined;
  const uploaderId = (tattoo as any).uploaded_by_user_id;
  const isArtistUser = user?.type_id === 2;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header bar — above image */}
      <View style={styles.artistBar}>
        {isSeeking && uploaderName ? (
          <TouchableOpacity
            style={styles.artistHeader}
            onPress={() => uploaderSlug && navigation.push('UserProfile', { slug: uploaderSlug, name: uploaderName })}
            activeOpacity={uploaderSlug ? 0.7 : 1}
          >
            <Avatar uri={uploaderImageUri} name={uploaderName} size={40} />
            <View style={styles.artistHeaderInfo}>
              <Text style={styles.artistName}>{uploaderName}</Text>
              <View style={styles.seekingBadge}>
                <MaterialIcons name="search" size={12} color={colors.seeking} />
                <Text style={styles.seekingBadgeText}>Seeking Artist</Text>
              </View>
            </View>
          </TouchableOpacity>
        ) : !tattoo.artist_id && (tattoo as any).attributed_artist_name ? (
          <View style={styles.artistHeader}>
            <View style={[styles.attributedAvatar]}>
              <MaterialIcons name="person" size={20} color={colors.textMuted} />
            </View>
            <View style={styles.artistHeaderInfo}>
              <Text style={styles.artistName}>{(tattoo as any).attributed_artist_name}</Text>
              {studioName ? (
                <TouchableOpacity
                  onPress={() => studioSlug && navigation.push('StudioDetail', { slug: studioSlug, name: studioName })}
                  activeOpacity={studioSlug ? 0.7 : 1}
                >
                  <Text style={styles.studioName}>{studioName}</Text>
                </TouchableOpacity>
              ) : (tattoo as any).attributed_studio_name ? (
                <Text style={styles.studioName}>at {(tattoo as any).attributed_studio_name}</Text>
              ) : null}
              {location ? (
                <Text style={styles.artistLocation}>{location}</Text>
              ) : (tattoo as any).attributed_location ? (
                <Text style={styles.artistLocation}>{(tattoo as any).attributed_location}</Text>
              ) : null}
              <View style={styles.notOnInkedinBadge}>
                <Text style={styles.notOnInkedinText}>Not yet on InkedIn</Text>
              </View>
            </View>
          </View>
        ) : artistName ? (
          <TouchableOpacity
            style={styles.artistHeader}
            onPress={() => artistSlug && navigation.push('ArtistDetail', {
              slug: artistSlug,
              name: artistName,
            })}
            activeOpacity={artistSlug ? 0.7 : 1}
          >
            <Avatar uri={artistImageUri} name={artistName} size={40} />
            <View style={styles.artistHeaderInfo}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.artistName}>{artistName}</Text>
                {tattoo.approval_status === 'pending' && (
                  <Text style={styles.pendingText}>(pending)</Text>
                )}
              </View>
              {studioName && (
                <TouchableOpacity
                  onPress={() => studioSlug && navigation.push('StudioDetail', { slug: studioSlug, name: studioName })}
                  activeOpacity={studioSlug ? 0.7 : 1}
                >
                  <Text style={styles.studioName}>{studioName}</Text>
                </TouchableOpacity>
              )}
              {location && (
                <Text style={styles.artistLocation}>{location}</Text>
              )}
            </View>
          </TouchableOpacity>
        ) : (
          <View style={styles.artistHeader}>
            <View style={[styles.attributedAvatar]}>
              <MaterialIcons name="person" size={20} color={colors.textMuted} />
            </View>
            <View style={styles.artistHeaderInfo}>
              <Text style={styles.unknownArtistText}>Artist Unknown</Text>
              {studioName ? (
                <TouchableOpacity
                  onPress={() => studioSlug && navigation.push('StudioDetail', { slug: studioSlug, name: studioName })}
                  activeOpacity={studioSlug ? 0.7 : 1}
                >
                  <Text style={styles.studioName}>{studioName}</Text>
                </TouchableOpacity>
              ) : null}
              {location ? (
                <Text style={styles.artistLocation}>{location}</Text>
              ) : null}
            </View>
          </View>
        )}
        {user && !isOwner && (
          <Button
            title={isFavorited ? 'Saved' : 'Save'}
            onPress={handleToggleFavorite}
            variant={isFavorited ? 'secondary' : 'outline'}
            style={styles.saveButton}
          />
        )}
      </View>

      {allImages.length > 0 && (
        <View>
          <FlatList
            data={allImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={onScrollEnd}
            keyExtractor={(_, i) => String(i)}
            renderItem={({ item }) => (
              <Image
                source={{ uri: item.uri }}
                style={styles.image}
                resizeMode="cover"
              />
            )}
          />
          {isOwner && (
            <TouchableOpacity onPress={handleEditPress} style={styles.editButton}>
              <MaterialIcons name="edit" size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          )}
          {allImages.length > 1 && (
            <View style={styles.dots}>
              {allImages.map((_, i) => (
                <View
                  key={i}
                  style={[styles.dot, i === activeIndex && styles.dotActive]}
                />
              ))}
            </View>
          )}
        </View>
      )}

      <View style={styles.content}>
        {/* Styles and tags */}
        {((tattoo.styles && tattoo.styles.length > 0) ||
          (tattoo.tags && tattoo.tags.length > 0)) && (
          <View style={styles.tagsSection}>
            {tattoo.styles && tattoo.styles.length > 0 && (
              <View style={styles.tagsRow}>
                {tattoo.styles.map((style: any) => (
                  <StyleTag
                    key={style.id}
                    label={style.name}
                    onPress={() => navigation.navigate('HomeTab', { screen: 'Home', params: { filterStyles: [style.id] } })}
                  />
                ))}
              </View>
            )}
            {tattoo.tags && tattoo.tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tattoo.tags.map((tag: any, index: number) => {
                  const name = typeof tag === 'string' ? tag : tag.name;
                  const tagId = typeof tag === 'string' ? undefined : tag.id;
                  const key = typeof tag === 'string' ? `${tag}-${index}` : (tag.id ?? index);
                  return (
                    <TouchableOpacity
                      key={key}
                      style={styles.tag}
                      onPress={() => navigation.navigate('HomeTab', {
                        screen: 'Home',
                        params: tagId
                          ? { filterTags: [tagId] }
                          : { filterTagNames: [name] },
                      })}
                    >
                      <Text style={styles.tagText}>{name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {/* Title and description */}
        {tattoo.title && <Text style={styles.title}>{tattoo.title}</Text>}

        {/* Description - show inline for seeking posts and non-client-uploads */}
        {tattoo.description && (isSeeking || !((tattoo as any).uploader_name && (tattoo as any).uploaded_by_user_id !== tattoo.artist_id)) && (
          <Text style={styles.description}>{tattoo.description}</Text>
        )}

        {/* Details section */}
        {(tattoo.placement || duration) && (
          <View style={styles.detailsSection}>
            <Text style={styles.detailsHeader}>DETAILS</Text>
            {tattoo.placement && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Placement: </Text>
                <Text style={styles.detailValue}>{tattoo.placement}</Text>
              </View>
            )}
            {duration && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Duration: </Text>
                <Text style={styles.detailValue}>
                  {duration} {Number(duration) === 1 ? 'hour' : 'hours'}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Flash details */}
        {(tattoo as any).post_type === 'flash' && (
          <View style={styles.flashSection}>
            <View style={styles.flashHeader}>
              <MaterialIcons name="flash-on" size={20} color={colors.flash} />
              <Text style={styles.flashLabel}>Flash Design</Text>
            </View>
            {((tattoo as any).flash_price || (tattoo as any).flash_size) && (
              <View style={styles.flashDetails}>
                {(tattoo as any).flash_price && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Price: </Text>
                    <Text style={styles.detailValue}>${(tattoo as any).flash_price}</Text>
                  </View>
                )}
                {(tattoo as any).flash_size && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Size: </Text>
                    <Text style={styles.detailValue}>{(tattoo as any).flash_size}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {/* Seeking: offer consultation button for artists */}
        {isSeeking && isArtistUser && !isOwner && uploaderId && (
          <Button
            title="Offer Consultation"
            onPress={async () => {
              try {
                const response = await messageService.createConversation(
                  uploaderId,
                  'consultation' as any,
                  `Hi ${uploaderName || 'there'}, I saw your post "${tattoo.title || 'seeking artist'}" and I'd love to discuss this piece with you!`,
                );
                const data = (response as any)?.data ?? response;
                const conversationId = data?.conversation?.id || data?.id;
                if (conversationId) {
                  navigation.navigate('InboxStack', {
                    screen: 'Conversation',
                    params: { conversationId, participantName: uploaderName },
                  });
                }
                showSnackbar('Consultation offer sent!', 'success');
              } catch {
                showSnackbar('Failed to send offer. Please try again.', 'error');
              }
            }}
            style={styles.bookButton}
          />
        )}

        {/* Seeking: CTA for non-artist users */}
        {isSeeking && !isArtistUser && (
          <View style={styles.seekingCta}>
            <MaterialIcons name="brush" size={20} color={colors.seeking} />
            <Text style={styles.seekingCtaText}>
              Want to bid on this? Sign up as an artist to contact users for work!
            </Text>
          </View>
        )}

        {/* Book button (flash and portfolio) */}
        {!isSeeking && artistId && (tattoo as any).post_type === 'flash' ? (
          <Button
            title={`Request to Book`}
            onPress={() => navigation.navigate('Calendar', {
              artistId: artistId,
              artistName: artistName,
              artistSlug: artistSlug,
              flashTattooId: tattoo.id,
              flashTattooTitle: tattoo.title || 'Flash Design',
            })}
            style={styles.bookButton}
          />
        ) : !isSeeking && artistId ? (
          <Button
            title={`Book with ${artistName}`}
            onPress={() => navigation.navigate('Calendar', {
              artistId: artistId,
              artistName: artistName,
              artistSlug: artistSlug,
            })}
            style={styles.bookButton}
          />
        ) : null}

        {/* Uploaded by (client upload, but NOT seeking posts) */}
        {!isSeeking && (tattoo as any).uploader_name && (tattoo as any).uploaded_by_user_id !== tattoo.artist_id && (
          <View style={styles.uploaderSection}>
            <Text style={styles.uploaderLabel}>Uploaded by</Text>
            <View style={styles.uploaderBox}>
              <TouchableOpacity
                onPress={() => {
                  const slug = (tattoo as any).uploader_slug;
                  if (slug) {
                    navigation.push('UserProfile', { slug, name: (tattoo as any).uploader_name });
                  }
                }}
                activeOpacity={(tattoo as any).uploader_slug ? 0.7 : 1}
              >
                <Text style={styles.uploaderBoxName}>{(tattoo as any).uploader_name}</Text>
              </TouchableOpacity>
              {tattoo.description && (
                <Text style={styles.uploaderComment}>
                  &ldquo;{tattoo.description}&rdquo;
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  image: {
    width: screenWidth,
    height: screenWidth,
    backgroundColor: colors.surfaceElevated,
  },
  // Carousel dots
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: colors.textMuted,
    marginHorizontal: 4,
    opacity: 0.4,
  },
  dotActive: {
    backgroundColor: colors.accent,
    opacity: 1,
  },
  // Artist bar (above image)
  artistBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  artistHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  artistHeaderInfo: {
    marginLeft: 12,
    flex: 1,
  },
  artistName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  studioName: {
    color: colors.accent,
    fontSize: 13,
    marginTop: 1,
  },
  artistLocation: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 1,
  },
  editButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
    marginLeft: 8,
  },
  content: {
    padding: 16,
  },
  // Tags
  tagsSection: {
    marginBottom: 12,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 4,
  },
  tag: {
    backgroundColor: colors.tagDim,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    color: colors.tag,
    fontSize: 13,
  },
  pendingText: {
    color: colors.warning,
    fontSize: 13,
    fontWeight: '600',
  },
  // Title
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 8,
  },
  description: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 12,
  },
  // Details section
  detailsSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    marginTop: 4,
  },
  detailsHeader: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  detailLabel: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  detailValue: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Flash section
  flashSection: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 16,
    marginTop: 4,
  },
  flashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  flashLabel: {
    color: colors.flash,
    fontSize: 15,
    fontWeight: '700',
  },
  flashDetails: {
    marginTop: 4,
  },
  // Book button
  bookButton: {
    marginTop: 16,
  },
  uploaderSection: {
    marginTop: 16,
  },
  uploaderLabel: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 6,
  },
  uploaderBox: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 12,
  },
  uploaderBoxName: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  uploaderComment: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    fontStyle: 'italic',
  },
  attributedAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceElevated,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notOnInkedinBadge: {
    backgroundColor: colors.infoDim,
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  notOnInkedinText: {
    color: colors.info,
    fontSize: 11,
    fontWeight: '600',
  },
  unknownArtistText: {
    color: colors.textMuted,
    fontSize: 15,
    fontStyle: 'italic',
  },
  seekingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  seekingBadgeText: {
    color: colors.seeking,
    fontSize: 13,
    fontWeight: '600',
  },
  seekingCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.seekingDim,
    borderRadius: 10,
    padding: 14,
    marginTop: 16,
  },
  seekingCtaText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
});
