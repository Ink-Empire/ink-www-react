import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EditLocationIcon from '@mui/icons-material/EditLocation';
import { colors } from '@/styles/colors';
import { searchPlaces, getPlaceDetails, PlacePrediction } from '@/services/googlePlacesService';

export interface LocationOption {
  label: string;
  city: string;
  state: string;
  country: string;
  countryCode: string;
  lat: number;
  lng: number;
  placeId?: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: string, latLong: string, option?: LocationOption) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  // When true, opens the manual entry dialog (for unknown city from geolocation)
  triggerManualEntry?: boolean;
  // Callback when manual entry dialog closes (either saved or cancelled)
  onManualEntryClose?: () => void;
  // Pre-fill state when opening manual entry (e.g., from geolocation result)
  initialState?: string;
  // Pre-fill coordinates when opening manual entry
  initialLatLong?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  label = 'Location',
  placeholder = 'Start typing a city name...',
  error = false,
  helperText,
  required = false,
  disabled = false,
  triggerManualEntry = false,
  onManualEntryClose,
  initialState = '',
  initialLatLong = '',
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [manualCity, setManualCity] = useState('');
  const [manualState, setManualState] = useState('');
  const [preservedLatLong, setPreservedLatLong] = useState('');
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync input value with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Trigger manual entry dialog when parent requests it (e.g., unknown city from geolocation)
  useEffect(() => {
    if (triggerManualEntry) {
      setManualCity('');
      setManualState(initialState);
      setPreservedLatLong(initialLatLong);
      setManualEntryOpen(true);
    }
  }, [triggerManualEntry, initialState, initialLatLong]);

  // Debounced search
  const handleInputChange = useCallback((newInputValue: string) => {
    setInputValue(newInputValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (newInputValue.length < 2) {
      setOptions([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      const results = await searchPlaces(newInputValue);
      setOptions(results);
      setLoading(false);
    }, 300);
  }, []);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleOptionSelect = async (prediction: PlacePrediction | string | null) => {
    // Handle null/empty case
    if (!prediction) {
      onChange('', '', undefined);
      setInputValue('');
      return;
    }

    // Handle freeSolo string input (user typed without selecting from dropdown)
    if (typeof prediction === 'string') {
      // Just update the display value - coordinates won't be available
      // The user needs to select from dropdown to get coordinates
      onChange(prediction, '', undefined);
      setInputValue(prediction);
      return;
    }

    // Handle "manual entry" special option
    if (prediction.placeId === 'manual-entry') {
      setManualCity('');
      setManualState('');
      setManualEntryOpen(true);
      setOpen(false);
      return;
    }

    // Handle proper PlacePrediction selection
    // Fetch full place details to get coordinates
    const details = await getPlaceDetails(prediction.placeId);

    if (details) {
      const option: LocationOption = {
        label: prediction.description,
        city: details.city,
        state: details.state,
        country: details.country,
        countryCode: details.countryCode,
        lat: details.lat,
        lng: details.lng,
        placeId: prediction.placeId,
      };
      const latLong = `${details.lat},${details.lng}`;
      onChange(prediction.description, latLong, option);
      setInputValue(prediction.description);
    } else {
      // Fallback if details fetch fails
      onChange(prediction.description, '', undefined);
      setInputValue(prediction.description);
    }
  };

  const sanitizeInput = (input: string): string => {
    return input
      .trim()
      .replace(/[<>\"'&]/g, '') // Remove potentially dangerous chars
      .replace(/\s+/g, ' ') // Normalize whitespace
      .substring(0, 100); // Limit length
  };

  const handleManualEntrySubmit = async () => {
    const city = sanitizeInput(manualCity);
    const state = sanitizeInput(manualState);

    if (!city) return;

    const locationString = state ? `${city}, ${state}` : city;

    // Use preserved lat/long from geolocation if available
    // Otherwise try to get coordinates by searching for the state/region
    let latLong = preservedLatLong;
    if (!latLong && state) {
      const stateResults = await searchPlaces(state);
      if (stateResults.length > 0) {
        const details = await getPlaceDetails(stateResults[0].placeId);
        if (details) {
          latLong = `${details.lat},${details.lng}`;
        }
      }
    }

    const option: LocationOption = {
      label: locationString,
      city,
      state,
      country: '',
      countryCode: '',
      lat: latLong ? parseFloat(latLong.split(',')[0]) : 0,
      lng: latLong ? parseFloat(latLong.split(',')[1]) : 0,
    };

    onChange(locationString, latLong, option);
    setInputValue(locationString);
    handleCloseManualEntry();
  };

  const handleCloseManualEntry = () => {
    setManualEntryOpen(false);
    setPreservedLatLong('');
    onManualEntryClose?.();
  };

  // Only show manual entry option when there are no results
  const optionsWithManualEntry: PlacePrediction[] = [
    ...options,
    ...(inputValue.length >= 2 && options.length === 0 && !loading ? [{
      placeId: 'manual-entry',
      description: "Can't find your city? Enter it manually",
      mainText: "Can't find your city?",
      secondaryText: 'Enter it manually',
      types: ['manual'],
    }] : []),
  ];

  return (
    <>
    <Autocomplete
      freeSolo
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={optionsWithManualEntry}
      loading={loading}
      disabled={disabled}
      inputValue={inputValue}
      onInputChange={(_, newValue) => handleInputChange(newValue)}
      onChange={(_, newValue) => handleOptionSelect(newValue as PlacePrediction | string | null)}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option.description || '';
      }}
      isOptionEqualToValue={(option, val) => option.placeId === val.placeId}
      filterOptions={(x) => x} // Disable built-in filtering since we're using API search
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={placeholder}
          required={required}
          error={error}
          helperText={helperText}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress size={20} sx={{ color: colors.accent }} /> : null}
                {params.InputProps.endAdornment}
              </>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'rgba(232, 219, 197, 0.5)',
              },
              '&:hover fieldset': {
                borderColor: colors.textSecondary,
              },
              '&.Mui-focused fieldset': {
                borderColor: colors.accent,
              },
            },
            '& .MuiInputLabel-root': {
              color: colors.textSecondary,
              '&.Mui-focused': {
                color: colors.accent,
              },
            },
          }}
        />
      )}
      renderOption={(props, option) => (
        <Box
          component="li"
          {...props}
          key={option.placeId}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            py: 1,
            px: 2,
            ...(option.placeId === 'manual-entry' && {
              borderTop: `1px solid ${colors.border}`,
              mt: 1,
            }),
            '&:hover': {
              backgroundColor: 'rgba(201, 169, 98, 0.1)',
            },
          }}
        >
          {option.placeId === 'manual-entry' ? (
            <EditLocationIcon sx={{ color: colors.accent, fontSize: 20 }} />
          ) : (
            <LocationOnIcon sx={{ color: colors.accent, fontSize: 20 }} />
          )}
          <Box>
            <Typography
              variant="body1"
              sx={{
                color: option.placeId === 'manual-entry' ? colors.accent : colors.textPrimary,
                fontStyle: option.placeId === 'manual-entry' ? 'italic' : 'normal',
              }}
            >
              {option.mainText}
            </Typography>
            {option.secondaryText && (
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                {option.secondaryText}
              </Typography>
            )}
          </Box>
        </Box>
      )}
      noOptionsText={
        inputValue.length < 2
          ? 'Type at least 2 characters to search'
          : 'No locations found'
      }
      sx={{
        '& .MuiAutocomplete-listbox': {
          backgroundColor: colors.surface,
        },
        '& .MuiAutocomplete-paper': {
          backgroundColor: colors.surface,
          border: `1px solid rgba(232, 219, 197, 0.2)`,
        },
      }}
    />

    <Dialog
      open={manualEntryOpen}
      onClose={handleCloseManualEntry}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          bgcolor: colors.surface,
          m: { xs: 2, sm: 3 },
          width: { xs: 'calc(100% - 32px)', sm: 'auto' },
        },
      }}
    >
      <DialogTitle sx={{ color: colors.textPrimary, pb: 1 }}>
        Enter your location
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography sx={{ color: colors.textSecondary, fontSize: '0.875rem', mb: 2 }}>
          We couldn&apos;t find your exact city. Please enter it manually.
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="City"
          value={manualCity}
          onChange={(e) => setManualCity(e.target.value)}
          sx={{ mb: 2 }}
          inputProps={{ maxLength: 100 }}
        />
        <TextField
          fullWidth
          label="State / Province"
          value={manualState}
          onChange={(e) => setManualState(e.target.value)}
          inputProps={{ maxLength: 100 }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1 }}>
        <Button
          onClick={handleCloseManualEntry}
          sx={{ color: colors.textSecondary }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleManualEntrySubmit}
          disabled={!manualCity.trim()}
          sx={{
            bgcolor: colors.accent,
            color: colors.background,
            px: 3,
            '&:hover': { bgcolor: colors.accentDim },
            '&.Mui-disabled': { bgcolor: colors.border, color: colors.textMuted },
          }}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
    </>
  );
};

export default LocationAutocomplete;
