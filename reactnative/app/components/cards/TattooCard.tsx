import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, Dimensions, Animated, View } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import { tattooCardUrl } from '@inkedin/shared/utils/imgix';

interface TattooCardProps {
  tattoo: {
    id: number;
    title?: string;
    primary_image?: { uri: string; edit_params?: any } | null;
    images?: { uri: string; edit_params?: any }[];
    post_type?: 'portfolio' | 'flash' | 'seeking';
    flash_price?: number;
    flash_size?: string;
  };
  onPress: () => void;
  size?: 'small' | 'medium';
}

const screenWidth = Dimensions.get('window').width;

function ShimmerPlaceholder({ width, height }: { width: number; height: number }) {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const translateX = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View style={[styles.shimmerContainer, { width, height }]}>
      <Animated.View
        style={[
          styles.shimmerWave,
          { transform: [{ translateX }] },
        ]}
      />
    </View>
  );
}

function PostTypeStrip({ postType, flashPrice, flashSize }: {
  postType: string;
  flashPrice?: number;
  flashSize?: string;
}) {
  if (postType === 'flash') {
    const priceText = flashPrice ? `$${flashPrice}` : '';
    const sizeText = flashSize || '';
    const label = [priceText, sizeText].filter(Boolean).join(' \u00B7 ') || 'Flash';

    return (
      <View style={[styles.strip, { backgroundColor: 'rgba(201, 169, 98, 0.85)' }]}>
        <MaterialIcons name="flash-on" size={18} color={colors.textOnLight} />
        <Text style={styles.stripText} numberOfLines={1}>{label}</Text>
      </View>
    );
  }

  if (postType === 'seeking') {
    return (
      <View style={[styles.strip, { backgroundColor: 'rgba(74, 187, 168, 0.85)' }]}>
        <MaterialIcons name="search" size={18} color={colors.textOnLight} />
        <Text style={styles.stripText} numberOfLines={1}>Seeking Artist</Text>
      </View>
    );
  }

  return null;
}

export default function TattooCard({ tattoo, onPress, size = 'medium' }: TattooCardProps) {
  const rawUri = tattoo.primary_image?.uri || tattoo.images?.[0]?.uri;
  const editParams = tattoo.primary_image?.edit_params || tattoo.images?.[0]?.edit_params;
  const imageUri = rawUri ? tattooCardUrl(rawUri, editParams) : undefined;
  const cardSize = size === 'small' ? (screenWidth - 48) / 3 : (screenWidth - 36) / 2;
  const [loaded, setLoaded] = useState(false);
  const postType = tattoo.post_type || 'portfolio';

  return (
    <TouchableOpacity style={[styles.card, { width: cardSize, height: cardSize }]} onPress={onPress} activeOpacity={0.8}>
      {imageUri ? (
        <>
          {!loaded && <ShimmerPlaceholder width={cardSize} height={cardSize} />}
          <Image
            source={{ uri: imageUri }}
            style={[styles.image, !loaded && styles.hidden]}
            onLoad={() => setLoaded(true)}
          />
        </>
      ) : (
        <Text style={styles.placeholder}>No Image</Text>
      )}
      {postType !== 'portfolio' && (
        <PostTypeStrip
          postType={postType}
          flashPrice={tattoo.flash_price}
          flashSize={tattoo.flash_size}
        />
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceElevated,
    margin: 4,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  hidden: {
    position: 'absolute',
    opacity: 0,
  },
  placeholder: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: colors.textMuted,
    fontSize: 12,
  },
  shimmerContainer: {
    backgroundColor: colors.surfaceElevated,
    overflow: 'hidden',
  },
  shimmerWave: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '40%',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  strip: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 26,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 4,
  },
  stripText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textOnLight,
    flex: 1,
  },
});
