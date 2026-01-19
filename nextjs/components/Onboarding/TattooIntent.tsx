import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Chip,
  TextField,
  Autocomplete,
  CircularProgress,
  FormControlLabel,
  Switch,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  LocalOffer as TagIcon,
  ContactMail as ContactIcon,
} from '@mui/icons-material';
import { colors } from '@/styles/colors';
import { api } from '@/utils/api';

interface Tag {
  id: number;
  name: string;
  slug: string;
}

// Union type for selected themes - either a tag from the API or a custom string
type ThemeItem = Tag | { id: null; name: string; isCustom: true };

export interface TattooIntentData {
  timing: 'week' | 'month' | 'year' | null;
  selectedTags: number[];
  customThemes: string[];
  description: string;
  allowArtistContact: boolean;
}

interface TattooIntentProps {
  onStepComplete: (intentData: TattooIntentData) => void;
  onBack: () => void;
  selectedStyles: number[]; // From previous step, to show relevant tags
  isModalMode?: boolean; // When true, hides "Not right now" option and contact toggle
}

const timingOptions = [
  { value: 'week', label: 'Next week', description: "I'm ready to book soon" },
  { value: 'month', label: 'Next month', description: 'Planning in the near future' },
  { value: 'year', label: 'Next year', description: 'Thinking ahead' },
  { value: null, label: "Not right now", description: "Just browsing for now" },
] as const;

