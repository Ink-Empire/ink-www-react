import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  TextField,
  Autocomplete,
  CircularProgress,
  Chip,
  Box,
  Typography,
  createFilterOptions,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import { colors, inputStyles } from '@/styles/colors';
import { api } from '@/utils/api';

export interface Tag {
  id: number;
  name: string;
  slug: string;
  is_pending?: boolean;
  // For freeSolo new tag creation
  inputValue?: string;
}

const filter = createFilterOptions<Tag>();

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
 * Features:
 * - Search existing approved tags with autocomplete
 * - Create new custom tags by typing and pressing Enter
 * - New user-created tags are marked as "pending" until approved by admin
 * - Pending tags shown with dotted border to indicate awaiting approval
 *
 * TODO: Add AI-suggested tags based on uploaded images (API endpoint exists: POST /tattoos/{id}/generate-tags)
 *   The AI analyzes the tattoo image and suggests relevant tags automatically.
 *   These could be shown as "Suggested" chips that users can click to add.
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

  // Handle tag selection or creation
  const handleChange = async (_: any, newValue: (Tag | string)[]) => {
    // Limit to maxTags
    if (newValue.length > maxTags) return;

    const processedTags: Tag[] = [];

    for (const item of newValue) {
      if (typeof item === 'string') {
        // User typed a new tag and pressed enter
        const tagName = item.trim();
        if (tagName.length >= 2) {
          try {
            const response = await api.post<{ success: boolean; data: Tag }>('/tags', { name: tagName });
            if (response.data) {
              processedTags.push(response.data);
            }
          } catch (error) {
            console.error('Failed to create tag:', error);
          }
        }
      } else if (item.inputValue) {
        // User selected "Add new tag" option
        const tagName = item.inputValue.trim();
        if (tagName.length >= 2) {
          try {
            const response = await api.post<{ success: boolean; data: Tag }>('/tags', { name: tagName });
            if (response.data) {
              processedTags.push(response.data);
            }
          } catch (error) {
            console.error('Failed to create tag:', error);
          }
        }
      } else {
        // Existing tag selected
        processedTags.push(item);
      }
    }

    onChange(processedTags);
    setInputValue('');
  };

  // Filter options to include "Add new tag" option
  const filterOptions = (options: Tag[], params: any) => {
    const filtered = filter(options, params);
    const { inputValue } = params;

    // Check if the input matches any existing option
    const isExisting = options.some(
      (option) => option.name.toLowerCase() === inputValue.toLowerCase()
    );

    // Add "create new" option if input is valid and doesn't exist
    if (inputValue.length >= 2 && !isExisting) {
      filtered.push({
        id: -1, // Temporary ID for new tag
        name: `Add "${inputValue}"`,
        slug: '',
        inputValue: inputValue,
        is_pending: true,
      });
    }

    return filtered;
  };

  return (
    <Box>
      <Autocomplete
        multiple
        freeSolo
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
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
        filterOptions={filterOptions}
        getOptionLabel={(option) => {
          if (typeof option === 'string') return option;
          if (option.inputValue) return option.inputValue;
          return option.name;
        }}
        isOptionEqualToValue={(option, val) => option.id === val.id}
        filterSelectedOptions
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={value.length >= maxTags ? `Max ${maxTags} tags` : placeholder}
            error={error}
            helperText={helperText || `${value.length}/${maxTags} tags • Type and press Enter to create new tags`}
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
              ...inputStyles.textField,
              '& .MuiFormHelperText-root': {
                color: colors.textMuted,
              },
            }}
          />
        )}
        renderTags={(tagValue, getTagProps) =>
          tagValue.map((option, index) => {
            const isPending = option.is_pending === true;
            return (
              <Chip
                {...getTagProps({ index })}
                key={option.id}
                label={option.name}
                icon={<LocalOfferIcon sx={{ fontSize: 16 }} />}
                size="small"
                sx={{
                  bgcolor: isPending ? 'transparent' : colors.accent,
                  color: isPending ? colors.accent : colors.background,
                  border: isPending ? `1px dashed ${colors.accent}` : 'none',
                  '& .MuiChip-deleteIcon': {
                    color: isPending ? colors.accent : 'rgba(0, 0, 0, 0.6)',
                    '&:hover': {
                      color: isPending ? colors.accentHover : colors.background,
                    },
                  },
                  '& .MuiChip-icon': {
                    color: isPending ? colors.accent : 'rgba(0, 0, 0, 0.7)',
                  },
                }}
              />
            );
          })
        }
        renderOption={(props, option) => (
          <li {...props} key={option.id}>
            {option.inputValue ? (
              <>
                <AddIcon sx={{ color: colors.accent, fontSize: 18, mr: 1 }} />
                <Typography component="span">
                  Add "<strong>{option.inputValue}</strong>"
                </Typography>
                <Typography component="span" sx={{ ml: 1, color: colors.textMuted, fontSize: '0.8em' }}>
                  (pending approval)
                </Typography>
              </>
            ) : (
              <>
                <LocalOfferIcon sx={{ color: colors.accent, fontSize: 18, mr: 1 }} />
                {option.name}
              </>
            )}
          </li>
        )}
        noOptionsText={
          inputValue.length < 2
            ? 'Type at least 2 characters'
            : 'Press Enter to create this tag'
        }
        sx={{
          '& .MuiAutocomplete-listbox': {
            backgroundColor: colors.surface,
            '& li': {
              color: colors.textPrimary,
              '&:hover': {
                backgroundColor: colors.surfaceHover,
              },
              '&[aria-selected="true"]': {
                backgroundColor: colors.accentDim,
              },
            },
          },
          '& .MuiAutocomplete-paper': {
            backgroundColor: colors.surface,
            border: `1px solid ${colors.inputBorder}`,
          },
          '& .MuiAutocomplete-noOptions': {
            color: colors.textMuted,
            backgroundColor: colors.surface,
          },
        }}
      />
      {value.some(t => t.is_pending) && (
        <Typography sx={{ mt: 0.5, fontSize: '0.75rem', color: colors.textMuted, fontStyle: 'italic' }}>
          Tags with dotted borders are pending approval and won't be visible until reviewed.
        </Typography>
      )}
    </Box>
  );
};

export default TagsAutocomplete;
