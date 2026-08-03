import React, { useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  debounceMs?: number;
}

export default function SearchBar({
  onSearch,
  placeholder = 'Search...',
  debounceMs = 400,
}: SearchBarProps) {
  const [value, setValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((text: string) => {
    setValue(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onSearch(text.trim());
    }, debounceMs);
  }, [onSearch, debounceMs]);

  const handleClear = () => {
    setValue('');
    onSearch('');
  };

  const handleCancel = () => {
    inputRef.current?.blur();
    setValue('');
    onSearch('');
  };

  return (
    <View style={styles.row}>
      <View style={[styles.container, isFocused && styles.containerFocused]}>
        <MaterialIcons name="search" size={20} color={colors.textMuted} style={styles.searchIcon} />
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={value}
          onChangeText={handleChange}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          returnKeyType="search"
          onSubmitEditing={() => onSearch(value.trim())}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <MaterialIcons name="close" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>
      {isFocused && (
        <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  container: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  containerFocused: {
    borderColor: colors.accent,
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  clearButton: {
    padding: 6,
  },
  cancelButton: {
    paddingLeft: 12,
  },
  cancelText: {
    color: colors.accent,
    fontSize: 16,
  },
});
