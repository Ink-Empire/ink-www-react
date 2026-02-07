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
  const { data: stylesData, loading } = useStyles(api);
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
    ? 'Select the tattoo styles you love'
    : 'Select the styles you specialize in';

  return (
    <View style={componentStyles.container}>
      <Text style={componentStyles.title}>{title}</Text>
      <Text style={componentStyles.subtitle}>{subtitle}</Text>

      {loading ? (
        <ActivityIndicator color={colors.accent} size="large" style={componentStyles.loader} />
      ) : (
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
      )}

      <View style={componentStyles.buttons}>
        <Button title="Back" onPress={onBack} variant="secondary" style={componentStyles.buttonHalf} />
        <Button
          title="Continue"
          onPress={() => onComplete(selectedStyles)}
          disabled={selectedStyles.length === 0}
          style={componentStyles.buttonHalf}
        />
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
