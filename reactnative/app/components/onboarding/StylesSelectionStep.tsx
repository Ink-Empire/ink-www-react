import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { colors } from '../../../lib/colors';
import { useStyles } from '@inkedin/shared/hooks';
import { api } from '../../../lib/api';
import StyleTag from '../common/StyleTag';
import Button from '../common/Button';

interface StylesSelectionStepProps {
  onComplete: (styleIds: number[]) => void;
  onBack: () => void;
  userType: 'client' | 'artist';
  initialSelection?: number[];
}

export default function StylesSelectionStep({
  onComplete,
  onBack,
  userType,
  initialSelection = [],
}: StylesSelectionStepProps) {
  const { styles: stylesData, loading } = useStyles(api);
  const styles_list = Array.isArray(stylesData) ? stylesData : [];
  const [selectedStyles, setSelectedStyles] = useState<number[]>(initialSelection);

  const toggleStyle = (id: number) => {
    setSelectedStyles(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id],
    );
  };

  const title = userType === 'client'
    ? 'What styles interest you?'
    : 'What are your specialties?';

  const subtitle = userType === 'client'
    ? "Choose the tattoo styles you love or are curious about. We'll use this to show you relevant artists and inspiration. Don't know yet? That's okay, you can always fill this out later!"
    : 'Select the tattoo styles you create or want to be known for. This helps clients find you when searching for specific styles.';

  return (
    <View style={componentStyles.container}>
      <Text style={componentStyles.title}>{title}</Text>
      <Text style={componentStyles.subtitle}>{subtitle}</Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" style={componentStyles.loader} />
      ) : (
        <>
          {selectedStyles.length > 0 && (
            <Text style={componentStyles.countText}>
              {selectedStyles.length} style{selectedStyles.length !== 1 ? 's' : ''} selected
            </Text>
          )}
          <ScrollView style={componentStyles.scrollArea} contentContainerStyle={componentStyles.tagsContainer}>
            {styles_list.map((style: any) => (
              <StyleTag
                key={style.id}
                label={style.name}
                selected={selectedStyles.includes(style.id)}
                onPress={() => toggleStyle(style.id)}
              />
            ))}
          </ScrollView>
        </>
      )}

      <View style={componentStyles.buttons}>
        <Button title="Back" onPress={onBack} variant="secondary" style={componentStyles.buttonHalf} />
        <View style={componentStyles.buttonHalf}>
          {selectedStyles.length === 0 ? (
            <Button
              title="Skip for now"
              onPress={() => onComplete([])}
              variant="outline"
            />
          ) : (
            <Button
              title="Continue"
              onPress={() => onComplete(selectedStyles)}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const componentStyles = StyleSheet.create({
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
    marginBottom: 24,
  },
  countText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 12,
  },
  loader: {
    marginTop: 40,
  },
  scrollArea: {
    flex: 1,
    maxHeight: 300,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  buttonHalf: {
    flex: 1,
  },
});
