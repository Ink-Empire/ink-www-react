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
  Platform,
  PermissionsAndroid,
  Modal,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Geolocation from '@react-native-community/geolocation';
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

async function reverseGeocode(latitude: number, longitude: number): Promise<{
  city: string;
  state: string;
  countryCode: string;
}> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=10&addressdetails=1`;
    const response = await fetch(url, {
      headers: { 'User-Agent': 'InkedIn-App/1.0' },
    });

    if (!response.ok) throw new Error('Geocoding failed');

    const data = await response.json();
    const address = data.address || {};

    return {
      city: address.city || address.town || address.village || address.hamlet || address.suburb || '',
      state: address.state || address.province || address.region || '',
      countryCode: address.country_code?.toUpperCase() || '',
    };
  } catch {
    return { city: '', state: '', countryCode: '' };
  }
}

async function requestLocationPermission(): Promise<boolean> {
  if (Platform.OS === 'android') {
    try {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch {
      return false;
    }
  }
  return true;
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
  const [gettingLocation, setGettingLocation] = useState(false);
  const [useMyLocation, setUseMyLocation] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [preservedLatLong, setPreservedLatLong] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  useEffect(() => {
    fetchPlacesApiKey(api).then(setApiKey);
  }, []);

  const handleGetCurrentLocation = useCallback(async () => {
    const hasPermission = await requestLocationPermission();
    if (!hasPermission) return;

    setGettingLocation(true);
    setUseMyLocation(true);

    Geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const latLong = `${latitude},${longitude}`;
        const geo = await reverseGeocode(latitude, longitude);

        if (geo.city) {
          const locationStr = [geo.city, geo.state, geo.countryCode].filter(Boolean).join(', ');
          setInputValue(locationStr);
          onChange(locationStr, latLong);
        } else {
          setUseMyLocation(false);
          setManualCity('');
          setManualState(geo.state || '');
          setPreservedLatLong(latLong);
          setManualEntryOpen(true);
        }
        setGettingLocation(false);
      },
      () => {
        setGettingLocation(false);
        setUseMyLocation(false);
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 },
    );
  }, [onChange]);

  const handleToggleLocation = () => {
    if (useMyLocation) {
      setUseMyLocation(false);
      setInputValue('');
      onChange('', '');
    } else {
      handleGetCurrentLocation();
    }
  };

  const handleChangeText = useCallback(
    (text: string) => {
      setInputValue(text);
      setUseMyLocation(false);

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
    setTimeout(() => setShowDropdown(false), 200);
  }, []);

  const handleManualEntrySubmit = async () => {
    const city = manualCity.trim();
    const state = manualState.trim();
    if (!city) return;

    const locationString = state ? `${city}, ${state}` : city;

    let latLong = preservedLatLong;
    if (!latLong && state && apiKey) {
      const stateResults = await searchPlaces(state, apiKey);
      if (stateResults.length > 0) {
        const details = await getPlaceDetails(stateResults[0].placeId, apiKey);
        if (details) {
          latLong = `${details.lat},${details.lng}`;
        }
      }
    }

    setInputValue(locationString);
    onChange(locationString, latLong);
    setManualEntryOpen(false);
    setPreservedLatLong('');
  };

  const handleCloseManualEntry = () => {
    setManualEntryOpen(false);
    setPreservedLatLong('');
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        {label ? <Text style={styles.label}>{label}</Text> : null}
        <TouchableOpacity
          onPress={handleToggleLocation}
          disabled={gettingLocation}
          style={styles.locationButton}
        >
          {gettingLocation ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <MaterialIcons
                name={useMyLocation ? 'location-on' : 'my-location'}
                size={16}
                color={colors.accent}
              />
              <Text style={styles.locationButtonText}>
                {useMyLocation ? 'Enter manually' : 'Use my location'}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {useMyLocation ? (
        <View style={styles.detectedBox}>
          {gettingLocation ? (
            <Text style={styles.detectedText}>Getting your location...</Text>
          ) : (
            <>
              <MaterialIcons name="location-on" size={18} color={colors.accent} />
              <Text style={styles.detectedText}>{inputValue || 'Location detected'}</Text>
            </>
          )}
        </View>
      ) : (
        <>
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

          {inputValue.length >= 2 && !loading && predictions.length === 0 && showDropdown && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.option}
                onPress={() => {
                  setShowDropdown(false);
                  setManualCity('');
                  setManualState('');
                  setManualEntryOpen(true);
                }}
              >
                <MaterialIcons
                  name="edit-location"
                  size={18}
                  color={colors.accent}
                  style={styles.optionIcon}
                />
                <View style={styles.optionText}>
                  <Text style={styles.manualEntryText}>Can't find your city?</Text>
                  <Text style={styles.secondaryText}>Enter it manually</Text>
                </View>
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Modal
        visible={manualEntryOpen}
        transparent
        animationType="fade"
        onRequestClose={handleCloseManualEntry}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Enter your location</Text>
            <Text style={styles.modalSubtitle}>
              We couldn't find your exact city. Please enter it manually.
            </Text>
            <Text style={styles.modalLabel}>City</Text>
            <TextInput
              style={styles.modalInput}
              value={manualCity}
              onChangeText={setManualCity}
              placeholder="Your city"
              placeholderTextColor={colors.textMuted}
              autoFocus
              maxLength={100}
            />
            <Text style={styles.modalLabel}>State / Province</Text>
            <TextInput
              style={styles.modalInput}
              value={manualState}
              onChangeText={setManualState}
              placeholder="Your state or province"
              placeholderTextColor={colors.textMuted}
              maxLength={100}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={handleCloseManualEntry}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.modalSaveButton,
                  !manualCity.trim() && styles.modalSaveButtonDisabled,
                ]}
                onPress={handleManualEntrySubmit}
                disabled={!manualCity.trim()}
              >
                <Text style={styles.modalSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    zIndex: 10,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationButtonText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  detectedBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accentDim,
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    gap: 8,
  },
  detectedText: {
    color: colors.textPrimary,
    fontSize: 16,
    flex: 1,
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
  manualEntryText: {
    color: colors.accent,
    fontSize: 15,
    fontStyle: 'italic',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.borderLight,
    padding: 24,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  modalSubtitle: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 20,
  },
  modalLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: colors.inputBackground,
    borderWidth: 1,
    borderColor: colors.inputBorder,
    borderRadius: 8,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 4,
  },
  modalCancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  modalCancelText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  modalSaveButton: {
    backgroundColor: colors.accent,
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  modalSaveButtonDisabled: {
    backgroundColor: colors.border,
  },
  modalSaveText: {
    color: colors.background,
    fontSize: 15,
    fontWeight: '600',
  },
});
