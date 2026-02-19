import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';

interface Option {
  id: number;
  name: string;
}

interface MultiSelectPickerProps {
  visible: boolean;
  title: string;
  options: Option[];
  selected: number[];
  onToggle: (id: number) => void;
  onClose: () => void;
  searchPlaceholder?: string;
  initialDisplayCount?: number;
  onCreateNew?: (name: string) => Promise<Option | null>;
}

export default function MultiSelectPicker({
  visible,
  title,
  options,
  selected,
  onToggle,
  onClose,
  searchPlaceholder = 'Search...',
  initialDisplayCount,
  onCreateNew,
}: MultiSelectPickerProps) {
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    if (search) {
      return options.filter(o => o.name.toLowerCase().includes(search.toLowerCase()));
    }
    return initialDisplayCount ? options.slice(0, initialDisplayCount) : options;
  }, [options, search, initialDisplayCount]);

  const hasExactMatch = useMemo(() => {
    if (!search.trim()) return true;
    return options.some(o => o.name.toLowerCase() === search.trim().toLowerCase());
  }, [options, search]);

  const handleClose = () => {
    setSearch('');
    onClose();
  };

  const handleCreateNew = async () => {
    if (!onCreateNew || !search.trim() || creating) return;
    setCreating(true);
    try {
      const newOption = await onCreateNew(search.trim());
      if (newOption) {
        onToggle(newOption.id);
        setSearch('');
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>{title}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.doneButton}>
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>

        {selected.length > 0 && (
          <Text style={styles.selectedCount}>{selected.length} selected</Text>
        )}

        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={search}
            onChangeText={setSearch}
            placeholder={searchPlaceholder}
            placeholderTextColor={colors.textMuted}
            autoCorrect={false}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView keyboardShouldPersistTaps="handled">
          {/* Create new option */}
          {onCreateNew && search.trim().length > 0 && !hasExactMatch && (
            <TouchableOpacity
              style={styles.createRow}
              onPress={handleCreateNew}
              activeOpacity={0.7}
              disabled={creating}
            >
              {creating ? (
                <ActivityIndicator size="small" color={colors.accent} style={styles.createIcon} />
              ) : (
                <MaterialIcons name="add-circle-outline" size={22} color={colors.accent} style={styles.createIcon} />
              )}
              <Text style={styles.createLabel}>
                Create "{search.trim()}"
              </Text>
            </TouchableOpacity>
          )}

          {filtered.map(option => {
            const isSelected = selected.includes(option.id);
            return (
              <TouchableOpacity
                key={option.id}
                style={styles.row}
                onPress={() => onToggle(option.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, isSelected && styles.checkboxChecked]}>
                  {isSelected && (
                    <MaterialIcons name="check" size={16} color={colors.background} />
                  )}
                </View>
                <Text style={[styles.label, isSelected && styles.labelChecked]}>
                  {option.name}
                </Text>
              </TouchableOpacity>
            );
          })}
          {filtered.length === 0 && !onCreateNew && (
            <Text style={styles.emptyText}>No results</Text>
          )}
          {filtered.length === 0 && onCreateNew && !search.trim() && (
            <Text style={styles.emptyText}>No results</Text>
          )}
          {!search && initialDisplayCount && options.length > initialDisplayCount && (
            <Text style={styles.hintText}>Type to search more...</Text>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  doneButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    backgroundColor: colors.accent,
    borderRadius: 6,
  },
  doneText: {
    color: colors.textOnLight,
    fontSize: 15,
    fontWeight: '600',
  },
  selectedCount: {
    color: colors.textMuted,
    fontSize: 13,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingHorizontal: 12,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 10,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  createRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.accentDim,
  },
  createIcon: {
    marginRight: 14,
  },
  createLabel: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '600',
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
  label: {
    color: colors.textPrimary,
    fontSize: 16,
  },
  labelChecked: {
    color: colors.accent,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 14,
    paddingVertical: 20,
    textAlign: 'center',
  },
  hintText: {
    color: colors.textMuted,
    fontSize: 13,
    paddingVertical: 12,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
