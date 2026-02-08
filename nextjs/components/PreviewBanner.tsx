import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Box, Typography, Button, Tooltip } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { colors } from '@/styles/colors';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { useAuth } from '@/contexts/AuthContext';

export default function PreviewBanner() {
  const router = useRouter();
  const { isDemoMode } = useDemoMode();
  const { isAuthenticated } = useAuth();

  // Only show on browse pages (artists and tattoos)
  const showBannerPages = ['/artists', '/tattoos'];
  const shouldShow = showBannerPages.some(page => router.pathname.startsWith(page));

  if (!shouldShow) {
    return null;
  }

  // Don't show banner for demo users (they already know they're in demo mode)
  if (isDemoMode) {
    return null;
  }

  return (
    <Box
      sx={{
        bgcolor: colors.warningDim,
        borderBottom: `2px solid ${colors.warning}`,
        px: 3,
        py: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Tooltip
          title="Be one of our founding artists and get featured!"
          arrow
          placement="bottom"
        >
          <InfoOutlinedIcon sx={{ color: colors.warning, fontSize: '1.25rem', cursor: 'help' }} />
        </Tooltip>

        <Typography component="span" sx={{ color: colors.textPrimary, fontWeight: 600, fontSize: '0.95rem' }}>
          We're just getting started!
        </Typography>
        <Typography component="span" sx={{ color: colors.textSecondary, fontSize: '0.95rem' }}>
          — Be a founding artist and get featured
        </Typography>
        {!isAuthenticated && (
          <Button
            component={Link}
            href="/register"
            variant="contained"
            size="small"
            sx={{
              bgcolor: colors.accent,
              color: colors.textOnLight,
              textTransform: 'none',
              fontSize: '0.85rem',
              py: 0.25,
              '&:hover': {
                bgcolor: colors.accentHover,
              },
            }}
          >
            Join as an Artist
          </Button>
        )}
      </Box>
    </Box>
  );
}
