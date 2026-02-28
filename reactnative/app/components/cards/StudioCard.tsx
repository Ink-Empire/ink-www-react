import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';

interface StudioCardProps {
  studio: {
    id: number;
    name: string;
    slug?: string;
    location?: string;
    image?: { uri: string } | null;
  };
  onPress: () => void;
}

export default function StudioCard({ studio, onPress }: StudioCardProps) {
  const imageUri = studio.image?.uri;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      {imageUri ? (
        <Image source={{ uri: imageUri }} style={styles.image} />
      ) : (
        <View style={[styles.image, styles.placeholder]}>
          <MaterialIcons name="store" size={36} color={colors.textMuted} />
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{studio.name}</Text>
        {studio.location && (
          <Text style={styles.location} numberOfLines={1}>{studio.location}</Text>
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
    height: 100,
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
  location: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