const TattooIntent: React.FC<TattooIntentProps> = ({
  onStepComplete,
  onBack,
  selectedStyles,
  isModalMode = false,
}) => {
  const [timing, setTiming] = useState<'week' | 'month' | 'year' | null>(null);
  const [showFollowUp, setShowFollowUp] = useState(false);
  const [selectedThemes, setSelectedThemes] = useState<ThemeItem[]>([]);
  const [description, setDescription] = useState('');
  const [allowArtistContact, setAllowArtistContact] = useState(true);
  const modalTitle = isModalMode ? "When are you planning to get a tattoo?" : "Are you planning to get a tattoo?";

  // Tag search state
  const [tagSearchValue, setTagSearchValue] = useState('');
  const [tagOptions, setTagOptions] = useState<Tag[]>([]);
  const [loadingTags, setLoadingTags] = useState(false);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Search tags as user types
  const searchTags = useCallback(async (query: string) => {
    if (!query || query.length < 2) {
      setTagOptions([]);
      return;
    }

    setLoadingTags(true);
    try {
      const response = await api.get<{ success: boolean; data: Tag[] }>(`/tags/search?q=${encodeURIComponent(query)}&limit=10`);
      setTagOptions(response.data || []);
    } catch (err) {
      console.error('Error searching tags:', err);
      setTagOptions([]);
    } finally {
      setLoadingTags(false);
    }
  }, []);

  // Debounced tag search
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    if (tagSearchValue && tagSearchValue.length >= 2) {
      debounceRef.current = setTimeout(() => {
        searchTags(tagSearchValue);
      }, 300);
    } else {
      setTagOptions([]);
    }

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [tagSearchValue, searchTags]);

  const handleTimingSelect = (selectedTiming: 'week' | 'month' | 'year' | null) => {
    setTiming(selectedTiming);
    setShowFollowUp(selectedTiming !== null);
  };

  const handleThemeSelect = (event: React.SyntheticEvent, newValue: Tag | string | null) => {
    if (!newValue) return;

    // Check if it's a string (custom theme typed by user)
    if (typeof newValue === 'string') {
      const trimmed = newValue.trim();
      if (trimmed && !selectedThemes.find(t => t.name.toLowerCase() === trimmed.toLowerCase())) {
        setSelectedThemes([...selectedThemes, { id: null, name: trimmed, isCustom: true }]);
      }
    } else {
      // It's a Tag from the API
      if (!selectedThemes.find(t => t.id === newValue.id)) {
        setSelectedThemes([...selectedThemes, newValue]);
      }
    }
  };

  const handleThemeRemove = (theme: ThemeItem) => {
    if ('isCustom' in theme) {
      // Remove custom theme by name
      setSelectedThemes(selectedThemes.filter(t =>
        !('isCustom' in t) || t.name !== theme.name
      ));
    } else {
      // Remove tag by id
      setSelectedThemes(selectedThemes.filter(t => t.id !== theme.id));
    }
  };

  const handleSubmit = () => {
    // Separate tag IDs from custom themes
    const tagIds: number[] = [];
    const customThemeNames: string[] = [];

    selectedThemes.forEach(theme => {
      if ('isCustom' in theme) {
        customThemeNames.push(theme.name);
      } else {
        tagIds.push(theme.id);
      }
    });

    onStepComplete({
      timing,
      selectedTags: tagIds,
      customThemes: customThemeNames,
      description: description.trim(),
      allowArtistContact,
    });
  };

  const handleSkip = () => {
    // Skip with no lead data
    onStepComplete({
      timing: null,
      selectedTags: [],
      customThemes: [],
      description: '',
      allowArtistContact: false,
    });
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 2,
            fontWeight: 'bold',
            color: colors.textSecondary,
          }}
        >
          Your Tattoo Plans
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 3,
            color: 'text.secondary',
            fontSize: '1.1rem',
            lineHeight: 1.6,
          }}
        >
          Help us connect you with the right artists.
        </Typography>
      </Box>

      <Stack spacing={4}>
        {/* Timing Question */}
        <Box>
          <Typography
            variant="h6"
            sx={{ mb: 2, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 1 }}
          >
            <ScheduleIcon sx={{ color: colors.accent }} />
            {modalTitle}
          </Typography>

          <Stack spacing={1.5}>
            {timingOptions
              .filter((option) => !isModalMode || option.value !== null)
              .map((option) => (
              <Card
                key={option.value ?? 'none'}
                sx={{
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  backgroundColor: timing === option.value ? `${colors.accent}15` : colors.surface,
                  border: timing === option.value
                    ? `2px solid ${colors.accent}`
                    : '2px solid transparent',
                  '&:hover': {
                    border: `2px solid ${timing === option.value ? colors.accent : colors.textSecondary}`,
                  },
                }}
                onClick={() => handleTimingSelect(option.value)}
              >
                <CardContent sx={{ py: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          fontWeight: timing === option.value ? 'bold' : 'medium',
                          color: timing === option.value ? colors.accent : colors.textSecondary,
                        }}
                      >
                        {option.label}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {option.description}
                      </Typography>
                    </Box>
                    {timing === option.value && (
                      <Box
                        sx={{
                          width: 24,
                          height: 24,
                          borderRadius: '50%',
                          backgroundColor: colors.accent,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Typography sx={{ color: colors.textOnLight, fontSize: '14px' }}>
                          ✓
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        </Box>

        {/* Follow-up questions - only shown if timing is selected */}
        {showFollowUp && (
          <>
            {/* Theme/Tags Question */}
            <Box>
              <Typography
                variant="h6"
                sx={{ mb: 2, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <TagIcon sx={{ color: colors.accent }} />
                What themes are you considering?
              </Typography>

              <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                Search for themes (or type your own and press Enter).
              </Typography>

              {/* Tag Autocomplete with freeSolo for custom input */}
              <Autocomplete
                freeSolo
                options={tagOptions}
                getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
                inputValue={tagSearchValue}
                value={null}
                onInputChange={(_, newValue, reason) => {
                  if (reason !== 'reset') {
                    setTagSearchValue(newValue);
                  }
                }}
                onChange={(event, newValue) => {
                  handleThemeSelect(event, newValue);
                  setTagSearchValue('');
                  setTagOptions([]);
                }}
                loading={loadingTags}
                filterOptions={(x) => x} // Disable built-in filtering since we use API search
                clearOnBlur
                isOptionEqualToValue={(option, value) =>
                  typeof option === 'string' || typeof value === 'string'
                    ? option === value
                    : option.id === value.id
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Search or add themes"
                    placeholder="e.g., floral, geometric, memorial..."
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingTags ? <CircularProgress size={20} sx={{ color: colors.accent }} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': { borderColor: 'rgba(232, 219, 197, 0.5)' },
                        '&:hover fieldset': { borderColor: colors.textSecondary },
                        '&.Mui-focused fieldset': { borderColor: colors.accent },
                      },
                      '& .MuiInputLabel-root': {
                        color: colors.textSecondary,
                        '&.Mui-focused': { color: colors.accent },
                      },
                    }}
                  />
                )}
                noOptionsText={
                  tagSearchValue.length < 2
                    ? 'Type at least 2 characters'
                    : `Press Enter to add "${tagSearchValue}"`
                }
              />

              {/* Selected Themes (tags and custom) */}
              {selectedThemes.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {selectedThemes.map((theme, index) => (
                    <Chip
                      key={'isCustom' in theme ? `custom-${theme.name}` : theme.id}
                      label={theme.name}
                      onDelete={() => handleThemeRemove(theme)}
                      sx={{
                        backgroundColor: 'isCustom' in theme ? `${colors.textSecondary}20` : `${colors.accent}20`,
                        color: 'isCustom' in theme ? colors.textSecondary : colors.accent,
                        '& .MuiChip-deleteIcon': {
                          color: 'isCustom' in theme ? colors.textSecondary : colors.accent,
                          '&:hover': { color: 'isCustom' in theme ? colors.textPrimary : colors.accentDark },
                        },
                      }}
                    />
                  ))}
                </Box>
              )}

              {/* Free-form description */}
              <TextField
                label="Describe in your own words"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell us more about what you're envisioning..."
                multiline
                rows={3}
                fullWidth
                sx={{
                  mt: 2,
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'rgba(232, 219, 197, 0.5)' },
                    '&:hover fieldset': { borderColor: colors.textSecondary },
                    '&.Mui-focused fieldset': { borderColor: colors.accent },
                  },
                  '& .MuiInputLabel-root': {
                    color: colors.textSecondary,
                    '&.Mui-focused': { color: colors.accent },
                  },
                }}
              />
            </Box>

            {/* Artist Contact Permission - hidden in modal mode since user obviously wants contact */}
            {!isModalMode && (
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  backgroundColor: `${colors.accent}10`,
                  border: `1px solid ${colors.accent}30`,
                }}
              >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                  <ContactIcon sx={{ color: colors.accent, mt: 0.5 }} />
                  <Box sx={{ flex: 1 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={allowArtistContact}
                          onChange={(e) => setAllowArtistContact(e.target.checked)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': {
                              color: colors.accent,
                            },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                              backgroundColor: colors.accent,
                            },
                          }}
                        />
                      }
                      label={
                        <Typography variant="subtitle1" sx={{ fontWeight: 'medium', color: colors.textSecondary }}>
                          Allow artists in my area to contact me
                        </Typography>
                      }
                    />
                    <Typography variant="body2" sx={{ color: 'text.secondary', ml: 0 }}>
                      Artists matching your interests may reach out with their availability and work samples.
                      You can change this anytime in your settings.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            )}
          </>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={timing === undefined}
            sx={{
              backgroundColor: colors.accent,
              color: colors.textOnLight,
              fontWeight: 'bold',
              minWidth: '150px',
              '&:hover': {
                backgroundColor: colors.accentDark,
              },
              '&:disabled': {
                backgroundColor: colors.border,
                color: colors.textMuted,
              },
            }}
          >
            Continue
          </Button>

          <Button
            variant="outlined"
            onClick={onBack}
            sx={{
              color: colors.textSecondary,
              borderColor: colors.textSecondary,
              minWidth: '80px',
              '&:hover': {
                backgroundColor: 'rgba(232, 219, 197, 0.1)',
                borderColor: colors.textSecondary,
              },
            }}
          >
            Back
          </Button>
        </Box>
      </Stack>
    </Box>
  );
};

export default TattooIntent;
