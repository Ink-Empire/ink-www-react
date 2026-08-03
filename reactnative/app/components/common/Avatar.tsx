import React from 'react';
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '../../../lib/colors';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

function getInitials(name?: string): string {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function Avatar({ uri, name, size = 48 }: AvatarProps) {
  const borderRadius = size / 2;

  if (uri) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, { width: size, height: size, borderRadius }]}
      />
    );
  }

  return (
    <View style={[styles.fallback, { width: size, height: size, borderRadius }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
        {getInitials(name)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: colors.surfaceElevated,
  },
  fallback: {
    backgroundColor: colors.accentDim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.accent,
    fontWeight: '600',
  },
});
