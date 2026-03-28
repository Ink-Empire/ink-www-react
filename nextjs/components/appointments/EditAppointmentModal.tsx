import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ScheduleIcon from '@mui/icons-material/Schedule';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import { colors, modalStyles, inputStyles } from '@/styles/colors';
import { appointmentService } from '@/services/appointmentService';

interface Appointment {
  id: number;
  title: string;
  date: string;
  start?: string | null;
  end?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  price?: string | number | null;
  duration_minutes?: number | null;
  notes?: string | null;
  is_derived?: boolean;
  client?: { id: number; name: string } | null;
  extendedProps?: {
    clientName?: string;
    description?: string;
  };
}

interface EditAppointmentModalProps {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onSaved: () => void;
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: colors.warningDim, color: colors.warning, label: 'Pending' },
  booked: { bg: colors.successDim, color: colors.success, label: 'Confirmed' },
  completed: { bg: colors.accentDim, color: colors.accent, label: 'Completed' },
  cancelled: { bg: colors.tagDim, color: colors.error, label: 'Cancelled' },
};

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

function formatTime(isoTime?: string | null): string {
  if (!isoTime) return '';
  const timePart = isoTime.includes('T') ? isoTime.split('T')[1] : isoTime;
  try {
    const d = new Date(`2000-01-01T${timePart}`);
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return timePart;
  }
}

export default function EditAppointmentModal({ open, appointment, onClose, onSaved }: EditAppointmentModalProps) {
  const [price, setPrice] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Reset form when appointment changes
  React.useEffect(() => {
    if (appointment) {
      setPrice(appointment.price != null ? String(Number(appointment.price)) : '');
      setDurationMinutes(appointment.duration_minutes != null ? String(appointment.duration_minutes) : '');
      setNotes(appointment.notes || '');
      setError('');
    }
  }, [appointment]);

  if (!appointment) return null;

  const status = STATUS_STYLES[appointment.status] || STATUS_STYLES.pending;
  const clientName = appointment.client?.name || appointment.extendedProps?.clientName || '';
  const startTime = appointment.start || appointment.start_time;
  const endTime = appointment.end || appointment.end_time;
  const isDerived = appointment.is_derived === true;

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const data: Record<string, any> = {};
      data.price = price !== '' ? parseFloat(price) : null;
      data.duration_minutes = durationMinutes !== '' ? parseInt(durationMinutes, 10) : null;
      data.notes = notes || null;

      await appointmentService.update(appointment.id, data);
      onSaved();
      onClose();
    } catch {
      setError('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: modalStyles.paper }}
      slotProps={{ backdrop: { sx: modalStyles.backdrop } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: colors.textPrimary }}>
          Edit Appointment
        </Typography>
        <IconButton onClick={onClose} sx={{ color: colors.textMuted }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {/* Appointment header */}
        <Box sx={{
          bgcolor: colors.surface,
          borderRadius: '8px',
          p: 2,
          mb: 3,
        }}>
          <Typography sx={{ fontSize: '1rem', fontWeight: 700, color: colors.textPrimary }}>
            {appointment.title}
          </Typography>
          {appointment.date && (
            <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, mt: 0.5 }}>
              {formatDisplayDate(appointment.date)}
            </Typography>
          )}
          {(startTime || endTime) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <ScheduleIcon sx={{ fontSize: 14, color: colors.textMuted }} />
              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                {formatTime(startTime)}{endTime ? ` - ${formatTime(endTime)}` : ''}
              </Typography>
            </Box>
          )}
          {clientName && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
              <PersonOutlineIcon sx={{ fontSize: 14, color: colors.textMuted }} />
              <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                {clientName}
              </Typography>
            </Box>
          )}
          <Box sx={{
            display: 'inline-block',
            mt: 1,
            px: 1,
            py: 0.25,
            bgcolor: status.bg,
            borderRadius: '4px',
          }}>
            <Typography sx={{ fontSize: '0.6rem', fontWeight: 700, color: status.color, textTransform: 'uppercase' }}>
              {status.label}
            </Typography>
          </Box>
        </Box>

        {/* Editable fields */}
        <Typography sx={{
          fontSize: '0.7rem',
          fontWeight: 600,
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          mb: 1.5,
        }}>
          Appointment Details
        </Typography>

        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>
          Total Price ($){isDerived ? ' *' : ''}
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          placeholder="0.00"
          type="number"
          sx={{ ...inputStyles.textField, mb: 2 }}
        />

        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>
          Duration (minutes){isDerived ? ' *' : ''}
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={durationMinutes}
          onChange={(e) => setDurationMinutes(e.target.value)}
          placeholder="0"
          type="number"
          sx={{ ...inputStyles.textField, mb: isDerived ? 0.5 : 2 }}
        />

        {isDerived && (
          <Typography sx={{ fontSize: '0.7rem', color: colors.textMuted, fontStyle: 'italic', mb: 2 }}>
            * Estimated from calendar time and your hourly rate.
          </Typography>
        )}

        <Typography sx={{ fontSize: '0.8rem', fontWeight: 600, color: colors.textSecondary, mb: 0.5 }}>
          Notes
        </Typography>
        <TextField
          fullWidth
          size="small"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Add private notes about this appointment..."
          multiline
          minRows={3}
          sx={{ ...inputStyles.textField, mb: 0.5 }}
        />
        <Typography sx={{ fontSize: '0.7rem', color: colors.textMuted }}>
          Only visible to you
        </Typography>

        {error && (
          <Typography sx={{ fontSize: '0.8rem', color: colors.error, mt: 1.5 }}>
            {error}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button
          onClick={onClose}
          sx={{
            color: colors.textSecondary,
            textTransform: 'none',
            '&:hover': { color: colors.textPrimary },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={saving}
          sx={{
            bgcolor: colors.accent,
            color: colors.background,
            textTransform: 'none',
            fontWeight: 600,
            px: 3,
            '&:hover': { bgcolor: colors.accentHover },
            '&.Mui-disabled': { bgcolor: colors.accentDim, color: colors.textMuted },
          }}
        >
          {saving ? <CircularProgress size={20} sx={{ color: colors.background }} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
