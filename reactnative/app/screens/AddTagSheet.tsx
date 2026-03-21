import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors } from '../../lib/colors';
import { clientInsightsService } from '../../lib/services';
import type { UserTagCategory } from '@inkedin/shared/types';

const CATEGORY_COLORS: Record<string, string> = {
  teal: colors.tagLikes,
  coral: colors.tagAvoid,
  purple: colors.tagPersonality,
  amber: colors.tagNotes,
};

const EXAMPLE_TAGS: Record<string, string[]> = {
  'Style preferences': ['fine line', 'blackwork', 'botanical', 'realism', 'no colour fills'],
  'Avoid': ['bold outlines', 'colour fills', 'wrist placement', 'large scale'],
  'Personality': ['chatty', 'nervous', 'needs breaks', 'music off', 'bring a friend'],
  'Pain notes': ['high tolerance', 'sensitive ribs', 'hates outlining'],
};

interface AddTagSheetProps {
  clientId: number;
  visible: boolean;
  onClose: () => void;
  onTagAdded: () => void;
}

export default function AddTagSheet({ clientId, visible, onClose, onTagAdded }: AddTagSheetProps) {
  const [categories, setCategories] = useState<UserTagCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<UserTagCategory | null>(null);
  const [tagText, setTagText] = useState('');
  const [apiSuggestions, setApiSuggestions] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setLoading(true);
      clientInsightsService.getTagCategories()
        .then(res => setCategories(res.categories))
        .catch(() => {})
        .finally(() => setLoading(false));
      setSelectedCategory(null);
      setTagText('');
      setApiSuggestions(null);
    }
  }, [visible]);

  const fetchSuggestions = useCallback((categoryId: number, q: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.length < 1) {
      setApiSuggestions(null);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await clientInsightsService.getTagSuggestions(clientId, categoryId, q);
        setApiSuggestions(res as unknown as string[]);
      } catch {
        setApiSuggestions([]);
      }
    }, 300);
  }, [clientId]);

  const handleTagTextChange = (text: string) => {
    setTagText(text);
    if (selectedCategory) {
      fetchSuggestions(selectedCategory.id, text);
    }
  };

  const handleSelectSuggestion = (label: string) => {
    setTagText(label);
    setApiSuggestions(null);
  };

  const handleAddTag = async () => {
    if (!selectedCategory || !tagText.trim() || adding) return;
    setAdding(true);
    try {
      await clientInsightsService.addTag(clientId, selectedCategory.id, tagText.trim());
      onTagAdded();
      onClose();
    } catch {
      // silently fail
    } finally {
      setAdding(false);
    }
  };

  // Derive visible suggestions and label
  const catColor = selectedCategory
    ? CATEGORY_COLORS[selectedCategory.color] || CATEGORY_COLORS.teal
    : CATEGORY_COLORS.teal;
  const examples = selectedCategory ? (EXAMPLE_TAGS[selectedCategory.name] || []) : [];
  const inputTrimmed = tagText.trim().toLowerCase();

  let visibleSuggestions: string[] = [];
  let suggestionsLabel = '';

  if (selectedCategory) {
    if (!inputTrimmed) {
      visibleSuggestions = examples;
      suggestionsLabel = 'Try these to get started';
    } else if (apiSuggestions !== null && apiSuggestions.length > 0) {
      visibleSuggestions = apiSuggestions;
      suggestionsLabel = 'From your other clients';
    } else {
      const filtered = examples.filter(e => e.toLowerCase().includes(inputTrimmed));
      visibleSuggestions = filtered;
      suggestionsLabel = filtered.length > 0 ? 'Try these to get started' : '';
    }
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={s.overlay}>
          <TouchableWithoutFeedback>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={s.keyboardAvoid}
            >
              <View style={s.sheet}>
                {/* Drag Handle */}
                <View style={s.dragHandleContainer}>
                  <View style={s.dragHandle} />
                </View>

                {/* Title */}
                <Text style={s.title}>Add tag</Text>
                <Text style={s.subtitle}>
                  e.g. &quot;fine line&quot;, &quot;nervous first visit&quot;, &quot;sensitive ribs&quot;
                </Text>

                <ScrollView
                  style={s.scrollContent}
                  contentContainerStyle={s.scrollInner}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Tag Input */}
                  <TextInput
                    style={[
                      s.input,
                      selectedCategory && { borderColor: `${catColor}40` },
                    ]}
                    placeholder={
                      selectedCategory
                        ? 'Type a tag...'
                        : 'Select a category below, then type a tag...'
                    }
                    placeholderTextColor={colors.textMuted}
                    value={tagText}
                    onChangeText={handleTagTextChange}
                  />

                  {/* Suggestions */}
                  {visibleSuggestions.length > 0 && suggestionsLabel !== '' && (
                    <View style={s.suggestionsSection}>
                      <Text style={s.suggestionsLabel}>{suggestionsLabel}</Text>
                      <View style={s.suggestionsRow}>
                        {visibleSuggestions.map(label => (
                          <TouchableOpacity
                            key={label}
                            style={[s.suggestionPill, { borderColor: `${catColor}40` }]}
                            onPress={() => handleSelectSuggestion(label)}
                          >
                            <Text style={[s.suggestionText, { color: `${catColor}cc` }]}>{label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Category List */}
                  <Text style={s.sectionLabel}>Category</Text>
                  {loading ? (
                    <ActivityIndicator size="small" color={colors.accent} style={{ marginVertical: 16 }} />
                  ) : (
                    <>
                      {categories.map(cat => {
                        const isSelected = selectedCategory?.id === cat.id;
                        const dotColor = CATEGORY_COLORS[cat.color] || CATEGORY_COLORS.teal;
                        return (
                          <TouchableOpacity
                            key={cat.id}
                            style={[s.categoryRow, isSelected && s.categoryRowSelected]}
                            onPress={() => {
                              setSelectedCategory(cat);
                              setApiSuggestions(null);
                            }}
                          >
                            <View style={[s.categoryDot, { backgroundColor: dotColor }]} />
                            <Text style={[s.categoryName, isSelected && s.categoryNameSelected]}>
                              {cat.name}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </>
                  )}
                </ScrollView>

                {/* Add Tag Button */}
                <View style={s.footer}>
                  <TouchableOpacity
                    style={[s.addBtn, (!selectedCategory || !tagText.trim() || adding) && s.addBtnDisabled]}
                    onPress={handleAddTag}
                    disabled={!selectedCategory || !tagText.trim() || adding}
                  >
                    <Text style={s.addBtnText}>{adding ? 'Adding...' : 'Add tag'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>

    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  keyboardAvoid: {
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#161616',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  dragHandleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  dragHandle: {
    width: 36,
    height: 3,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '500',
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontStyle: 'italic',
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  scrollInner: {
    paddingBottom: 80,
  },

  // Input
  input: {
    backgroundColor: colors.background,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 12,
  },

  // Suggestions
  suggestionsSection: {
    marginBottom: 14,
  },
  suggestionsLabel: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 0.4,
    marginBottom: 8,
  },
  suggestionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  suggestionPill: {
    backgroundColor: '#1a1814',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 0.5,
  },
  suggestionText: {
    fontSize: 11,
  },

  // Category list
  sectionLabel: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  categoryRowSelected: {
    borderColor: 'rgba(201, 169, 98, 0.37)',
  },
  categoryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  categoryName: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  categoryNameSelected: {
    color: colors.accent,
  },
  // Footer
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    paddingBottom: 34,
  },
  addBtn: {
    backgroundColor: colors.accent,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    color: colors.textOnLight,
    fontSize: 14,
    fontWeight: '600',
  },
});
