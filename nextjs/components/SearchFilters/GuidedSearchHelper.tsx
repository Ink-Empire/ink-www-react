import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, TextField, IconButton } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PublicIcon from '@mui/icons-material/Public';
import MyLocationIcon from '@mui/icons-material/MyLocation';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import { LocationAutocomplete } from './LocationAutocomplete';
import { colors } from '@/styles/colors';

/**
 * Guided Search Helper
 * - Helps novice users search with a 2-step wizard
 * - localStorage persistence for search state
 * - Collapses after first successful use
 * - Non-intrusive for power users
 */

const STORAGE_KEYS = {
  DISMISSED: 'inkedin_guided_search_dismissed',
  HAS_COMPLETED: 'inkedin_guided_search_completed',
  SAVED_STATE: 'inkedin_guided_search_state',
};

interface GuidedSearchHelperProps {
  onApplyFilters: (data: {
    source: string;
    searchText: string;
    locationType: 'anywhere' | 'near_me' | 'custom' | null;
    customLocation: string;
    locationCoords?: { lat: number; lng: number };
    detectedStyles?: string[];
    detectedSubjects?: string[];
    detectedPlacements?: string[];
  }) => void;
  onDismiss?: () => void;
}

type Step = 'intro' | 'location' | 'describe' | 'done';
type LocationType = 'anywhere' | 'near_me' | 'custom' | null;

