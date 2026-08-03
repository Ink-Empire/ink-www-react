import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../lib/colors';
import Button from './Button';

interface EmptyStateProps {
  message: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ message, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button title={actionLabel} onPress={onAction} variant="outline" style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    minWidth: 140,
  },
});
