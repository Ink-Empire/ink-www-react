import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Paper } from '@mui/material';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { colors } from '@/styles/colors';
import { useAuth } from '@/contexts/AuthContext';

interface EmptyStateFoundingArtistProps {
  searchComponent?: React.ReactNode;
}

export default function EmptyStateFoundingArtist({ searchComponent }: EmptyStateFoundingArtistProps) {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ width: '100%' }}>
      {searchComponent && (
        <Box sx={{ mb: 4 }}>
          {searchComponent}
        </Box>
      )}

      <Paper
        elevation={0}
        sx={{
          bgcolor: colors.warningDim,
          border: `2px solid ${colors.warning}`,
          borderRadius: 2,
          p: 4,
          textAlign: 'center',
          maxWidth: 480,
          mx: 'auto',
        }}
      >
        <RocketLaunchOutlinedIcon
          sx={{
            color: colors.warning,
            fontSize: '2.5rem',
            mb: 2,
          }}
        />

        <Typography
          variant="h5"
          sx={{
            color: colors.textPrimary,
            fontWeight: 600,
            mb: 1.5,
          }}
        >
          We're just getting started!
        </Typography>

        <Typography
          sx={{
            color: colors.textSecondary,
            mb: 3,
            lineHeight: 1.6,
            fontSize: '1rem',
          }}
        >
          Be one of our founding artists and get featured.
          <br />
          Early members get premium visibility.
        </Typography>

        {!isAuthenticated && (
          <Button
            component={Link}
            href="/register"
            variant="contained"
            size="large"
            sx={{
              bgcolor: colors.accent,
              color: colors.textOnLight,
              textTransform: 'none',
              px: 4,
              py: 1.25,
              fontSize: '1rem',
              fontWeight: 500,
              mb: 2,
              '&:hover': {
                bgcolor: colors.accentHover,
              },
            }}
          >
            Join as an Artist
          </Button>
        )}

        {/* FAQ Link */}
        <Box sx={{ mt: 3, pt: 2, borderTop: `1px solid ${colors.warning}40` }}>
          <Button
            component={Link}
            href="/faq"
            startIcon={<HelpOutlineIcon sx={{ fontSize: '1rem' }} />}
            sx={{
              color: colors.textMuted,
              textTransform: 'none',
              fontSize: '0.8rem',
              '&:hover': {
                color: colors.textSecondary,
                bgcolor: 'transparent',
              },
            }}
          >
            Learn how search and discovery works
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
