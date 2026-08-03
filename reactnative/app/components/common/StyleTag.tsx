import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../../lib/colors';

interface StyleTagProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export default function StyleTag({ label, selected = false, onPress, disabled }: StyleTagProps) {
  return (
    <TouchableOpacity
      style={[styles.tag, selected && styles.tagSelected]}
      onPress={onPress}
      disabled={disabled || !onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, selected && styles.textSelected]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
    marginRight: 8,
    marginBottom: 8,
  },
  tagSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  text: {
    color: colors.accent,
    fontSize: 14,
  },
  textSelected: {
    color: colors.background,
  },
});
