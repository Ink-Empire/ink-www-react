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
  const { isDemoMode, toggleDemoMode } = useDemoMode();
  const { isAuthenticated } = useAuth();

  // Only show on browse pages (artists and tattoos)
  const showBannerPages = ['/artists', '/tattoos'];
  const shouldShow = showBannerPages.some(page => router.pathname.startsWith(page));

  if (!shouldShow) {
    return null;
  }

  return (
    <Box
      sx={{
        bgcolor: isDemoMode ? colors.infoDim : colors.warningDim,
        borderBottom: `2px solid ${isDemoMode ? colors.info : colors.warning}`,
        px: 3,
        py: 1.5,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap', gap: 1.5 }}>
        <Tooltip
          title={isDemoMode
            ? "You're viewing sample artists to preview the platform"
            : "Be one of our founding artists and get featured!"
          }
          arrow
          placement="bottom"
        >
          <InfoOutlinedIcon sx={{ color: isDemoMode ? colors.info : colors.warning, fontSize: '1.25rem', cursor: 'help' }} />
        </Tooltip>

        {isDemoMode ? (
          <>
            <Typography component="span" sx={{ color: colors.textPrimary, fontWeight: 600, fontSize: '0.95rem' }}>
              Preview Mode
            </Typography>
            <Typography component="span" sx={{ color: colors.textMuted, fontSize: '0.95rem' }}>
              —
            </Typography>
            <Typography component="span" sx={{ color: colors.textSecondary, fontSize: '0.95rem' }}>
              Exploring with sample artists
            </Typography>
            <Button
              onClick={toggleDemoMode}
              variant="outlined"
              size="small"
              sx={{
                ml: 1,
                color: colors.info,
                borderColor: colors.info,
                textTransform: 'none',
                fontSize: '0.85rem',
                py: 0.25,
                '&:hover': {
                  bgcolor: colors.infoDim,
                  borderColor: colors.info,
                },
              }}
            >
              View Live Site
            </Button>
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
          </>
        ) : (
          <>
            <Typography component="span" sx={{ color: colors.textPrimary, fontWeight: 600, fontSize: '0.95rem' }}>
              Live Site
            </Typography>
            <Typography component="span" sx={{ color: colors.textSecondary, fontSize: '0.95rem' }}>
              — We're just getting started!
            </Typography>
            <Button
              onClick={toggleDemoMode}
              variant="outlined"
              size="small"
              sx={{
                ml: 1,
                color: colors.warning,
                borderColor: colors.warning,
                textTransform: 'none',
                fontSize: '0.85rem',
                py: 0.25,
                '&:hover': {
                  bgcolor: colors.warningDim,
                  borderColor: colors.warning,
                },
              }}
            >
              View Sample Artists
            </Button>
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
          </>
        )}
      </Box>
    </Box>
  );
}
