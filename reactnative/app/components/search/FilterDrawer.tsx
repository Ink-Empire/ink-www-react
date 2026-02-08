import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import Slider from '@react-native-community/slider';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';

interface FilterDrawerProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: AppliedFilters) => void;
  styles: { id: number; name: string }[];
  tags: { id: number; name: string }[];
  currentFilters: AppliedFilters;
}

export interface AppliedFilters {
  sort?: string;
  styles?: number[];
  tags?: number[];
  distance?: number;
  distanceUnit?: 'mi' | 'km';
  useAnyLocation?: boolean;
}

export default function FilterDrawer({
  visible,
  onClose,
  onApply,
  styles: stylesList,
  tags: tagsList,
  currentFilters,
}: FilterDrawerProps) {
  const [selectedStyles, setSelectedStyles] = useState<number[]>(currentFilters.styles || []);
  const [selectedTags, setSelectedTags] = useState<number[]>(currentFilters.tags || []);
  const [distance, setDistance] = useState(currentFilters.distance || 50);
  const [distanceUnit, setDistanceUnit] = useState<'mi' | 'km'>(currentFilters.distanceUnit || 'mi');
  const [useAnyLocation, setUseAnyLocation] = useState(currentFilters.useAnyLocation !== false);
  const [styleSearch, setStyleSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  // Collapsible section state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    distance: false,
    styles: true,
    tags: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const filteredStyles = styleSearch
    ? stylesList.filter(s => s.name.toLowerCase().includes(styleSearch.toLowerCase()))
    : stylesList;

  const filteredTags = tagSearch
    ? tagsList.filter(t => t.name.toLowerCase().includes(tagSearch.toLowerCase()))
    : tagsList.slice(0, 30);

  const toggleStyle = (id: number) => {
    setSelectedStyles(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id],
    );
  };

  const toggleTag = (id: number) => {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id],
    );
  };

  const handleApply = () => {
    onApply({
      styles: selectedStyles.length > 0 ? selectedStyles : undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined,
      distance: !useAnyLocation ? distance : undefined,
      distanceUnit: !useAnyLocation ? distanceUnit : undefined,
      useAnyLocation,
    });
    onClose();
  };

  const handleClearAll = () => {
    setSelectedStyles([]);
    setSelectedTags([]);
    setDistance(50);
    setDistanceUnit('mi');
    setUseAnyLocation(true);
    setStyleSearch('');
    setTagSearch('');
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={s.container}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Filters</Text>
          <TouchableOpacity onPress={handleClearAll}>
            <Text style={s.clearAll}>Clear all</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={s.body} showsVerticalScrollIndicator={false}>

          {/* Quick jumps */}
          <View style={s.quickJumps}>
            <TouchableOpacity
              style={s.quickJumpChip}
              onPress={() => {
                setExpandedSections(prev => ({ ...prev, styles: true }));
              }}
            >
              <Text style={s.quickJumpText}><MaterialIcons name="palette" size={14} color={colors.textSecondary} /> Search by style</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={s.quickJumpChip}
              onPress={() => {
                setExpandedSections(prev => ({ ...prev, tags: true }));
              }}
            >
              <Text style={s.quickJumpText}><MaterialIcons name="label" size={14} color={colors.textSecondary} /> Search by subject</Text>
            </TouchableOpacity>
          </View>

          {/* Location */}
          <SectionHeader
            title="LOCATION"
            expanded={!useAnyLocation}
            onToggle={() => setUseAnyLocation(!useAnyLocation)}
          />
          {!useAnyLocation && (
            <View style={s.sectionContent}>
              <View style={s.locationOptions}>
                <TouchableOpacity
                  style={[s.locationChip, !useAnyLocation && s.locationChipActive]}
                  onPress={() => setUseAnyLocation(false)}
                >
                  <Text style={[s.locationChipText, !useAnyLocation && s.locationChipTextActive]}>
                    Near me
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.locationChip, useAnyLocation && s.locationChipActive]}
                  onPress={() => setUseAnyLocation(true)}
                >
                  <Text style={[s.locationChipText, useAnyLocation && s.locationChipTextActive]}>
                    Anywhere
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Distance */}
          <SectionHeader
            title="DISTANCE"
            expanded={expandedSections.distance}
            onToggle={() => toggleSection('distance')}
          />
          {expandedSections.distance && (
            <View style={s.sectionContent}>
              <View style={s.distanceHeader}>
                <Text style={s.distanceLabel}>Within</Text>
                <Text style={s.distanceValue}>{distance} {distanceUnit}</Text>
              </View>
              <Slider
                style={s.slider}
                minimumValue={5}
                maximumValue={200}
                step={5}
                value={distance}
                onValueChange={setDistance}
                minimumTrackTintColor={colors.accent}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.accent}
              />
              <View style={s.unitToggle}>
                <TouchableOpacity
                  style={[s.unitButton, distanceUnit === 'mi' && s.unitButtonActive]}
                  onPress={() => setDistanceUnit('mi')}
                >
                  <Text style={[s.unitText, distanceUnit === 'mi' && s.unitTextActive]}>mi</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[s.unitButton, distanceUnit === 'km' && s.unitButtonActive]}
                  onPress={() => setDistanceUnit('km')}
                >
                  <Text style={[s.unitText, distanceUnit === 'km' && s.unitTextActive]}>km</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Styles */}
          <SectionHeader
            title="STYLES"
            expanded={expandedSections.styles}
            onToggle={() => toggleSection('styles')}
            count={selectedStyles.length}
          />
          {expandedSections.styles && (
            <View style={s.sectionContent}>
              <TextInput
                style={s.filterInput}
                placeholder="Filter styles..."
                placeholderTextColor={colors.textMuted}
                value={styleSearch}
                onChangeText={setStyleSearch}
              />
              {filteredStyles.map(style => (
                <CheckboxRow
                  key={style.id}
                  label={style.name}
                  checked={selectedStyles.includes(style.id)}
                  onToggle={() => toggleStyle(style.id)}
                />
              ))}
              {filteredStyles.length === 0 && (
                <Text style={s.emptyText}>No styles match</Text>
              )}
            </View>
          )}

          {/* Tags */}
          <SectionHeader
            title="TAGS"
            expanded={expandedSections.tags}
            onToggle={() => toggleSection('tags')}
            count={selectedTags.length}
          />
          {expandedSections.tags && (
            <View style={s.sectionContent}>
              <TextInput
                style={s.filterInput}
                placeholder="Filter tags..."
                placeholderTextColor={colors.textMuted}
                value={tagSearch}
                onChangeText={setTagSearch}
              />
              {filteredTags.map(tag => (
                <CheckboxRow
                  key={tag.id}
                  label={tag.name}
                  checked={selectedTags.includes(tag.id)}
                  onToggle={() => toggleTag(tag.id)}
                />
              ))}
              {filteredTags.length === 0 && (
                <Text style={s.emptyText}>No tags match</Text>
              )}
            </View>
          )}

          <View style={s.bottomPadding} />
        </ScrollView>

        {/* Footer */}
        <View style={s.footer}>
          <TouchableOpacity onPress={onClose} style={s.closeButton}>
            <Text style={s.closeButtonText}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleApply} style={s.applyButton}>
            <Text style={s.applyButtonText}>Show Results</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

