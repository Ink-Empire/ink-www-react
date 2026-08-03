import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../../lib/colors';
import Button from './Button';

interface ErrorViewProps {
  message?: string;
  onRetry?: () => void;
}

export default function ErrorView({
  message = 'Something went wrong.',
  onRetry,
}: ErrorViewProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>{message}</Text>
      {onRetry && (
        <Button title="Try Again" onPress={onRetry} variant="outline" style={styles.button} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  message: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  button: {
    minWidth: 140,
  },
});
