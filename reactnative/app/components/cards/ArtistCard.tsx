import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import StyleTag from '../common/StyleTag';

interface ArtistCardProps {
  artist: {
    id: number;
    name: string;
    slug?: string;
    location?: string;
    image?: { uri: string } | string | null;
    primary_image?: { uri: string } | null;
    styles?: { id: number; name: string }[];
    studio?: { name: string } | null;
  };
  onPress: () => void;
}

export default function ArtistCard({ artist, onPress }: ArtistCardProps) {
  const imageUri =
    (typeof artist.image === 'object' ? artist.image?.uri : artist.image) ||
    artist.primary_image?.uri;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <MaterialIcons name="person" size={36} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{artist.name}</Text>
        {artist.studio?.name && (
          <Text style={styles.studio} numberOfLines={1}>{artist.studio.name}</Text>
        )}
        {artist.location && (
          <Text style={styles.location} numberOfLines={1}>{artist.location}</Text>
        )}
        {artist.styles && artist.styles.length > 0 && (
          <View style={styles.tags}>
            {artist.styles.slice(0, 3).map(style => (
              <StyleTag key={style.id} label={style.name} />
            ))}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    marginBottom: 12,
  },
  image: {
    width: 100,
    height: 120,
    backgroundColor: colors.surfaceElevated,
  },
  placeholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  name: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  studio: {
    color: colors.accent,
    fontSize: 13,
    marginBottom: 2,
  },
  location: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 6,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
});
