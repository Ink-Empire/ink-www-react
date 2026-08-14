import React from 'react';
import { useRouter } from 'next/router';
import { Box, Switch, FormControlLabel } from '@mui/material';
import { colors } from '@/styles/colors';
import { useDemoMode } from '@/contexts/DemoModeContext';

// Browse pages fetch once per search params, so a flipped toggle needs a
// reload for the new include_demo flag to reach the API.
const RELOAD_PATHS = ['/artists', '/tattoos'];

export default function DemoModeToggle() {
  const router = useRouter();
  const { isDemoMode, isDemoAccount, setDemoMode } = useDemoMode();

  if (isDemoAccount) return null;

  const handleChange = (enabled: boolean) => {
    // Persist synchronously so api.ts sees the new value even across a reload
    localStorage.setItem('inkedin_demo_mode', String(enabled));
    setDemoMode(enabled);
    if (RELOAD_PATHS.some((p) => router.pathname.startsWith(p))) {
      window.location.reload();
    }
  };

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        px: 1.75,
        py: 0.25,
        borderRadius: '999px',
        border: `1px solid ${isDemoMode ? colors.accent : colors.border}`,
        bgcolor: isDemoMode ? colors.accentDim : 'transparent',
        boxShadow: isDemoMode ? `0 0 14px ${colors.accent}66` : 'none',
        transition: 'all 0.2s ease',
      }}
    >
      <FormControlLabel
        control={
          <Switch
            checked={isDemoMode}
            onChange={(e) => handleChange(e.target.checked)}
            size="small"
            sx={{
              '& .MuiSwitch-switchBase.Mui-checked': { color: colors.accent },
              '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: colors.accent },
            }}
          />
        }
        label={isDemoMode ? 'Demo mode is on' : 'View in demo mode'}
        sx={{
          mr: 0,
          '& .MuiFormControlLabel-label': {
            fontSize: '0.85rem',
            fontWeight: isDemoMode ? 600 : 400,
            color: isDemoMode ? colors.accent : colors.textSecondary,
            whiteSpace: 'nowrap',
          },
        }}
      />
    </Box>
  );
}
