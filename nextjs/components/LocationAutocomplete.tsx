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

// Priority countries for sorting results (most relevant first)
const PRIORITY_COUNTRIES = ['us', 'nz', 'ca', 'gb', 'au', 'de', 'fr', 'es', 'it', 'mx', 'br'];

// Search for locations using Nominatim - worldwide cities
const searchLocations = async (query: string): Promise<LocationOption[]> => {
  if (!query || query.length < 2) {
    return [];
  }

  try {
    // Search for cities worldwide - request more results so we can filter and sort
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=15&addressdetails=1&featuretype=city`;

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'InkedIn-App/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.status}`);
    }

    const data = await response.json();

    // Filter to exclude non-place results like counties, but be lenient to include cities
    const filteredResults = data.filter((result: any) => {
      const type = result.type?.toLowerCase() || '';
      const classType = result.class?.toLowerCase() || '';
      const displayName = result.display_name?.toLowerCase() || '';

      // Strictly exclude these types
      const excludeTypes = ['county', 'state', 'country', 'continent'];
      if (excludeTypes.includes(type)) {
        return false;
      }

      // Exclude administrative boundaries unless they have city/town in the name
      if (type === 'administrative' && !displayName.includes('city')) {
        return false;
      }

      // Include anything with these types
      const validTypes = ['city', 'town', 'village', 'hamlet', 'municipality', 'suburb', 'neighbourhood', 'residential'];
      if (validTypes.includes(type)) {
        return true;
      }

      // Include results from 'place' class (most cities)
      if (classType === 'place') {
        return true;
      }

      // Include boundary class if it's not a county/state
      if (classType === 'boundary' && !excludeTypes.includes(type)) {
        return true;
      }

      // Include if it has address details with a city
      const address = result.address || {};
      if (address.city || address.town || address.village) {
        return true;
      }

      return false;
    });

    // Sort results to prioritize popular countries (US, CA, GB, etc.)
    const sortedResults = filteredResults.sort((a: any, b: any) => {
      const countryA = a.address?.country_code?.toLowerCase() || '';
      const countryB = b.address?.country_code?.toLowerCase() || '';

      const priorityA = PRIORITY_COUNTRIES.indexOf(countryA);
      const priorityB = PRIORITY_COUNTRIES.indexOf(countryB);

      // If both are priority countries, sort by priority order
      if (priorityA !== -1 && priorityB !== -1) {
        return priorityA - priorityB;
      }
      // Priority countries come first
      if (priorityA !== -1) return -1;
      if (priorityB !== -1) return 1;
      // Otherwise maintain original order (by relevance from API)
      return 0;
    });

    return sortedResults.slice(0, 5).map((result: any) => {
      const address = result.address || {};
      const city = address.city || address.town || address.village || address.hamlet || address.municipality || result.name || '';
      const state = address.state || address.province || address.region || '';
      const country = address.country || '';
      const countryCode = address.country_code?.toUpperCase() || '';

      // Create a clean label: City, State/Province, Country
      let label = city;
      if (state && state !== city) {
        label += `, ${state}`;
      }
      if (country && country !== state) {
        label += `, ${country}`;
      }

      return {
        label,
        city,
        state,
        country,
        countryCode,
        lat: parseFloat(result.lat),
        lng: parseFloat(result.lon),
        placeId: result.place_id?.toString(),
      };
    });
  } catch (error) {
    console.error('Location search failed:', error);
    return [];
  }
};

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
  const [options, setOptions] = useState<LocationOption[]>([]);
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
      const results = await searchLocations(newInputValue);
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

  const handleOptionSelect = (option: LocationOption | null) => {
    if (option) {
      const latLong = `${option.lat},${option.lng}`;
      onChange(option.label, latLong, option);
      setInputValue(option.label);
    } else {
      onChange('', '', undefined);
      setInputValue('');
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
      onChange={(_, newValue) => handleOptionSelect(newValue)}
      getOptionLabel={(option) => (typeof option === 'string' ? option : option.label)}
      isOptionEqualToValue={(option, val) => option.label === val.label}
      filterOptions={(x) => x} // Disable built-in filtering since we're using API search
      freeSolo
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
              {option.city}{option.state ? `, ${option.state}` : ''}
            </Typography>
            {option.country && (
              <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                {option.country}
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
