import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InboxIcon from '@mui/icons-material/Inbox';
import { useArtistInbox } from '../hooks/useArtistInbox';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import AppointmentCard from './AppointmentCard';

interface ArtistInboxProps {
  artistId?: number;
}

const ArtistInbox: React.FC<ArtistInboxProps> = ({ artistId }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useDialog();
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  // Use the user's ID as artist ID if not provided
  const effectiveArtistId = artistId || user?.id;

  const {
    appointments,
    loading,
    error,
    refreshInbox,
    updateAppointmentStatus
  } = useArtistInbox(effectiveArtistId);

  const handleAcceptAppointment = async (appointmentId: number) => {
    const confirmed = await showConfirm(
      'Are you sure you want to accept this appointment request?',
      'Accept Appointment'
    );

    if (!confirmed) return;

    setActionLoading(appointmentId);
    try {
      const success = await updateAppointmentStatus(appointmentId, 'booked');
      if (success) {
        showSuccess('Appointment accepted successfully!', 'Success');
      }
    } catch (error) {
      showError('Failed to accept appointment', 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineAppointment = async (appointmentId: number) => {
    const confirmed = await showConfirm(
      'Are you sure you want to decline this appointment request? This action cannot be undone.',
      'Decline Appointment'
    );

    if (!confirmed) return;

    setActionLoading(appointmentId);
    try {
      const success = await updateAppointmentStatus(appointmentId, 'cancelled');
      if (success) {
        showSuccess('Appointment declined', 'Request Declined');
      }
    } catch (error) {
      showError('Failed to decline appointment', 'Error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefresh = async () => {
    await refreshInbox();
  };

  if (!effectiveArtistId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning">
          Artist ID not found. Please make sure you are logged in as an artist.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <InboxIcon sx={{ fontSize: 32, color: '#339989' }} />
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            Inbox
          </Typography>
          {appointments.length > 0 && (
            <Typography variant="body1" sx={{ color: '#888' }}>
              ({appointments.length} pending request{appointments.length !== 1 ? 's' : ''})
            </Typography>
          )}
        </Box>
        
        <Button
          variant="outlined"
          startIcon={<RefreshIcon />}
          onClick={handleRefresh}
          disabled={loading}
          sx={{
            color: '#339989',
            borderColor: '#339989',
            '&:hover': {
              borderColor: '#267b6e',
              bgcolor: 'rgba(51, 153, 137, 0.1)'
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Error state */}
      {error && (
        <Alert severity="error" sx={{ mb: 3, bgcolor: '#2a1a1e', border: '1px solid #f44336' }}>
          {error}
        </Alert>
      )}

      {/* Loading state */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress sx={{ color: '#339989' }} />
        </Box>
      )}

      {/* Empty state */}
      {!loading && appointments.length === 0 && !error && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <InboxIcon sx={{ fontSize: 64, color: '#666', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#888', mb: 1 }}>
            No pending requests
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            You're all caught up! New appointment requests will appear here.
          </Typography>
        </Box>
      )}

      {/* Appointments list */}
      {!loading && appointments.length > 0 && (
        <Box>
          {appointments.map((appointment) => (
            <AppointmentCard
              key={appointment.id}
              appointment={appointment}
              onAccept={handleAcceptAppointment}
              onDecline={handleDeclineAppointment}
              loading={actionLoading === appointment.id}
            />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default ArtistInbox;