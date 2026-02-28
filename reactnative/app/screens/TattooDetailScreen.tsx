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
import { tattooService } from '../../lib/services';
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
        if (uri) imgs.push({ uri });
      });
    }
    if (imgs.length === 0) {
      const primaryUri = tattoo.primary_image?.uri;
      if (primaryUri) imgs.push({ uri: primaryUri });
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

  const artist = tattoo.artist;
  const artistName = artist?.name || (tattoo as any).artist_name;
  const artistSlug = artist?.slug || (tattoo as any).artist_slug;
  const artistImageUri = artist?.primary_image?.uri || artist?.image?.uri || (tattoo as any).artist_image_uri;
  const studio = tattoo.studio || artist?.studio;
  const studioName = studio?.name || (tattoo as any).studio_name;
  const studioSlug = studio?.slug;
  const location = studio?.location || (tattoo as any).artist_location;
  const duration = (tattoo as any).duration;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Artist header + save — above image */}
      <View style={styles.artistBar}>
        {artistName ? (
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
          <View style={styles.artistHeader} />
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
                    onPress={() => navigation.navigate('Home', { filterStyles: [style.id] })}
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
                      onPress={() => tagId
                        ? navigation.navigate('Home', { filterTags: [tagId] })
                        : navigation.navigate('Home', { filterTagNames: [name] })
                      }
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

        {tattoo.description && (
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

        {/* Book button */}
        {artist && (
          <Button
            title={`Book with ${artistName}`}
            onPress={() => navigation.navigate('Calendar', {
              artistId: artist.id,
              artistName: artistName,
              artistSlug: artistSlug,
            })}
            style={styles.bookButton}
          />
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
  // Book button
  bookButton: {
    marginTop: 16,
  },
});
