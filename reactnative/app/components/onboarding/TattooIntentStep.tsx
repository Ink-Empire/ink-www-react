import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import { api } from '../../../lib/api';
import Button from '../common/Button';

interface TagResult {
  id: number;
  name: string;
}

type ThemeItem =
  | { type: 'tag'; id: number; name: string }
  | { type: 'custom'; name: string };

export interface TattooIntentData {
  timing: string;
  tagIds: number[];
  customThemes: string[];
  description: string;
  allowArtistContact: boolean;
}

interface TattooIntentStepProps {
  onComplete: (data: TattooIntentData) => void;
  onBack: () => void;
}

const timingOptions = [
  { value: 'week', label: 'Next week', icon: 'event' as const },
  { value: 'month', label: 'Next month', icon: 'date-range' as const },
  { value: 'year', label: 'Next year', icon: 'calendar-today' as const },
  { value: null, label: 'Not right now', icon: 'schedule' as const },
] as const;

export default function TattooIntentStep({ onComplete, onBack }: TattooIntentStepProps) {
  const [timing, setTiming] = useState<string | null | undefined>(undefined);
  const [tagSearch, setTagSearch] = useState('');
  const [tagResults, setTagResults] = useState<TagResult[]>([]);
  const [selectedThemes, setSelectedThemes] = useState<ThemeItem[]>([]);
  const [description, setDescription] = useState('');
  const [allowArtistContact, setAllowArtistContact] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchTags = useCallback((query: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.length < 2) {
      setTagResults([]);
      setSearchLoading(false);
      return;
    }

    setSearchLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await api.get<any>(`/tags/search?q=${encodeURIComponent(query)}&limit=10`);
        const tags: TagResult[] = response?.tags || response?.data?.tags || response?.data || response || [];
        const filtered = Array.isArray(tags)
          ? tags.filter(t => !selectedThemes.some(s => s.type === 'tag' && s.id === t.id))
          : [];
        setTagResults(filtered);
      } catch {
        setTagResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
  }, [selectedThemes]);

  const addApiTag = (tag: TagResult) => {
    setSelectedThemes(prev => [...prev, { type: 'tag', id: tag.id, name: tag.name }]);
    setTagResults(prev => prev.filter(t => t.id !== tag.id));
    setTagSearch('');
  };

  const addCustomTheme = () => {
    const trimmed = tagSearch.trim();
    if (!trimmed) return;

    const alreadyExists = selectedThemes.some(
      t => t.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (alreadyExists) {
      setTagSearch('');
      return;
    }

    setSelectedThemes(prev => [...prev, { type: 'custom', name: trimmed }]);
    setTagSearch('');
    setTagResults([]);
  };

  const removeTheme = (theme: ThemeItem) => {
    if (theme.type === 'tag') {
      setSelectedThemes(prev => prev.filter(t => !(t.type === 'tag' && t.id === theme.id)));
    } else {
      setSelectedThemes(prev => prev.filter(t => !(t.type === 'custom' && t.name === theme.name)));
    }
  };

  const handleContinue = () => {
    const tagIds: number[] = [];
    const customThemes: string[] = [];

    selectedThemes.forEach(theme => {
      if (theme.type === 'tag') {
        tagIds.push(theme.id);
      } else {
        customThemes.push(theme.name);
      }
    });

    onComplete({
      timing: timing || '',
      tagIds,
      customThemes,
      description: description.trim(),
      allowArtistContact,
    });
  };

  const themeKey = (theme: ThemeItem) =>
    theme.type === 'tag' ? `tag-${theme.id}` : `custom-${theme.name}`;

  return (
    <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Your Tattoo Plans</Text>
      <Text style={styles.subtitle}>Help us connect you with the right artists.</Text>

      <Text style={styles.sectionLabel}>When are you looking to get your next tattoo?</Text>
      <View style={styles.timingGrid}>
        {timingOptions.map((option) => (
          <TouchableOpacity
            key={option.value ?? 'none'}
            style={[styles.timingCard, timing === option.value && timing !== undefined && styles.timingCardSelected]}
            onPress={() => setTiming(option.value)}
            activeOpacity={0.7}
          >
            <MaterialIcons
              name={option.icon}
              size={24}
              color={timing === option.value && timing !== undefined ? colors.background : colors.accent}
            />
            <Text style={[styles.timingLabel, timing === option.value && timing !== undefined && styles.timingLabelSelected]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {timing !== undefined && timing !== null && (
        <View style={styles.followUp}>
          <Text style={styles.sectionLabel}>What themes or styles interest you?</Text>
          <Text style={styles.hint}>
            Search for themes or type your own and tap Add.
          </Text>

          <View style={styles.inputRow}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.tagInput}
                value={tagSearch}
                onChangeText={(text) => {
                  setTagSearch(text);
                  searchTags(text);
                }}
                onSubmitEditing={addCustomTheme}
                returnKeyType="done"
                placeholder="e.g., floral, geometric, memorial..."
                placeholderTextColor={colors.textMuted}
              />
              {searchLoading && (
                <ActivityIndicator size="small" color={colors.accent} style={styles.searchSpinner} />
              )}
            </View>
            {tagSearch.trim().length > 0 && (
              <TouchableOpacity style={styles.addButton} onPress={addCustomTheme}>
                <Text style={styles.addButtonText}>Add</Text>
              </TouchableOpacity>
            )}
          </View>

          {tagResults.length > 0 && (
            <View style={styles.tagSuggestions}>
              {tagResults.map((tag) => (
                <TouchableOpacity
                  key={tag.id}
                  style={styles.tagSuggestion}
                  onPress={() => addApiTag(tag)}
                >
                  <Text style={styles.tagSuggestionText}>{tag.name}</Text>
                  <MaterialIcons name="add" size={16} color={colors.accent} />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {selectedThemes.length > 0 && (
            <View style={styles.selectedThemes}>
              {selectedThemes.map((theme) => (
                <TouchableOpacity
                  key={themeKey(theme)}
                  style={[
                    styles.chip,
                    theme.type === 'tag' ? styles.chipTag : styles.chipCustom,
                  ]}
                  onPress={() => removeTheme(theme)}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.chipText,
                      theme.type === 'tag' ? styles.chipTextTag : styles.chipTextCustom,
                    ]}
                  >
                    {theme.name}
                  </Text>
                  <MaterialIcons
                    name="close"
                    size={14}
                    color={theme.type === 'tag' ? colors.accent : colors.textSecondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          )}

          <Text style={styles.sectionLabel}>Describe what you have in mind (optional)</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Tell us about your dream tattoo..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />

          <View style={styles.switchRow}>
            <View style={styles.switchTextContainer}>
              <Text style={styles.switchLabel}>Allow artists in my area to contact me</Text>
              <Text style={styles.switchDescription}>
                Artists who match your interests may reach out with portfolio examples
              </Text>
            </View>
            <Switch
              value={allowArtistContact}
              onValueChange={setAllowArtistContact}
              trackColor={{ false: colors.border, true: colors.accent }}
              thumbColor={colors.textPrimary}
            />
          </View>
        </View>
      )}

      <View style={styles.buttons}>
        <Button title="Back" onPress={onBack} variant="secondary" style={styles.buttonHalf} />
        <Button
          title="Continue"
          onPress={handleContinue}
          disabled={timing === undefined}
          style={styles.buttonHalf}
        />
      </View>
    </ScrollView>
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
    marginBottom: 24,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  hint: {
    color: colors.textMuted,
    fontSize: 13,
    marginBottom: 8,
  },
  timingGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  timingCard: {
    width: '47%',
    backgroundColor: colors.surfaceElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  timingCardSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  timingLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  timingLabelSelected: {
    color: colors.background,
  },
  followUp: {
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  inputWrapper: {
    flex: 1,
    position: 'relative',
  },
  tagInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  searchSpinner: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  addButton: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.textOnLight,
    fontSize: 15,
    fontWeight: '600',
  },
  tagSuggestions: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginBottom: 12,
  },
  tagSuggestion: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  tagSuggestionText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  selectedThemes: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  chipTag: {
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  chipCustom: {
    backgroundColor: 'rgba(163, 162, 153, 0.15)',
    borderWidth: 1,
    borderColor: colors.textSecondary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  chipTextTag: {
    color: colors.accent,
  },
  chipTextCustom: {
    color: colors.textSecondary,
  },
  descriptionInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  switchTextContainer: {
    flex: 1,
    marginRight: 12,
  },
  switchLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  switchDescription: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 2,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
    marginBottom: 32,
  },
  buttonHalf: {
    flex: 1,
  },
});
