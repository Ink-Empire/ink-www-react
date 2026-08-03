import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
  TextField,
  IconButton,
  CircularProgress,
  Typography,
} from '@mui/material';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '@/styles/colors';

interface CancelAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (reason?: string) => Promise<void>;
  clientName?: string;
}

export function CancelAppointmentModal({
  open,
  onClose,
  onSubmit,
  clientName,
}: CancelAppointmentModalProps) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit(reason.trim() || undefined);
      setReason('');
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setReason('');
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colors.surface,
          border: `1px solid ${colors.borderSubtle}`,
          borderRadius: '12px',
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: colors.textPrimary }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventBusyIcon sx={{ color: colors.error }} />
          Cancel Appointment
        </Box>
        <IconButton onClick={handleClose} disabled={submitting} sx={{ color: colors.textMuted }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', mb: 2 }}>
          This will cancel the appointment{clientName ? ` with ${clientName}` : ''} and notify them.
        </Typography>
        <TextField
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Let the client know why..."
          fullWidth
          multiline
          rows={3}
          sx={{
            '& .MuiOutlinedInput-root': {
              bgcolor: colors.background,
              '& fieldset': { borderColor: colors.borderSubtle },
              '&:hover fieldset': { borderColor: colors.borderLight },
              '&.Mui-focused fieldset': { borderColor: colors.accent },
            },
            '& .MuiInputBase-input': { color: colors.textPrimary },
            '& .MuiInputLabel-root': { color: colors.textMuted },
          }}
        />
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          sx={{ color: colors.textSecondary, textTransform: 'none' }}
        >
          Keep Appointment
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting}
          variant="contained"
          sx={{
            bgcolor: colors.error,
            color: 'white',
            textTransform: 'none',
            '&:hover': { bgcolor: '#d32f2f' },
            '&.Mui-disabled': { bgcolor: colors.error, opacity: 0.7 },
          }}
        >
          {submitting ? (
            <CircularProgress size={20} sx={{ color: 'white' }} />
          ) : (
            'Cancel Appointment'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CancelAppointmentModal;
