import React, { useState, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  Box,
  Typography,
  TextField,
  Checkbox,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Slider,
  Switch,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import StyleIcon from '@mui/icons-material/Style';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { useStyles } from '@/contexts/StyleContext';
import { useTags } from '@/contexts/TagContext';
import { useUserData } from '@/contexts/AuthContext';
import { SearchFiltersUIProps } from './types';
import { LocationAutocomplete } from './LocationAutocomplete';
import { colors } from '@/styles/colors';

// Filter Section Component with ref support for external control
interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

export interface FilterSectionRef {
  expand: () => void;
  scrollIntoView: () => void;
}

const FilterSection = forwardRef<FilterSectionRef, FilterSectionProps>(
  ({ title, children, defaultExpanded = true }, ref) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const sectionRef = useRef<HTMLDivElement>(null);

    useImperativeHandle(ref, () => ({
      expand: () => setIsExpanded(true),
      scrollIntoView: () => {
        setIsExpanded(true);
        setTimeout(() => {
          sectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }));

    return (
      <Box
        ref={sectionRef}
        sx={{
          borderBottom: `1px solid ${colors.border}`,
          pb: 0.5,
          mb: 0.5,
          '&:last-child': { borderBottom: 'none' }
        }}
      >
        <Box
          onClick={() => setIsExpanded(!isExpanded)}
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            py: '0.75rem',
            cursor: 'pointer',
            userSelect: 'none',
            '&:hover h3': { color: colors.textPrimary }
          }}
        >
          <Typography
            component="h3"
            sx={{
              fontSize: '0.8rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: colors.textSecondary,
              transition: 'color 0.2s ease'
            }}
          >
            {title}
          </Typography>
          <ExpandMoreIcon
            sx={{
              color: colors.textSecondary,
              fontSize: '1rem',
              transition: 'transform 0.2s ease',
              transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)'
            }}
          />
        </Box>
        {isExpanded && (
          <Box sx={{ pb: '0.75rem' }}>
            {children}
          </Box>
        )}
      </Box>
    );
  }
);

