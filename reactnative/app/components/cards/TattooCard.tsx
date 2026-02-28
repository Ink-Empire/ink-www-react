import React, { useState, useEffect, useRef } from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, Dimensions, Animated, View } from 'react-native';
import { colors } from '../../../lib/colors';

interface TattooCardProps {
  tattoo: {
    id: number;
    title?: string;
    primary_image?: { uri: string } | null;
    images?: { uri: string }[];
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

export default function TattooCard({ tattoo, onPress, size = 'medium' }: TattooCardProps) {
  const imageUri = tattoo.primary_image?.uri || tattoo.images?.[0]?.uri;
  const cardSize = size === 'small' ? (screenWidth - 48) / 3 : (screenWidth - 36) / 2;
  const [loaded, setLoaded] = useState(false);

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
});
