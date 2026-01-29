import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button } from '@mui/material';
import { colors } from '@/styles/colors';
import { ResponsiveModal } from '../ui/ResponsiveModal';

interface LoginRequiredModalProps {
  open: boolean;
  onClose: () => void;
  message?: string;
}

export function LoginRequiredModal({
  open,
  onClose,
  message = 'Please log in or create an account to book appointments with this artist.'
}: LoginRequiredModalProps) {
  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title="Account Required"
      maxWidth={400}
    >
      <Typography sx={{ color: colors.textSecondary, fontSize: { xs: '0.875rem', sm: '0.95rem' }, lineHeight: 1.6, mb: 3 }}>
        {message}
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1.5 }}>
        <Button
          onClick={onClose}
          sx={{
            flex: 1,
            py: { xs: 1.5, sm: 1.25 },
            minHeight: { xs: 48, sm: 'auto' },
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: { xs: '0.95rem', sm: '0.9rem' },
            fontWeight: 600,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            '&:hover': { borderColor: colors.textSecondary }
          }}
        >
          Cancel
        </Button>
        <Button
          component={Link}
          href="/login"
          sx={{
            flex: 1,
            py: { xs: 1.5, sm: 1.25 },
            minHeight: { xs: 48, sm: 'auto' },
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: { xs: '0.95rem', sm: '0.9rem' },
            fontWeight: 600,
            color: colors.textPrimary,
            border: `1px solid ${colors.border}`,
            '&:hover': { borderColor: colors.accent, color: colors.accent }
          }}
        >
          Log In
        </Button>
        <Button
          component={Link}
          href="/register"
          sx={{
            flex: 1,
            py: { xs: 1.5, sm: 1.25 },
            minHeight: { xs: 48, sm: 'auto' },
            borderRadius: '8px',
            textTransform: 'none',
            fontSize: { xs: '0.95rem', sm: '0.9rem' },
            fontWeight: 600,
            bgcolor: colors.accent,
            color: colors.background,
            '&:hover': { bgcolor: colors.accentHover }
          }}
        >
          Sign Up
        </Button>
      </Box>
    </ResponsiveModal>
  );
}

export default LoginRequiredModal;
