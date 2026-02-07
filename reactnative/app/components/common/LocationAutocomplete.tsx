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
  searchPlaces,
  getPlaceDetails,
} from '@inkedin/shared/services/googlePlacesService';
import type { PlacePrediction } from '@inkedin/shared/services/googlePlacesService';

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: string, latLong: string) => void;
  label?: string;
  placeholder?: string;
  error?: string;
}

export default function LocationAutocomplete({
  value,
  onChange,
  label = 'Location',
  placeholder = 'Start typing a city name...',
  error,
}: LocationAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [predictions, setPredictions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    fetchPlacesApiKey(api).then(setApiKey);
  }, []);

  const handleChangeText = useCallback(
    (text: string) => {
      setInputValue(text);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (text.length < 2) {
        setPredictions([]);
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
        const results = await searchPlaces(text, apiKey);
        setPredictions(results);
        setShowDropdown(results.length > 0);
        setLoading(false);
      }, 300);
    },
    [apiKey],
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSelect = useCallback(
    async (prediction: PlacePrediction) => {
      setShowDropdown(false);
      setPredictions([]);
      setInputValue(prediction.description);
      Keyboard.dismiss();

      if (!apiKey) {
        onChange(prediction.description, '');
        return;
      }

      const details = await getPlaceDetails(prediction.placeId, apiKey);
      if (details) {
        const latLong = `${details.lat},${details.lng}`;
        onChange(prediction.description, latLong);
      } else {
        onChange(prediction.description, '');
      }
    },
    [apiKey, onChange],
  );

  const handleBlur = useCallback(() => {
    // Small delay so tap on dropdown item registers before we hide it
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
            if (predictions.length > 0) setShowDropdown(true);
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          autoCorrect={false}
        />
        {loading && (
          <ActivityIndicator
            size="small"
            color={colors.accent}
            style={styles.spinner}
          />
        )}
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {showDropdown && predictions.length > 0 && (
        <ScrollView
          style={styles.dropdown}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {predictions.map((item) => (
            <TouchableOpacity
              key={item.placeId}
              style={styles.option}
              onPress={() => handleSelect(item)}
            >
              <MaterialIcons
                name="location-on"
                size={18}
                color={colors.accent}
                style={styles.optionIcon}
              />
              <View style={styles.optionText}>
                <Text style={styles.mainText} numberOfLines={1}>
                  {item.mainText}
                </Text>
                {item.secondaryText ? (
                  <Text style={styles.secondaryText} numberOfLines={1}>
                    {item.secondaryText}
                  </Text>
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
    maxHeight: 220,
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
