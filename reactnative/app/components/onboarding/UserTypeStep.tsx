import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../lib/colors';

interface UserTypeStepProps {
  onSelect: (type: 'client' | 'artist' | 'studio') => void;
}

const userTypes = [
  {
    type: 'client' as const,
    title: 'I Want Tattoos',
    description: 'Browse artists, discover styles, and book appointments',
  },
  {
    type: 'artist' as const,
    title: "I'm an Artist",
    description: 'Showcase your portfolio, manage bookings, and grow your client base',
  },
  {
    type: 'studio' as const,
    title: 'I Manage a Studio',
    description: 'List your studio, manage artists, and attract clients',
  },
];

export default function UserTypeStep({ onSelect }: UserTypeStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to InkedIn</Text>
      <Text style={styles.subtitle}>How will you use InkedIn?</Text>

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
});
