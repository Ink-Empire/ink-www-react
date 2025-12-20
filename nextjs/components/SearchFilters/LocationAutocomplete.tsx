import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  TextField,
  Paper,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Typography,
  ClickAwayListener,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { colors } from '@/styles/colors';

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    country?: string;
    country_code?: string;
  };
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (location: string, coords: { lat: number; lng: number } | undefined) => void;
  placeholder?: string;
  error?: string | null;
}

export const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  placeholder = 'City, state, or country',
  error,
}) => {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync input value with external value prop
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  const fetchSuggestions = async (query: string) => {
    if (!query.trim() || query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    setFetchError(null);

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'InkedIn-App/1.0',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch suggestions');
      }

      const data: LocationSuggestion[] = await response.json();
      setSuggestions(data);
      setIsOpen(data.length > 0);
    } catch (err) {
      console.error('Error fetching location suggestions:', err);
      setFetchError('Unable to fetch suggestions');
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // If input is cleared, clear coords too
    if (!newValue.trim()) {
      onChange('', undefined);
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Debounce the API call
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  const handleSelectSuggestion = (suggestion: LocationSuggestion) => {
    const address = suggestion.address;
    const city = address.city || address.town || address.village || '';
    const state = address.state || '';
    const country = address.country || '';

    // Format the display name
    let formattedLocation = city;
    if (state && state !== city) {
      formattedLocation += formattedLocation ? `, ${state}` : state;
    }
    if (country && !formattedLocation.includes(country)) {
      formattedLocation += formattedLocation ? `, ${country}` : country;
    }

    // Fallback to the suggestion's display name if we couldn't build one
    if (!formattedLocation) {
      formattedLocation = suggestion.display_name.split(',').slice(0, 3).join(',').trim();
    }

    const coords = {
      lat: parseFloat(suggestion.lat),
      lng: parseFloat(suggestion.lon),
    };

    setInputValue(formattedLocation);
    setSuggestions([]);
    setIsOpen(false);
    onChange(formattedLocation, coords);
  };

  const handleClickAway = () => {
    setIsOpen(false);
  };

  const formatSuggestionDisplay = (suggestion: LocationSuggestion) => {
    const address = suggestion.address;
    const city = address.city || address.town || address.village || '';
    const state = address.state || '';
    const country = address.country || '';

    let primary = city || suggestion.display_name.split(',')[0];
    let secondary = [state, country].filter(Boolean).join(', ');

    return { primary, secondary };
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <ClickAwayListener onClickAway={handleClickAway}>
      <Box sx={{ position: 'relative' }}>
        <TextField
          fullWidth
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          size="small"
          error={Boolean(error || fetchError)}
          helperText={error || fetchError}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: colors.background,
              '& fieldset': { borderColor: `${colors.textPrimary}1A` },
              '&:hover fieldset': { borderColor: `${colors.textPrimary}1A` },
              '&.Mui-focused fieldset': { borderColor: colors.accent },
            },
            '& .MuiInputBase-input': {
              fontSize: '0.85rem',
              color: colors.textPrimary,
              '&::placeholder': { color: colors.textSecondary, opacity: 1 },
            },
          }}
          InputProps={{
            endAdornment: loading ? <CircularProgress size={16} /> : null,
          }}
        />

        {/* Suggestions Dropdown */}
        {isOpen && suggestions.length > 0 && (
          <Paper
            elevation={4}
            sx={{
              position: 'absolute',
              top: '100%',
              left: 0,
              right: 0,
              mt: 0.5,
              zIndex: 1000,
              maxHeight: 280,
              overflow: 'auto',
              bgcolor: colors.surface,
              border: `1px solid ${colors.border}`,
              borderRadius: 1,
            }}
          >
            <List dense disablePadding>
              {suggestions.map((suggestion) => {
                const { primary, secondary } = formatSuggestionDisplay(suggestion);
                return (
                  <ListItem
                    key={suggestion.place_id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    sx={{
                      cursor: 'pointer',
                      py: 1,
                      px: 1.5,
                      borderBottom: `1px solid ${colors.border}`,
                      '&:last-child': { borderBottom: 'none' },
                      '&:hover': {
                        bgcolor: `${colors.accent}1A`,
                      },
                    }}
                  >
                    <LocationOnIcon
                      sx={{
                        color: colors.accent,
                        fontSize: 20,
                        mr: 1.5,
                        flexShrink: 0,
                      }}
                    />
                    <ListItemText
                      primary={
                        <Typography
                          sx={{
                            fontSize: '0.9rem',
                            color: colors.textPrimary,
                            fontWeight: 500,
                          }}
                        >
                          {primary}
                        </Typography>
                      }
                      secondary={
                        secondary && (
                          <Typography
                            sx={{
                              fontSize: '0.75rem',
                              color: colors.textSecondary,
                            }}
                          >
                            {secondary}
                          </Typography>
                        )
                      }
                    />
                  </ListItem>
                );
              })}
            </List>
          </Paper>
        )}
      </Box>
    </ClickAwayListener>
  );
};
