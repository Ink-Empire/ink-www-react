import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress, Alert, Tabs, Tab, Grid, Badge } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import InboxIcon from '@mui/icons-material/Inbox';
import HistoryIcon from '@mui/icons-material/History';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import MessageIcon from '@mui/icons-material/Message';
import { useInbox } from '../hooks/useInbox';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import AppointmentCard from './AppointmentCard';
import HistoryTab from './HistoryTab';
import { colors } from '@/styles/colors';

interface InboxProps {
  userId?: number;
  userType?: 'artist' | 'client';
}

const Inbox: React.FC<InboxProps> = ({ userId, userType = 'artist' }) => {
  const { user } = useAuth();
  const { showSuccess, showError, showConfirm } = useDialog();
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  // Use the user's ID if not provided
  const effectiveUserId = userId || user?.id;

  const {
    appointments,
    loading,
    error,
    refreshInbox,
    updateAppointmentStatus
  } = useInbox(effectiveUserId);

  // Calculate unread message count for current user
  const unreadMessageCount = appointments.reduce((count, appointment) => {
    if (!appointment.messages) return count;
    
    const unreadMessages = appointment.messages.filter(message => 
      message.recipient_id === effectiveUserId && !message.read_at
    );
    
    return count + unreadMessages.length;
  }, 0);

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

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  if (!effectiveUserId) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Alert severity="warning">
          User ID not found. Please make sure you are logged in.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <InboxIcon sx={{ fontSize: 32, color: colors.accent }} />
          <Typography variant="h4" sx={{ color: 'white', fontWeight: 'bold' }}>
            Inbox
          </Typography>
          {activeTab === 0 && appointments.length > 0 && (
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
            color: colors.accent,
            borderColor: colors.accent,
            '&:hover': {
              borderColor: colors.accentDark,
              bgcolor: 'rgba(51, 153, 137, 0.1)'
            }
          }}
        >
          Refresh
        </Button>
      </Box>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: '#444', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: colors.accent
            },
            '& .MuiTab-root': {
              color: '#888',
              '&.Mui-selected': {
                color: colors.accent
              }
            }
          }}
        >
          <Tab 
            icon={
              <Badge 
                badgeContent={unreadMessageCount > 0 ? unreadMessageCount : undefined} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 4px',
                    backgroundColor: colors.accent
                  }
                }}
              >
                <InboxIcon />
              </Badge>
            } 
            label="Pending" 
            iconPosition="start"
            sx={{ minHeight: 'auto' }}
          />
          <Tab 
            icon={<ChatBubbleIcon />} 
            label="Messages" 
            iconPosition="start"
            sx={{ minHeight: 'auto' }}
          />
          <Tab 
            icon={<HistoryIcon />} 
            label="History" 
            iconPosition="start"
            sx={{ minHeight: 'auto' }}
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Error state */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, bgcolor: colors.surface, border: `1px solid ${colors.error}` }}>
              {error}
            </Alert>
          )}

          {/* Loading state */}
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress sx={{ color: colors.accent }} />
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
                  onAccept={userType === 'artist' ? handleAcceptAppointment : undefined}
                  onDecline={userType === 'artist' ? handleDeclineAppointment : undefined}
                  loading={actionLoading === appointment.id}
                  showActions={userType === 'artist'}
                />
              ))}
            </Box>
          )}
        </Box>
      )}

      {activeTab === 1 && (
        <Box sx={{ textAlign: 'center', py: 6 }}>
          <MessageIcon sx={{ fontSize: 64, color: '#666', mb: 2 }} />
          <Typography variant="h6" sx={{ color: '#888', mb: 1 }}>
            Standalone Messages
          </Typography>
          <Typography variant="body2" sx={{ color: '#666' }}>
            Messages not related to specific appointments will appear here.
          </Typography>
          <Typography variant="body2" sx={{ color: '#666', mt: 2 }}>
            For appointment-related messages, check the "Messages" button on each appointment card.
          </Typography>
        </Box>
      )}

      {activeTab === 2 && (
        <HistoryTab userId={effectiveUserId!} />
      )}
    </Box>
  );
};

export default Inbox;

// Legacy export for backward compatibility
export { Inbox as ArtistInbox };