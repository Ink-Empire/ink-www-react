import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button } from '@mui/material';
import Layout from '@/components/Layout';
import { colors } from '@/styles/colors';

export default function Unsubscribed() {
  return (
    <Layout>
      <Box sx={{ textAlign: 'center', py: 6, px: 2 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, color: colors.textPrimary, mb: 2 }}>
          You've been unsubscribed
        </Typography>
        <Typography sx={{ color: colors.textSecondary, mb: 1, maxWidth: 480, mx: 'auto' }}>
          You will no longer receive marketing emails from InkedIn.
        </Typography>
        <Typography sx={{ color: colors.textMuted, mb: 4, maxWidth: 480, mx: 'auto', fontSize: '0.9rem' }}>
          You'll still receive important account emails like password resets and verification.
        </Typography>
        <Button
          component={Link}
          href="/login"
          variant="contained"
          sx={{
            bgcolor: colors.accent,
            color: colors.textOnLight,
            textTransform: 'none',
            fontWeight: 600,
            borderRadius: '30px',
            px: 4,
            '&:hover': { bgcolor: colors.accentHover },
          }}
        >
          Log in to manage preferences
        </Button>
      </Box>
    </Layout>
  );
}
