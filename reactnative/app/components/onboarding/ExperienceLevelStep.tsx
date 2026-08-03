import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors } from '../../../lib/colors';
import Button from '../common/Button';

interface ExperienceLevelStepProps {
  onSelect: (level: 'beginner' | 'experienced') => void;
  onBack: () => void;
}

const levels = [
  {
    value: 'beginner' as const,
    title: 'New to Tattoos',
    description: "I'm just starting my tattoo journey and would love some guidance",
  },
  {
    value: 'experienced' as const,
    title: 'Experienced Collector',
    description: "I already have tattoos and know what I'm looking for",
  },
];

export default function ExperienceLevelStep({ onSelect, onBack }: ExperienceLevelStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Your Tattoo Experience</Text>
      <Text style={styles.subtitle}>
        This helps us personalize your experience and show you the most relevant content.
      </Text>

      {levels.map(({ value, title, description }) => (
        <TouchableOpacity
          key={value}
          style={styles.card}
          onPress={() => onSelect(value)}
          activeOpacity={0.7}
        >
          <Text style={styles.cardTitle}>{title}</Text>
          <Text style={styles.cardDescription}>{description}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.footer}>
        This helps us customize your feed and recommendations
      </Text>

      <Button title="Back" onPress={onBack} variant="secondary" style={styles.backButton} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 28,
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
    fontSize: 17,
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
    marginTop: 4,
  },
  backButton: {
    marginTop: 16,
  },
});
