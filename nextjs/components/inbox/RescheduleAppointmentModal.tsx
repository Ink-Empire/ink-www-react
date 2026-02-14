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
import UpdateIcon from '@mui/icons-material/Update';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '@/styles/colors';

interface RescheduleAppointmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (proposedDate: string, proposedStartTime: string, proposedEndTime: string, reason?: string) => Promise<void>;
  clientName?: string;
}

export function RescheduleAppointmentModal({
  open,
  onClose,
  onSubmit,
  clientName,
}: RescheduleAppointmentModalProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split('T')[0];

  const [proposedDate, setProposedDate] = useState(defaultDate);
  const [proposedStartTime, setProposedStartTime] = useState('14:00');
  const [proposedEndTime, setProposedEndTime] = useState('16:00');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!proposedDate || !proposedStartTime || !proposedEndTime) return;
    setSubmitting(true);
    try {
      await onSubmit(proposedDate, proposedStartTime, proposedEndTime, reason.trim() || undefined);
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

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      bgcolor: colors.background,
      '& fieldset': { borderColor: colors.borderSubtle },
      '&:hover fieldset': { borderColor: colors.borderLight },
      '&.Mui-focused fieldset': { borderColor: colors.accent },
    },
    '& .MuiInputBase-input': { color: colors.textPrimary },
    '& .MuiInputLabel-root': { color: colors.textMuted },
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
          <UpdateIcon sx={{ color: colors.accent }} />
          Reschedule Appointment
        </Box>
        <IconButton onClick={handleClose} disabled={submitting} sx={{ color: colors.textMuted }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', mb: 2 }}>
          Propose a new date and time{clientName ? ` for ${clientName}` : ''}. They can accept or decline.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
          <TextField
            label="Proposed Date"
            type="date"
            value={proposedDate}
            onChange={(e) => setProposedDate(e.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
            sx={inputSx}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Time"
              type="time"
              value={proposedStartTime}
              onChange={(e) => setProposedStartTime(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
            <TextField
              label="End Time"
              type="time"
              value={proposedEndTime}
              onChange={(e) => setProposedEndTime(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={inputSx}
            />
          </Box>
          <TextField
            label="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let the client know why..."
            fullWidth
            multiline
            rows={2}
            sx={inputSx}
          />
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button
          onClick={handleClose}
          disabled={submitting}
          sx={{ color: colors.textSecondary, textTransform: 'none' }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || !proposedDate || !proposedStartTime || !proposedEndTime}
          variant="contained"
          sx={{
            bgcolor: colors.accent,
            color: colors.background,
            textTransform: 'none',
            '&:hover': { bgcolor: colors.accentHover },
            '&.Mui-disabled': { bgcolor: colors.accent, opacity: 0.7 },
          }}
        >
          {submitting ? (
            <CircularProgress size={20} sx={{ color: colors.background }} />
          ) : (
            'Send Reschedule Request'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default RescheduleAppointmentModal;
