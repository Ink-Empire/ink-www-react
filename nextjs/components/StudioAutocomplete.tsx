import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colors } from '@/styles/colors';
import { searchEstablishments, PlacePrediction } from '@/services/googlePlacesService';
import { api } from '@/utils/api';

export interface StudioOption {
  id: number;
  name: string;
  location?: string;
  slug?: string;
  is_claimed: boolean;
  is_new: boolean;
  google_place_id?: string;
  phone?: string;
  website?: string;
  rating?: number;
}

interface StudioAutocompleteProps {
  value?: StudioOption | null;
  onChange: (studio: StudioOption | null) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  required?: boolean;
  disabled?: boolean;
  /** If true, allows entering a custom studio name that doesn't exist in Google */
  allowCustom?: boolean;
  /** Called when user enters a custom studio name (not from Google) */
  onCustomInput?: (name: string) => void;
  /** Location to bias search results (lat,lng string or {lat, lng} object) */
  location?: string | { lat: number; lng: number } | null;
}

const StudioAutocomplete: React.FC<StudioAutocompleteProps> = ({
  value,
  onChange,
  label = 'Studio',
  placeholder = 'Search for your studio...',
  error = false,
  helperText,
  required = false,
  disabled = false,
  allowCustom = false,
  onCustomInput,
  location,
}) => {
  const [inputValue, setInputValue] = useState(value?.name || '');
  const [options, setOptions] = useState<PlacePrediction[]>([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Sync input value with external value
  useEffect(() => {
    if (value?.name) {
      setInputValue(value.name);
    }
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
      const results = await searchEstablishments(newInputValue, location);
      setOptions(results);
      setLoading(false);
    }, 300);
  }, [location]);

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  const handleOptionSelect = async (prediction: PlacePrediction | null) => {
    if (!prediction) {
      onChange(null);
      return;
    }

    setSelecting(true);

    try {
      // Call our backend to lookup or create the studio
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
      // Fallback: just use the prediction data
      if (allowCustom && onCustomInput) {
        onCustomInput(prediction.mainText);
      }
    } finally {
      setSelecting(false);
    }
  };

  const handleCustomInput = () => {
    if (allowCustom && onCustomInput && inputValue.length >= 2) {
      onCustomInput(inputValue);
    }
  };

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => {
        setOpen(false);
        handleCustomInput();
      }}
      options={options}
      loading={loading || selecting}
      disabled={disabled}
      inputValue={inputValue}
      onInputChange={(_, newValue) => handleInputChange(newValue)}
      onChange={(_, newValue) => handleOptionSelect(newValue as PlacePrediction | null)}
      getOptionLabel={(option) => {
        if (typeof option === 'string') return option;
        return option.mainText || option.description || '';
      }}
      isOptionEqualToValue={(option, val) => option.placeId === val.placeId}
      filterOptions={(x) => x} // Disable built-in filtering since we're using API search
      freeSolo={allowCustom}
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
                {(loading || selecting) ? (
                  <CircularProgress size={20} sx={{ color: colors.accent }} />
                ) : null}
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
            gap: 1.5,
            py: 1.5,
            px: 2,
            '&:hover': {
              backgroundColor: 'rgba(201, 169, 98, 0.1)',
            },
          }}
        >
          <BusinessIcon sx={{ color: colors.accent, fontSize: 24 }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="body1" sx={{ color: colors.textPrimary, fontWeight: 500 }}>
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
          : 'No studios found'
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

export default StudioAutocomplete;

/**
 * Component to display the selected studio with status
 */
export const SelectedStudioDisplay: React.FC<{
  studio: StudioOption;
  onClear?: () => void;
}> = ({ studio, onClear }) => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        p: 2,
        bgcolor: colors.surfaceElevated,
        borderRadius: 2,
        border: `1px solid ${colors.border}`,
      }}
    >
      <BusinessIcon sx={{ color: colors.accent, fontSize: 32 }} />
      <Box sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ color: colors.textPrimary, fontWeight: 600 }}>
            {studio.name}
          </Typography>
          {studio.is_claimed && (
            <Chip
              icon={<CheckCircleIcon sx={{ fontSize: 14 }} />}
              label="Claimed"
              size="small"
              sx={{
                bgcolor: `${colors.accent}20`,
                color: colors.accent,
                fontSize: '0.7rem',
                height: 20,
              }}
            />
          )}
        </Box>
        {studio.location && (
          <Typography variant="body2" sx={{ color: colors.textSecondary }}>
            {studio.location}
          </Typography>
        )}
      </Box>
      {onClear && (
        <Box
          component="button"
          onClick={onClear}
          sx={{
            background: 'none',
            border: 'none',
            color: colors.textMuted,
            cursor: 'pointer',
            p: 1,
            '&:hover': { color: colors.textPrimary },
          }}
        >
          Change
        </Box>
      )}
    </Box>
  );
};
