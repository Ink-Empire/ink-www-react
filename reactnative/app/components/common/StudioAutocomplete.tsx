import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Keyboard,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../../lib/colors';
import { api } from '../../../lib/api';
import {
  fetchPlacesApiKey,
  searchEstablishments,
} from '@inkedin/shared/services/googlePlacesService';
import type { PlacePrediction } from '@inkedin/shared/services/googlePlacesService';

export interface StudioOption {
  id: number;
  name: string;
  location?: string;
  slug?: string;
  is_claimed: boolean;
  is_new: boolean;
  google_place_id?: string;
}

interface StudioAutocompleteProps {
  value: StudioOption | null;
  onChange: (studio: StudioOption | null) => void;
  label?: string;
  placeholder?: string;
  error?: string;
  location?: string;
}

export default function StudioAutocomplete({
  value,
  onChange,
  label = 'Studio',
  placeholder = 'Search for your studio...',
  error,
  location,
}: StudioAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value?.name || '');
  const [options, setOptions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (value?.name) {
      setInputValue(value.name);
    }
  }, [value]);

  useEffect(() => {
    fetchPlacesApiKey(api).then(setApiKey);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      setInputValue(text);
      if (value) onChange(null);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.length < 2) {
        setOptions([]);
        setShowDropdown(false);
        setLoading(false);
        return;
      }

      setLoading(true);

      debounceRef.current = setTimeout(async () => {
        if (!apiKey) {
          setLoading(false);
          return;
        }
        const results = await searchEstablishments(text, apiKey, location);
        setOptions(results);
        setShowDropdown(results.length > 0);
        setLoading(false);
      }, 300);
    },
    [apiKey, location, value, onChange],
  );

  const handleSelect = useCallback(
    async (prediction: PlacePrediction) => {
      setShowDropdown(false);
      setOptions([]);
      setInputValue(prediction.mainText);
      setSelecting(true);
      Keyboard.dismiss();

      try {
        const response = await api.post<{
          studio: StudioOption;
          is_new: boolean;
          is_claimed: boolean;
        }>('/studios/lookup-or-create', {
          place_id: prediction.placeId,
        });

        const studio: StudioOption = {
          ...response.studio,
          is_new: response.is_new,
          is_claimed: response.is_claimed,
        };

        onChange(studio);
        setInputValue(studio.name);
      } catch (err) {
        console.error('Failed to lookup studio:', err);
      } finally {
        setSelecting(false);
      }
    },
    [onChange],
  );

  const handleBlur = useCallback(() => {
    setTimeout(() => setShowDropdown(false), 200);
  }, []);

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <View>
        <TextInput
          style={[styles.input, error ? styles.inputError : null]}
          value={inputValue}
          onChangeText={handleChangeText}
          onFocus={() => {
            if (options.length > 0 && !value) setShowDropdown(true);
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
          editable={!selecting}
        />
        {(loading || selecting) && (
          <ActivityIndicator size="small" color={colors.accent} style={styles.spinner} />
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showDropdown && options.length > 0 && (
        <ScrollView
          style={styles.dropdown}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {options.map((item) => (
            <TouchableOpacity
              key={item.placeId}
              style={styles.option}
              onPress={() => handleSelect(item)}
            >
              <MaterialIcons name="store" size={18} color={colors.accent} style={styles.optionIcon} />
              <View style={styles.optionText}>
                <Text style={styles.mainText} numberOfLines={1}>{item.mainText}</Text>
                {item.secondaryText ? (
                  <Text style={styles.secondaryText} numberOfLines={1}>{item.secondaryText}</Text>
                ) : null}
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 10,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  inputError: {
    borderColor: colors.error,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  spinner: {
    position: 'absolute',
    right: 12,
    top: 14,
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    marginTop: 4,
    maxHeight: 260,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  optionIcon: {
    marginRight: 10,
  },
  optionText: {
    flex: 1,
  },
  mainText: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  secondaryText: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 1,
  },
});
