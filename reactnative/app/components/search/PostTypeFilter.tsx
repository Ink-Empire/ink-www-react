import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { colors } from '../../../lib/colors';

type PostType = 'portfolio' | 'flash' | 'seeking';

interface PostTypeFilterProps {
  selected: PostType | undefined;
  onSelect: (type: PostType | undefined) => void;
}

const CHIPS: { label: string; value: PostType | undefined; color: string }[] = [
  { label: 'All', value: undefined, color: colors.accent },
  { label: 'Portfolio', value: 'portfolio', color: colors.textSecondary },
  { label: 'Flash', value: 'flash', color: colors.flash },
  { label: 'Seeking', value: 'seeking', color: colors.seeking },
];

export default function PostTypeFilter({ selected, onSelect }: PostTypeFilterProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {CHIPS.map((chip) => {
        const isActive = selected === chip.value;
        return (
          <TouchableOpacity
            key={chip.label}
            style={[
              styles.chip,
              isActive && { backgroundColor: chip.color, borderColor: chip.color },
            ]}
            onPress={() => onSelect(chip.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.chipText,
                isActive
                  ? { color: colors.textOnLight }
                  : { color: chip.color },
              ]}
            >
              {chip.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
