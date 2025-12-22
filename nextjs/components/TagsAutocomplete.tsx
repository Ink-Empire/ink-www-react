import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Chip,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { colors } from '@/styles/colors';
import { api } from '@/utils/api';

export interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface TagsAutocompleteProps {
  value: Tag[];
  onChange: (tags: Tag[]) => void;
  label?: string;
  placeholder?: string;
  error?: boolean;
  helperText?: string;
  disabled?: boolean;
  maxTags?: number;
}

/**
 * TagsAutocomplete - Multi-select autocomplete for tattoo tags
 *
 * NEXT STEPS:
 * - TODO: Add AI-suggested tags based on uploaded images (API endpoint exists: POST /tattoos/{id}/generate-tags)
 *   The AI analyzes the tattoo image and suggests relevant tags automatically.
 *   These could be shown as "Suggested" chips that users can click to add.
 *
 * FUTURE STATE:
 * - TODO: Allow users to type in custom tags that don't exist in our database.
 *   These user-submitted tags should be marked as "pending" until approved by an admin.
 *   Consider adding a `status` field to the tags table (approved, pending, rejected).
 *   Pending tags could be shown with a different style/badge to indicate they're awaiting approval.
 */
const TagsAutocomplete: React.FC<TagsAutocompleteProps> = ({
  value,
  onChange,
  label = 'Tags',
  placeholder = 'Search tags...',
  error = false,
  helperText,
  disabled = false,
  maxTags = 10,
}) => {
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Load featured/popular tags on mount for initial suggestions
  useEffect(() => {
    const loadFeaturedTags = async () => {
      try {
        const response = await api.get<{ success: boolean; data: Tag[] }>('/tags/featured?limit=15');
        if (response.data) {
          setOptions(response.data);
        }
      } catch (error) {
        console.error('Failed to load featured tags:', error);
      }
    };
    loadFeaturedTags();
  }, []);

  // Debounced search
  const handleInputChange = useCallback((newInputValue: string) => {
    setInputValue(newInputValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (newInputValue.length < 1) {
      // Show featured tags when input is empty
      api.get<{ success: boolean; data: Tag[] }>('/tags/featured?limit=15')
        .then(response => {
          if (response.data) {
            setOptions(response.data);
          }
        })
        .catch(() => {});
      setLoading(false);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const response = await api.get<{ success: boolean; data: Tag[] }>(
          `/tags/search?q=${encodeURIComponent(newInputValue)}&limit=10`
        );
        if (response.data) {
          setOptions(response.data);
        }
      } catch (error) {
        console.error('Tag search failed:', error);
        setOptions([]);
      } finally {
        setLoading(false);
      }
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

  const handleChange = (_: any, newValue: Tag[]) => {
    // Limit to maxTags
    if (newValue.length <= maxTags) {
      onChange(newValue);
    }
  };

  return (
    <Autocomplete
      multiple
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      disabled={disabled || value.length >= maxTags}
      value={value}
      inputValue={inputValue}
      onInputChange={(_, newValue) => handleInputChange(newValue)}
      onChange={handleChange}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, val) => option.id === val.id}
      filterSelectedOptions
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder={value.length >= maxTags ? `Max ${maxTags} tags` : placeholder}
          error={error}
          helperText={helperText || `${value.length}/${maxTags} tags selected`}
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
              color: 'white',
              '& fieldset': {
                borderColor: '#444',
              },
              '&:hover fieldset': {
                borderColor: colors.accent,
              },
              '&.Mui-focused fieldset': {
                borderColor: colors.accent,
              },
            },
            '& .MuiInputLabel-root': {
              color: '#888',
              '&.Mui-focused': {
                color: colors.accent,
              },
            },
            '& .MuiFormHelperText-root': {
              color: '#888',
            },
          }}
        />
      )}
      renderTags={(tagValue, getTagProps) =>
        tagValue.map((option, index) => (
          <Chip
            {...getTagProps({ index })}
            key={option.id}
            label={option.name}
            icon={<LocalOfferIcon sx={{ fontSize: 16 }} />}
            size="small"
            sx={{
              bgcolor: colors.accent,
              color: 'white',
              '& .MuiChip-deleteIcon': {
                color: 'rgba(255, 255, 255, 0.7)',
                '&:hover': {
                  color: 'white',
                },
              },
              '& .MuiChip-icon': {
                color: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          />
        ))
      }
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <LocalOfferIcon sx={{ color: colors.accent, fontSize: 18, mr: 1 }} />
          {option.name}
        </li>
      )}
      noOptionsText={
        inputValue.length < 1
          ? 'Start typing to search tags'
          : 'No matching tags found'
      }
      sx={{
        '& .MuiAutocomplete-listbox': {
          backgroundColor: colors.surface,
          '& li': {
            color: 'white',
            '&:hover': {
              backgroundColor: 'rgba(51, 153, 137, 0.1)',
            },
            '&[aria-selected="true"]': {
              backgroundColor: 'rgba(51, 153, 137, 0.2)',
            },
          },
        },
        '& .MuiAutocomplete-paper': {
          backgroundColor: colors.surface,
          border: '1px solid #444',
        },
        '& .MuiAutocomplete-noOptions': {
          color: '#888',
          backgroundColor: colors.surface,
        },
      }}
    />
  );
};

export default TagsAutocomplete;