export const SearchFiltersContent: React.FC<SearchFiltersUIProps> = ({
  type,
  searchString,
  selectedStyles,
  selectedTags,
  distance,
  distanceUnit,
  useMyLocation,
  useAnyLocation,
  applySavedStyles,
  booksOpen,
  location,
  geoLoading,
  geoError,
  onSearchChange,
  onApplySavedStylesChange,
  onBooksOpenChange,
  onStyleChange,
  onTagChange,
  onDistanceChange,
  onDistanceUnitChange,
  onLocationOptionChange,
  onLocationChange,
  onLocationSelect,
  onClearFilters,
}) => {
  const { styles, loading: stylesLoading } = useStyles();
  const { tags, loading: tagsLoading } = useTags();
  const me = useUserData();
  const [styleSearch, setStyleSearch] = useState('');
  const [tagSearch, setTagSearch] = useState('');

  // Refs for quick jump links
  const stylesSectionRef = useRef<FilterSectionRef>(null);
  const tagsSectionRef = useRef<FilterSectionRef>(null);

  // Filter styles based on search
  const filteredStyles = useMemo(() => {
    if (!styleSearch.trim()) return styles;
    const search = styleSearch.toLowerCase();
    return styles.filter(style =>
      style.name.toLowerCase().includes(search)
    );
  }, [styles, styleSearch]);

  // Get display tags - show 10 most popular (by tattoos_count) or 10 random if no popularity data
  const displayTags = useMemo(() => {
    if (!tags || tags.length === 0) return [];

    // Check if we have popularity data
    const hasPopularityData = tags.some(tag => tag.tattoos_count && tag.tattoos_count > 0);

    if (hasPopularityData) {
      // Sort by tattoos_count descending and take top 10
      return [...tags]
        .sort((a, b) => (b.tattoos_count || 0) - (a.tattoos_count || 0))
        .slice(0, 10);
    } else {
      // Return 10 random tags
      const shuffled = [...tags].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 10);
    }
  }, [tags]);

  // Filter tags based on search - search through ALL tags, not just display tags
  const filteredTags = useMemo(() => {
    if (!tagSearch.trim()) return displayTags;
    const search = tagSearch.toLowerCase();
    return tags.filter(tag =>
      tag.name.toLowerCase().includes(search)
    ).slice(0, 15); // Limit to 15 results in search
  }, [tags, displayTags, tagSearch]);

  // Search hints
  const searchHints = type === 'artists'
    ? ['wolf', 'floral', 'traditional', 'realism']
    : ['dragon', 'rose', 'sleeve', 'minimalist'];

  const handleSearchHintClick = (hint: string) => {
    const event = { target: { value: hint } } as React.ChangeEvent<HTMLInputElement>;
    onSearchChange(event);
  };

  const handleClearSearch = () => {
    const event = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
    onSearchChange(event);
  };

  // Handle distance slider change
  const handleDistanceSliderChange = (_: Event, newValue: number | number[]) => {
    const value = Array.isArray(newValue) ? newValue[0] : newValue;
    const event = { target: { value: value.toString() } } as React.ChangeEvent<HTMLSelectElement>;
    onDistanceChange(event);
  };

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      overflowY: 'auto',
      display: 'flex',
      flexDirection: 'column',
      '&::-webkit-scrollbar': { width: 6 },
      '&::-webkit-scrollbar-track': { background: 'transparent' },
      '&::-webkit-scrollbar-thumb': {
        background: colors.background,
        borderRadius: 3
      }
    }}>
      {/* Search Section */}
      <FilterSection title="Search">
        <Box sx={{ position: 'relative', mb: 0.5 }}>
          <SearchIcon sx={{
            position: 'absolute',
            left: '0.875rem',
            top: '50%',
            transform: 'translateY(-50%)',
            width: 16,
            height: 16,
            color: colors.textSecondary
          }} />
          <TextField
            fullWidth
            placeholder="Search..."
            value={searchString}
            onChange={onSearchChange}
            size="small"
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: colors.background,
                pl: '2.5rem',
                '& fieldset': { borderColor: `${colors.textPrimary}1A` },
                '&:hover fieldset': { borderColor: `${colors.textPrimary}1A` },
                '&.Mui-focused fieldset': { borderColor: colors.accent }
              },
              '& .MuiInputBase-input': {
                fontSize: '0.9rem',
                color: colors.textPrimary,
                '&::placeholder': { color: colors.textSecondary, opacity: 1 }
              }
            }}
            InputProps={{
              sx: { pl: 0 },
              endAdornment: searchString ? (
                <ClearIcon
                  onClick={handleClearSearch}
                  sx={{
                    fontSize: 18,
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    transition: 'color 0.15s ease',
                    '&:hover': { color: colors.textPrimary }
                  }}
                />
              ) : null
            }}
          />
        </Box>

        {/* Search Hints */}
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', mt: '0.6rem', alignItems: 'center' }}>
          <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, mr: '0.25rem' }}>
            Try:
          </Typography>
          {searchHints.map((hint) => (
            <Box
              key={hint}
              onClick={() => handleSearchHintClick(hint)}
              sx={{
                px: '0.6rem',
                py: '0.25rem',
                bgcolor: colors.background,
                border: `1px solid ${colors.textPrimary}1A`,
                borderRadius: '100px',
                fontSize: '0.75rem',
                color: colors.textSecondary,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                '&:hover': {
                  borderColor: colors.accent,
                  color: colors.accent,
                  bgcolor: `${colors.accent}1A`
                }
              }}
            >
              {hint}
            </Box>
          ))}
        </Box>
        <Typography sx={{
          fontSize: '0.75rem',
          color: colors.textSecondary,
          mt: '0.5rem',
          fontStyle: 'italic'
        }}>
          Search by {type === 'artists' ? 'artist, studio, or subject matter' : 'artist, description, or tags'}
        </Typography>

        {/* Quick Jump Links */}
        <Box sx={{
          display: 'flex',
          gap: '0.5rem',
          mt: '0.75rem',
          pt: '0.75rem',
          borderTop: `1px solid ${colors.textPrimary}1A`,
        }}>
          <Box
            onClick={() => stylesSectionRef.current?.scrollIntoView()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              px: '0.75rem',
              py: '0.4rem',
              bgcolor: colors.background,
              border: `1px solid ${colors.textPrimary}1A`,
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: colors.textSecondary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: colors.accent,
                color: colors.accent,
                bgcolor: `${colors.accent}1A`
              }
            }}
          >
            <StyleIcon sx={{ fontSize: '0.9rem' }} />
            Search by style
          </Box>
          <Box
            onClick={() => tagsSectionRef.current?.scrollIntoView()}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              px: '0.75rem',
              py: '0.4rem',
              bgcolor: colors.background,
              border: `1px solid ${colors.textPrimary}1A`,
              borderRadius: '6px',
              fontSize: '0.8rem',
              color: colors.textSecondary,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              '&:hover': {
                borderColor: colors.accent,
                color: colors.accent,
                bgcolor: `${colors.accent}1A`
              }
            }}
          >
            <LocalOfferIcon sx={{ fontSize: '0.9rem' }} />
            Search by subject
          </Box>
        </Box>
      </FilterSection>

      {/* Location Section */}
      <FilterSection title="Location">
        <RadioGroup
          value={useAnyLocation ? 'any' : useMyLocation ? 'my' : 'custom'}
          onChange={(e) => onLocationOptionChange(e.target.value as 'my' | 'custom' | 'any')}
        >
          {[
            { value: 'any', label: 'Anywhere' },
            { value: 'my', label: 'Near me' },
            { value: 'custom', label: 'Custom location' }
          ].map((option) => (
            <FormControlLabel
              key={option.value}
              value={option.value}
              control={
                <Radio
                  size="small"
                  sx={{
                    color: colors.textSecondary,
                    '&.Mui-checked': { color: colors.accent }
                  }}
                />
              }
              label={
                <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
                  {option.label}
                </Typography>
              }
              sx={{
                m: 0,
                p: '0.6rem 0.75rem',
                borderRadius: '6px',
                transition: 'background 0.15s ease',
                '&:hover': { bgcolor: colors.background }
              }}
            />
          ))}
        </RadioGroup>

        {/* Custom Location Input with Autocomplete */}
        {!useMyLocation && !useAnyLocation && (
          <Box sx={{ mt: 0.5, pl: '2rem' }}>
            <LocationAutocomplete
              value={location}
              onChange={onLocationSelect}
              error={geoError}
            />
          </Box>
        )}
      </FilterSection>

      {/* Distance Section - Only show when location-based filtering is active */}
      {(useMyLocation || (!useMyLocation && !useAnyLocation)) && (
        <FilterSection title="Distance">
          <Box sx={{ px: 0.5 }}>
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.85rem',
              color: colors.textSecondary,
              mb: 0.5
            }}>
              <span>Within</span>
              <span>
                <Box component="span" sx={{ color: colors.accent, fontWeight: 500 }}>
                  {distance || 50}
                </Box>
                {' '}{distanceUnit}
              </span>
            </Box>
            <Slider
              value={distance || 50}
              onChange={handleDistanceSliderChange}
              min={5}
              max={200}
              sx={{
                color: colors.accent,
                '& .MuiSlider-track': { bgcolor: colors.accent },
                '& .MuiSlider-rail': { bgcolor: colors.background },
                '& .MuiSlider-thumb': {
                  bgcolor: colors.accent,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: `0 0 0 8px ${colors.accent}33`
                  }
                }
              }}
            />
            {/* Unit Toggle */}
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              {['mi', 'km'].map((unit) => (
                <Box
                  key={unit}
                  onClick={() => onDistanceUnitChange(unit as 'mi' | 'km')}
                  sx={{
                    px: 1.5,
                    py: 0.5,
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                    ...(distanceUnit === unit ? {
                      bgcolor: colors.accent,
                      color: colors.background,
                      fontWeight: 500
                    } : {
                      bgcolor: colors.background,
                      color: colors.textSecondary,
                      '&:hover': { color: colors.textPrimary }
                    })
                  }}
                >
                  {unit}
                </Box>
              ))}
            </Box>
          </Box>
        </FilterSection>
      )}

      {/* Styles Section */}
      <FilterSection title="Styles" ref={stylesSectionRef}>
        {/* Style Search */}
        <TextField
          fullWidth
          placeholder="Filter styles..."
          value={styleSearch}
          onChange={(e) => setStyleSearch(e.target.value)}
          size="small"
          sx={{
            mb: '0.75rem',
            '& .MuiOutlinedInput-root': {
              bgcolor: colors.background,
              '& fieldset': { borderColor: `${colors.textPrimary}1A` },
              '&:hover fieldset': { borderColor: `${colors.textPrimary}1A` },
              '&.Mui-focused fieldset': { borderColor: colors.accent }
            },
            '& .MuiInputBase-input': {
              fontSize: '0.85rem',
              color: colors.textPrimary,
              '&::placeholder': { color: colors.textSecondary, opacity: 1 }
            }
          }}
        />

        {/* Scrollable Styles List */}
        <Box sx={{
          maxHeight: 280,
          overflowY: 'auto',
          mr: '-0.5rem',
          pr: '0.5rem',
          '&::-webkit-scrollbar': { width: 5 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: colors.background,
            borderRadius: 3,
            '&:hover': { background: colors.textSecondary }
          }
        }}>
          {stylesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : filteredStyles.length === 0 ? (
            <Typography sx={{
              fontSize: '0.85rem',
              color: colors.textSecondary,
              textAlign: 'center',
              py: '1rem'
            }}>
              No styles match your search
            </Typography>
          ) : (
            filteredStyles.map((style) => (
              <Box
                key={style.id}
                onClick={() => onStyleChange(style.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  p: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  '&:hover': { bgcolor: colors.background }
                }}
              >
                <Checkbox
                  checked={selectedStyles.includes(style.id)}
                  size="small"
                  sx={{
                    p: 0,
                    color: colors.textSecondary,
                    '&.Mui-checked': { color: colors.accent }
                  }}
                />
                <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary, flex: 1 }}>
                  {style.name}
                </Typography>
              </Box>
            ))
          )}
        </Box>
      </FilterSection>

      {/* Tags Section */}
      <FilterSection title="Tags" defaultExpanded={false} ref={tagsSectionRef}>
        {/* Tag Search */}
        <TextField
          fullWidth
          placeholder="Search tags..."
          value={tagSearch}
          onChange={(e) => setTagSearch(e.target.value)}
          size="small"
          sx={{
            mb: '0.75rem',
            '& .MuiOutlinedInput-root': {
              bgcolor: colors.background,
              '& fieldset': { borderColor: `${colors.textPrimary}1A` },
              '&:hover fieldset': { borderColor: `${colors.textPrimary}1A` },
              '&.Mui-focused fieldset': { borderColor: colors.accent }
            },
            '& .MuiInputBase-input': {
              fontSize: '0.85rem',
              color: colors.textPrimary,
              '&::placeholder': { color: colors.textSecondary, opacity: 1 }
            }
          }}
        />

        {/* Scrollable Tags List */}
        <Box sx={{
          maxHeight: 280,
          overflowY: 'auto',
          mr: '-0.5rem',
          pr: '0.5rem',
          '&::-webkit-scrollbar': { width: 5 },
          '&::-webkit-scrollbar-track': { background: 'transparent' },
          '&::-webkit-scrollbar-thumb': {
            background: colors.background,
            borderRadius: 3,
            '&:hover': { background: colors.textSecondary }
          }
        }}>
          {tagsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
              <CircularProgress size={20} />
            </Box>
          ) : filteredTags.length === 0 ? (
            <Typography sx={{
              fontSize: '0.85rem',
              color: colors.textSecondary,
              textAlign: 'center',
              py: '1rem'
            }}>
              {tagSearch.trim() ? 'No tags match your search' : 'No tags available'}
            </Typography>
          ) : (
            filteredTags.map((tag) => (
              <Box
                key={tag.id}
                onClick={() => onTagChange(tag.id)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  p: '0.6rem 0.75rem',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  transition: 'background 0.15s ease',
                  '&:hover': { bgcolor: colors.background }
                }}
              >
                <Checkbox
                  checked={selectedTags.includes(tag.id)}
                  size="small"
                  sx={{
                    p: 0,
                    color: colors.textSecondary,
                    '&.Mui-checked': { color: colors.accent }
                  }}
                />
                <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary, flex: 1 }}>
                  {tag.name}
                </Typography>
                {tag.tattoos_count !== undefined && tag.tattoos_count > 0 && (
                  <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                    {tag.tattoos_count}
                  </Typography>
                )}
              </Box>
            ))
          )}
        </Box>
      </FilterSection>

      {/* Availability Section */}
      <FilterSection title="Availability">
        {/* Books Open Toggle */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          py: '0.75rem'
        }}>
          <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
            Books open
          </Typography>
          <Switch
            checked={booksOpen}
            onChange={onBooksOpenChange}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase': {
                '&.Mui-checked': {
                  color: colors.accent,
                  '& + .MuiSwitch-track': { bgcolor: colors.accent }
                }
              },
              '& .MuiSwitch-track': { bgcolor: colors.background }
            }}
          />
        </Box>

        {/* Apply Saved Styles Toggle */}
        {me?.styles && me.styles.length > 0 && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: '0.75rem'
          }}>
            <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
              Use my saved styles
            </Typography>
            <Switch
              checked={applySavedStyles}
              onChange={onApplySavedStylesChange}
              size="small"
              sx={{
                '& .MuiSwitch-switchBase': {
                  '&.Mui-checked': {
                    color: colors.accent,
                    '& + .MuiSwitch-track': { bgcolor: colors.accent }
                  }
                },
                '& .MuiSwitch-track': { bgcolor: colors.background }
              }}
            />
          </Box>
        )}
      </FilterSection>
    </Box>
  );
};
