import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
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
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [options, setOptions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync input value with external value
  useEffect(() => {
    setInputValue(value);
  }, [value]);

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

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      disabled={disabled}
      inputValue={inputValue}
      onInputChange={(_, newValue) => handleInputChange(newValue)}
      onChange={(_, newValue) => handleOptionSelect(newValue as PlacePrediction | null)}
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
            '&:hover': {
              backgroundColor: 'rgba(201, 169, 98, 0.1)',
            },
          }}
        >
          <LocationOnIcon sx={{ color: colors.accent, fontSize: 20 }} />
          <Box>
            <Typography variant="body1" sx={{ color: colors.textPrimary }}>
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
  );
};

export default LocationAutocomplete;
