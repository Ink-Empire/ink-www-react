import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { colors } from '@/styles/colors';
import { ResponsiveModal } from '../ui/ResponsiveModal';

interface BookingConfig {
  title: string;
  modalDescription: (artistName: string) => string;
  modalDuration: string;
  modalCost: string;
}

interface BookingConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedDate: string | null;
  artistName: string;
  config: BookingConfig;
  formatDateForDisplay: (date: string) => string;
}

export function BookingConfirmModal({
  open,
  onClose,
  onConfirm,
  selectedDate,
  artistName,
  config,
  formatDateForDisplay,
}: BookingConfirmModalProps) {
  return (
    <ResponsiveModal
      open={open}
      onClose={onClose}
      title={selectedDate ? formatDateForDisplay(selectedDate) : ''}
      subtitle={
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.5,
          bgcolor: `${colors.accent}1A`,
          color: colors.accent,
          px: 1,
          py: 0.5,
          borderRadius: '100px',
          fontSize: '0.75rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          mt: 0.5
        }}>
          {config.title}
        </Box>
      }
      maxWidth={440}
    >
      <Typography sx={{ color: colors.textSecondary, fontSize: { xs: '0.875rem', sm: '0.95rem' }, lineHeight: 1.6, mb: 2 }}>
        {config.modalDescription(artistName)}
      </Typography>

      <Box sx={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 1.5,
        bgcolor: colors.background,
        borderRadius: '10px',
        p: 1.5,
        mb: 2
      }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>
            Duration
          </Typography>
          <Typography sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: 600, color: colors.textPrimary }}>
            {config.modalDuration}
          </Typography>
        </Box>
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>
            Cost
          </Typography>
          <Typography sx={{ fontSize: { xs: '1rem', sm: '1.1rem' }, fontWeight: 600, color: colors.accent }}>
            {config.modalCost}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1.5 }}>
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
          onClick={onConfirm}
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
          Request Booking
        </Button>
      </Box>
    </ResponsiveModal>
  );
}

export default BookingConfirmModal;