// -- Sub-components --

function SectionHeader({
  title,
  expanded,
  onToggle,
  count,
}: {
  title: string;
  expanded: boolean;
  onToggle: () => void;
  count?: number;
}) {
  return (
    <TouchableOpacity style={s.sectionHeader} onPress={onToggle} activeOpacity={0.7}>
      <View style={s.sectionHeaderLeft}>
        <Text style={s.sectionTitle}>{title}</Text>
        {count !== undefined && count > 0 && (
          <View style={s.countBadge}>
            <Text style={s.countBadgeText}>{count}</Text>
          </View>
        )}
      </View>
      <MaterialIcons
        name={expanded ? 'expand-less' : 'expand-more'}
        size={22}
        color={colors.textMuted}
      />
    </TouchableOpacity>
  );
}

function CheckboxRow({
  label,
  checked,
  onToggle,
}: {
  label: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <TouchableOpacity style={s.checkboxRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[s.checkbox, checked && s.checkboxChecked]}>
        {checked && <MaterialIcons name="check" size={16} color={colors.background} />}
      </View>
      <Text style={[s.checkboxLabel, checked && s.checkboxLabelChecked]}>{label}</Text>
    </TouchableOpacity>
  );
}

// -- Styles --

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
  },
  clearAll: {
    color: colors.accent,
    fontSize: 15,
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
  },

  // Quick jumps
  quickJumps: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
    marginBottom: 8,
  },
  quickJumpChip: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickJumpText: {
    color: colors.textSecondary,
    fontSize: 13,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  countBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  countBadgeText: {
    color: colors.background,
    fontSize: 11,
    fontWeight: '700',
  },
  sectionContent: {
    paddingTop: 12,
    paddingBottom: 8,
  },

  // Location
  locationOptions: {
    flexDirection: 'row',
    gap: 10,
  },
  locationChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  locationChipActive: {
    backgroundColor: colors.accentDim,
    borderColor: colors.accent,
  },
  locationChipText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  locationChipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },

  // Distance
  distanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  distanceLabel: {
    color: colors.textSecondary,
    fontSize: 15,
  },
  distanceValue: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
  },
  unitToggle: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  unitButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitButtonActive: {
    backgroundColor: colors.surfaceElevated,
    borderColor: colors.accent,
  },
  unitText: {
    color: colors.textMuted,
    fontSize: 14,
    fontWeight: '600',
  },
  unitTextActive: {
    color: colors.accent,
  },

  // Filter input
  filterInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
    marginBottom: 8,
  },

  // Checkbox rows
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: colors.textMuted,
    marginRight: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkboxLabel: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  checkboxLabelChecked: {
    color: colors.accent,
  },

  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: 12,
  },

  // Footer
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  closeButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  closeButtonText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
  },
  applyButtonText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '700',
  },
  bottomPadding: {
    height: 24,
  },
});
