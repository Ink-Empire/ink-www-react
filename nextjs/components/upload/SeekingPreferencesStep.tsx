import React from 'react';
import {
  Box, Typography, Stack, Card, CardContent, FormControlLabel,
  Switch, Slider,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  MyLocation as LocationIcon,
} from '@mui/icons-material';
import { colors } from '@/styles/colors';
import { LocationAutocomplete } from '@/components/SearchFilters/LocationAutocomplete';

const timingOptions = [
  { value: 'week', label: 'Next week', description: "I'm ready to book soon" },
  { value: 'month', label: 'Next month', description: 'Planning in the near future' },
  { value: 'year', label: 'Next year', description: 'Thinking ahead' },
] as const;

const radiusMarks = [
  { value: 5, label: '5' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: 200, label: '200' },
];

export interface SeekingPreferences {
  timing: 'week' | 'month' | 'year' | null;
  allowArtistContact: boolean;
  seekingLocation: string;
  locationLatLong: string;
  seekingRadius: number;
  seekingRadiusUnit: string;
}

interface SeekingPreferencesStepProps {
  preferences: SeekingPreferences;
  onChange: (prefs: SeekingPreferences) => void;
}

export function SeekingPreferencesStep({ preferences, onChange }: SeekingPreferencesStepProps) {
  const update = (partial: Partial<SeekingPreferences>) => {
    onChange({ ...preferences, ...partial });
  };

  return (
    <Box sx={{ py: 1 }}>
      {/* Timing */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 1.5, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}
        >
          <ScheduleIcon sx={{ color: colors.accent, fontSize: 20 }} />
          When are you looking to get tattooed?
        </Typography>
        <Stack spacing={1}>
          {timingOptions.map((option) => (
            <Card
              key={option.value}
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                backgroundColor: preferences.timing === option.value ? `${colors.accent}15` : colors.surface,
                border: preferences.timing === option.value
                  ? `2px solid ${colors.accent}`
                  : `2px solid transparent`,
                '&:hover': {
                  border: `2px solid ${preferences.timing === option.value ? colors.accent : colors.textSecondary}`,
                },
              }}
              onClick={() => update({ timing: option.value })}
            >
              <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: preferences.timing === option.value ? 'bold' : 'medium',
                        color: preferences.timing === option.value ? colors.accent : colors.textSecondary,
                      }}
                    >
                      {option.label}
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
                      {option.description}
                    </Typography>
                  </Box>
                  {preferences.timing === option.value && (
                    <Box
                      sx={{
                        width: 20, height: 20, borderRadius: '50%',
                        backgroundColor: colors.accent,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <Typography sx={{ color: colors.textOnLight, fontSize: '12px' }}>
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

      {/* Allow Artist Contact */}
      <Box sx={{ mb: 3 }}>
        <FormControlLabel
          control={
            <Switch
              checked={preferences.allowArtistContact}
              onChange={(e) => update({ allowArtistContact: e.target.checked })}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: colors.accent },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: colors.accent },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ fontWeight: 500, color: colors.textSecondary }}>
              Allow artists in my area to contact me
            </Typography>
          }
        />
      </Box>

      {/* Location */}
      <Box sx={{ mb: 3 }}>
        <Typography
          variant="h6"
          sx={{ mb: 1.5, color: colors.textSecondary, display: 'flex', alignItems: 'center', gap: 1, fontSize: '1rem' }}
        >
          <LocationIcon sx={{ color: colors.accent, fontSize: 20 }} />
          Where are you looking?
        </Typography>
        <LocationAutocomplete
          value={preferences.seekingLocation}
          onChange={(location, coords) => {
            update({
              seekingLocation: location,
              locationLatLong: coords ? `${coords.lat},${coords.lng}` : '',
            });
          }}
          placeholder="City, state, or country"
        />
      </Box>

      {/* Radius */}
      <Box sx={{ mb: 1 }}>
        <Typography variant="body2" sx={{ mb: 1, color: colors.textSecondary, fontWeight: 500 }}>
          Search radius: {preferences.seekingRadius} mi
        </Typography>
        <Slider
          value={preferences.seekingRadius}
          onChange={(_, val) => update({ seekingRadius: val as number })}
          min={5}
          max={200}
          step={5}
          marks={radiusMarks}
          valueLabelDisplay="auto"
          valueLabelFormat={(v) => `${v} mi`}
          sx={{
            color: colors.accent,
            '& .MuiSlider-markLabel': { fontSize: '0.7rem', color: colors.textMuted },
            '& .MuiSlider-thumb': { '&:hover, &.Mui-focusVisible': { boxShadow: `0 0 0 8px ${colors.accent}20` } },
          }}
        />
      </Box>
    </Box>
  );
}
