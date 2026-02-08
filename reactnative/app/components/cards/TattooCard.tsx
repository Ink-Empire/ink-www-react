import React from 'react';
import { TouchableOpacity, Image, Text, StyleSheet, Dimensions } from 'react-native';
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

export default function TattooCard({ tattoo, onPress, size = 'medium' }: TattooCardProps) {
  const imageUri = tattoo.primary_image?.uri || tattoo.images?.[0]?.uri;
  const cardSize = size === 'small' ? (screenWidth - 48) / 3 : (screenWidth - 36) / 2;

  return (
    <TouchableOpacity style={[styles.card, { width: cardSize, height: cardSize }]} onPress={onPress} activeOpacity={0.8}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
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
  placeholder: {
    flex: 1,
    textAlign: 'center',
    textAlignVertical: 'center',
    color: colors.textMuted,
    fontSize: 12,
  },
});
