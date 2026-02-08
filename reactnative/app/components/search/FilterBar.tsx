import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import StyleTag from '../common/StyleTag';

interface FilterBarProps {
  styles: { id: number; name: string }[];
  selectedIds: number[];
  onToggle: (id: number) => void;
}

export default function FilterBar({ styles: stylesList, selectedIds, onToggle }: FilterBarProps) {
  if (stylesList.length === 0) return null;

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={componentStyles.container}
      contentContainerStyle={componentStyles.content}
    >
      {stylesList.map(style => (
        <StyleTag
          key={style.id}
          label={style.name}
          selected={selectedIds.includes(style.id)}
          onPress={() => onToggle(style.id)}
        />
      ))}
    </ScrollView>
  );
}

const componentStyles = StyleSheet.create({
  container: {
    marginBottom: 12,
    maxHeight: 44,
  },
  content: {
    paddingHorizontal: 4,
  },
});