export const GuidedSearchHelper: React.FC<GuidedSearchHelperProps> = ({
  onApplyFilters,
  onDismiss
}) => {
  const [hasCompletedBefore, setHasCompletedBefore] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const [step, setStep] = useState<Step>('intro');
  const [searchParams, setSearchParams] = useState({
    locationType: null as LocationType,
    customLocation: '',
    locationCoords: undefined as { lat: number; lng: number } | undefined,
    description: '',
  });

  // Initialize from localStorage on mount
  useEffect(() => {
    const hasCompleted = localStorage.getItem(STORAGE_KEYS.HAS_COMPLETED) === 'true';
    const wasDismissed = localStorage.getItem(STORAGE_KEYS.DISMISSED) === 'true';

    setHasCompletedBefore(hasCompleted);

    // If user has completed before, start collapsed
    if (hasCompleted || wasDismissed) {
      setIsExpanded(false);
      setStep('done');
    }

    // Restore any in-progress search
    const savedState = localStorage.getItem(STORAGE_KEYS.SAVED_STATE);
    if (savedState) {
      try {
        const parsed = JSON.parse(savedState);
        setSearchParams(parsed.params);
        if (!hasCompleted && !wasDismissed && parsed.step !== 'done') {
          setStep(parsed.step);
        }
      } catch (e) {
        // Invalid saved state, ignore
      }
    }
  }, []);

  // Persist state changes to localStorage
  useEffect(() => {
    if (step !== 'done') {
      localStorage.setItem(STORAGE_KEYS.SAVED_STATE, JSON.stringify({
        step,
        params: searchParams,
      }));
    }
  }, [step, searchParams]);

  const handleLocationChoice = useCallback((type: LocationType) => {
    setSearchParams(prev => ({ ...prev, locationType: type }));

    if (type === 'anywhere' || type === 'near_me') {
      setStep('describe');
    }
  }, []);

  const handleCustomLocationSubmit = useCallback(() => {
    if (searchParams.customLocation.trim()) {
      setStep('describe');
    }
  }, [searchParams.customLocation]);

  const handleComplete = useCallback(() => {
    const parsed = parseDescription(searchParams.description);

    const searchData = {
      source: 'guided',
      searchText: searchParams.description,
      locationType: searchParams.locationType,
      customLocation: searchParams.customLocation,
      locationCoords: searchParams.locationCoords,
      ...parsed,
    };

    onApplyFilters(searchData);

    // Mark as completed
    localStorage.setItem(STORAGE_KEYS.HAS_COMPLETED, 'true');
    localStorage.removeItem(STORAGE_KEYS.SAVED_STATE);

    setHasCompletedBefore(true);
    setIsExpanded(false);
    setStep('done');
  }, [searchParams, onApplyFilters]);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(STORAGE_KEYS.DISMISSED, 'true');
    localStorage.removeItem(STORAGE_KEYS.SAVED_STATE);

    setIsExpanded(false);
    setStep('done');
    onDismiss?.();
  }, [onDismiss]);

  const handleRestart = useCallback(() => {
    setStep('intro');
    setSearchParams({ locationType: null, customLocation: '', locationCoords: undefined, description: '' });
    setIsExpanded(true);
  }, []);

  const handleBack = useCallback((toStep: Step) => {
    setStep(toStep);
  }, []);

  // Basic parsing - backend does the heavy lifting
  const parseDescription = (text: string) => {
    const lower = text.toLowerCase();

    const styles = ['traditional', 'neotraditional', 'neo-traditional', 'japanese',
      'blackwork', 'minimalist', 'geometric', 'realism', 'watercolor',
      'dotwork', 'linework', 'fine line', 'illustrative', 'tribal',
      'chicano', 'trash polka', 'new school', 'old school'];

    const subjects = ['dragon', 'rose', 'skull', 'snake', 'butterfly', 'lion',
      'eagle', 'wolf', 'phoenix', 'koi', 'tiger', 'owl', 'bear',
      'flower', 'floral', 'portrait', 'mandala', 'compass',
      'anchor', 'ship', 'mountain', 'tree', 'moon', 'sun',
      'heart', 'dagger', 'sword', 'clock', 'eye'];

    const placements = ['sleeve', 'half sleeve', 'full sleeve', 'arm', 'forearm',
      'upper arm', 'shoulder', 'back', 'full back', 'chest',
      'leg', 'thigh', 'calf', 'ankle', 'wrist', 'hand',
      'finger', 'neck', 'behind ear', 'ribs', 'side', 'hip'];

    return {
      detectedStyles: styles.filter(s => lower.includes(s)),
      detectedSubjects: subjects.filter(s => lower.includes(s)),
      detectedPlacements: placements.filter(p => lower.includes(p)),
    };
  };

  const suggestions = [
    'japanese dragon sleeve',
    'minimalist fine line flowers',
    'blackwork geometric',
    'traditional rose'
  ];

  // Collapsed state
  if (!isExpanded) {
    return (
      <Box sx={{
        py: '0.75rem',
        px: '1rem',
        borderBottom: `1px solid ${colors.border}`
      }}>
        <Box
          component="button"
          onClick={handleRestart}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            background: 'transparent',
            border: 'none',
            color: colors.textSecondary,
            fontSize: '0.85rem',
            cursor: 'pointer',
            p: 0,
            fontFamily: 'inherit',
            transition: 'color 0.2s ease',
            '&:hover': { color: colors.accent }
          }}
        >
          <HelpOutlineIcon sx={{ fontSize: '1rem' }} />
          {hasCompletedBefore ? 'Start new guided search' : 'Need help searching?'}
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{
      background: `linear-gradient(to bottom, ${colors.surfaceElevated}, ${colors.surface})`,
      borderBottom: `2px solid ${colors.accent}`,
      p: '1rem',
      position: 'relative'
    }}>
      {/* Intro Step */}
      {step === 'intro' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
            <HelpOutlineIcon sx={{ fontSize: '1.5rem', color: colors.accent, mt: '2px' }} />
            <Box>
              <Typography sx={{
                fontSize: '1rem',
                fontWeight: 600,
                color: colors.textPrimary,
                mb: '0.25rem'
              }}>
                Need help searching?
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                Answer 2 quick questions to find artists
              </Typography>
            </Box>
            <IconButton
              onClick={handleDismiss}
              size="small"
              sx={{
                ml: 'auto',
                color: colors.textSecondary,
                p: '4px',
                '&:hover': { color: colors.textPrimary }
              }}
            >
              <CloseIcon sx={{ fontSize: '1rem' }} />
            </IconButton>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <Box
              component="button"
              onClick={() => setStep('location')}
              sx={{
                bgcolor: colors.accent,
                color: colors.background,
                border: 'none',
                p: '0.875rem 1.25rem',
                borderRadius: '8px',
                fontSize: '0.95rem',
                fontWeight: 600,
                cursor: 'pointer',
                minHeight: '48px',
                fontFamily: 'inherit',
                transition: 'background 0.2s ease',
                '&:hover': { bgcolor: colors.accentHover },
                '&:active': { bgcolor: colors.accentDark }
              }}
            >
              Help me search
            </Box>
            <Box
              component="button"
              onClick={handleDismiss}
              sx={{
                background: 'transparent',
                color: colors.textSecondary,
                border: 'none',
                p: '0.75rem 1rem',
                fontSize: '0.9rem',
                cursor: 'pointer',
                minHeight: '44px',
                fontFamily: 'inherit',
                '&:hover': { color: colors.accent }
              }}
            >
              I'll browse on my own
            </Box>
          </Box>
        </Box>
      )}

      {/* Location Step */}
      {step === 'location' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.textPrimary }}>
              Where are you looking?
            </Typography>
          </Box>

          {searchParams.locationType !== 'custom' ? (
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.625rem'
            }}>
              <Box
                component="button"
                onClick={() => handleLocationChoice('anywhere')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  bgcolor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px',
                  p: '1rem',
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  minHeight: '56px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: colors.accent,
                    bgcolor: colors.surfaceHover
                  }
                }}
              >
                <PublicIcon sx={{ fontSize: '1.25rem', color: colors.accent }} />
                <span>Anywhere</span>
              </Box>
              <Box
                component="button"
                onClick={() => handleLocationChoice('near_me')}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  bgcolor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px',
                  p: '1rem',
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  minHeight: '56px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: colors.accent,
                    bgcolor: colors.surfaceHover
                  }
                }}
              >
                <MyLocationIcon sx={{ fontSize: '1.25rem', color: colors.accent }} />
                <span>Near me</span>
              </Box>
              <Box
                component="button"
                onClick={() => setSearchParams(prev => ({ ...prev, locationType: 'custom' }))}
                sx={{
                  gridColumn: '1 / -1',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  bgcolor: colors.surfaceElevated,
                  border: `1px solid ${colors.border}`,
                  borderRadius: '10px',
                  p: '1rem',
                  color: colors.textPrimary,
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  minHeight: '56px',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: colors.accent,
                    bgcolor: colors.surfaceHover
                  }
                }}
              >
                <SearchIcon sx={{ fontSize: '1.25rem', color: colors.accent }} />
                <span>Search a specific city or region</span>
              </Box>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <LocationAutocomplete
                value={searchParams.customLocation}
                onChange={(location, coords) => setSearchParams(prev => ({
                  ...prev,
                  customLocation: location,
                  locationCoords: coords
                }))}
                placeholder="City, state, or country"
              />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box
                  component="button"
                  onClick={() => setSearchParams(prev => ({ ...prev, locationType: null, customLocation: '', locationCoords: undefined }))}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    background: 'transparent',
                    border: 'none',
                    color: colors.textSecondary,
                    fontSize: '0.9rem',
                    cursor: 'pointer',
                    p: '0.75rem 0',
                    fontFamily: 'inherit',
                    '&:hover': { color: colors.accent }
                  }}
                >
                  <ArrowBackIcon sx={{ fontSize: '1rem' }} />
                  Back
                </Box>
                <Box
                  component="button"
                  onClick={handleCustomLocationSubmit}
                  disabled={!searchParams.customLocation.trim()}
                  sx={{
                    bgcolor: colors.accent,
                    color: colors.background,
                    border: 'none',
                    p: '0.75rem 1.5rem',
                    borderRadius: '8px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    opacity: searchParams.customLocation.trim() ? 1 : 0.4,
                    '&:hover': { bgcolor: colors.accentHover },
                    '&:disabled': { cursor: 'not-allowed' }
                  }}
                >
                  Next
                </Box>
              </Box>
            </Box>
          )}
        </Box>
      )}

      {/* Description Step */}
      {step === 'describe' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.textPrimary }}>
              What are you looking for?
            </Typography>
          </Box>

          <TextField
            fullWidth
            multiline
            rows={2}
            placeholder="e.g., neotraditional owl on the shoulder"
            value={searchParams.description}
            onChange={(e) => setSearchParams(prev => ({
              ...prev,
              description: e.target.value
            }))}
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: colors.surfaceElevated,
                '& fieldset': { borderColor: colors.border },
                '&:hover fieldset': { borderColor: colors.borderLight },
                '&.Mui-focused fieldset': { borderColor: colors.accent }
              },
              '& .MuiInputBase-input': {
                fontSize: '1rem',
                color: colors.textPrimary,
                lineHeight: 1.4,
                '&::placeholder': { color: colors.textMuted, opacity: 1 }
              }
            }}
          />

          {/* Suggestion chips */}
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            mx: '-1rem',
            px: '1rem',
            overflowX: 'auto',
            '&::-webkit-scrollbar': { display: 'none' }
          }}>
            <Typography sx={{
              fontSize: '0.8rem',
              color: colors.textMuted,
              flexShrink: 0
            }}>
              Try:
            </Typography>
            <Box sx={{ display: 'flex', gap: '0.5rem', pr: '1rem' }}>
              {suggestions.map(s => (
                <Box
                  key={s}
                  component="button"
                  onClick={() => setSearchParams(prev => ({ ...prev, description: s }))}
                  sx={{
                    bgcolor: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '100px',
                    py: '0.5rem',
                    px: '0.875rem',
                    fontSize: '0.8rem',
                    color: colors.textSecondary,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    minHeight: '36px',
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: colors.accent,
                      color: colors.accent
                    }
                  }}
                >
                  {s}
                </Box>
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box
              component="button"
              onClick={() => handleBack('location')}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
                background: 'transparent',
                border: 'none',
                color: colors.textSecondary,
                fontSize: '0.9rem',
                cursor: 'pointer',
                p: '0.75rem 0',
                fontFamily: 'inherit',
                '&:hover': { color: colors.accent }
              }}
            >
              <ArrowBackIcon sx={{ fontSize: '1rem' }} />
              Back
            </Box>
            <Box
              component="button"
              onClick={handleComplete}
              disabled={!searchParams.description.trim()}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                bgcolor: colors.accent,
                color: colors.background,
                border: 'none',
                p: '0.75rem 1.5rem',
                borderRadius: '8px',
                fontSize: '0.9rem',
                fontWeight: 600,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.2s ease',
                opacity: searchParams.description.trim() ? 1 : 0.4,
                '&:hover': { bgcolor: colors.accentHover },
                '&:disabled': { cursor: 'not-allowed' }
              }}
            >
              <SearchIcon sx={{ fontSize: '1rem' }} />
              Find Artists
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default GuidedSearchHelper;
