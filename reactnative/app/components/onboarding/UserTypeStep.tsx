import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../lib/colors';

interface UserTypeStepProps {
  onSelect: (type: 'client' | 'artist' | 'studio') => void;
}

const userTypes = [
  {
    type: 'client' as const,
    title: 'Tattoo Enthusiast',
    description: "I'm looking for inspiration, artists, and planning my next tattoo",
  },
  {
    type: 'artist' as const,
    title: 'Tattoo Artist',
    description: 'I create tattoos and want to showcase my work',
  },
  {
    type: 'studio' as const,
    title: 'Tattoo Studio',
    description: 'I represent a studio and manage multiple artists',
  },
];

export default function UserTypeStep({ onSelect }: UserTypeStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to InkedIn</Text>
      <Text style={styles.subtitle}>
        Let's get you set up! Tell us what brings you to our community.
      </Text>

      {userTypes.map(({ type, title, description }) => (
        <TouchableOpacity
          key={type}
          style={styles.card}
          onPress={() => onSelect(type)}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.footer}>
        Don't worry, you can always change this later in your profile settings.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  cardDescription: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
  },
});
