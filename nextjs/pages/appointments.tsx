import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Avatar,
  Button,
  Skeleton,
  Snackbar,
  Alert,
  Dialog,
  IconButton,
} from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import UpdateIcon from '@mui/icons-material/Update';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { colors } from '@/styles/colors';
import { useClientDashboard, DashboardAppointment } from '@/hooks/useClientDashboard';
import { messageService } from '@/services/messageService';
import { appointmentService } from '@/services/appointmentService';
import { RescheduleAppointmentModal } from '@/components/inbox/RescheduleAppointmentModal';
import { CancelAppointmentModal } from '@/components/inbox/CancelAppointmentModal';

function formatTime(time: string): string {
  if (!time) return '';
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

export default function AppointmentsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { appointments, loading: dashboardLoading, refresh } = useClientDashboard();

  const [selectedAppointment, setSelectedAppointment] = useState<DashboardAppointment | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  const handleCardClick = (apt: DashboardAppointment) => {
    setSelectedAppointment(apt);
    setDetailOpen(true);
  };

  const handleRescheduleSubmit = async (proposedDate: string, proposedStartTime: string, proposedEndTime: string, reason?: string) => {
    if (!selectedAppointment) return;
    if (selectedAppointment.conversation_id) {
      await messageService.sendReschedule(selectedAppointment.conversation_id, selectedAppointment.id, proposedDate, proposedStartTime, proposedEndTime, reason);
    } else {
      await appointmentService.update(selectedAppointment.id, { date: proposedDate, start_time: proposedStartTime, end_time: proposedEndTime });
    }
    await refresh();
    setSnackbar({ open: true, message: 'Reschedule request sent to the artist.', severity: 'success' });
  };

  const handleCancelSubmit = async (reason?: string) => {
    if (!selectedAppointment) return;
    if (selectedAppointment.conversation_id) {
      await messageService.sendCancellation(selectedAppointment.conversation_id, selectedAppointment.id, reason);
    } else {
      await appointmentService.cancel(selectedAppointment.id, reason);
    }
    await refresh();
    setDetailOpen(false);
    setSnackbar({ open: true, message: 'The appointment has been cancelled.', severity: 'success' });
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) return <Layout><Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}><Skeleton variant="rounded" width={400} height={200} sx={{ bgcolor: colors.surface }} /></Box></Layout>;

  return (
    <Layout>
      <Head><title>My Appointments | InkedIn</title></Head>
      <Box sx={{ maxWidth: 700, mx: 'auto', py: 4, px: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
          <IconButton onClick={() => router.back()} sx={{ color: colors.textPrimary }}>
            <ArrowBackIcon />
          </IconButton>
          <CalendarMonthIcon sx={{ color: colors.accent, fontSize: 24 }} />
          <Typography sx={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '1.5rem',
            fontWeight: 600,
            color: colors.textPrimary,
          }}>
            Upcoming Appointments
          </Typography>
        </Box>

        {dashboardLoading ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} variant="rounded" height={90} sx={{ bgcolor: colors.surface, borderRadius: '10px' }} />
            ))}
          </Box>
        ) : appointments.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {appointments.map((apt) => {
              const [y, m, d] = (apt.date || '').split('T')[0].split('-').map(Number);
              const dateObj = new Date(y, m - 1, d);
              const day = dateObj.getDate();
              const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
              const time = formatTime(apt.start_time);
              const endTime = apt.end_time ? formatTime(apt.end_time) : '';
              const typeLabel = apt.type === 'consultation' ? 'Consultation' : 'Appointment';
              const artistName = apt.artist?.name || apt.artist?.username;
              const appointmentTitle = artistName ? `Tattoo ${typeLabel} with ${artistName}` : apt.title || `Tattoo ${typeLabel}`;
              const artistInitials = (apt.artist.name || apt.artist.username || '??').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

              return (
                <Box
                  key={apt.id}
                  onClick={() => handleCardClick(apt)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    bgcolor: colors.surface,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': { borderColor: colors.accent },
                  }}
                >
                  <Box sx={{ textAlign: 'center', flexShrink: 0, width: 44, bgcolor: colors.background, borderRadius: '8px', py: 0.75 }}>
                    <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: colors.textPrimary, lineHeight: 1.2 }}>{day}</Typography>
                    <Typography sx={{ fontSize: '0.7rem', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{month}</Typography>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 500, color: colors.textPrimary }}>{appointmentTitle}</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                      <ScheduleIcon sx={{ fontSize: 14, color: colors.textMuted }} />
                      <Typography sx={{ fontSize: '0.8rem', color: colors.accent, fontWeight: 500 }}>
                        {time}{endTime ? ` - ${endTime}` : ''}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexShrink: 0 }}>
                    <Avatar
                      src={apt.artist.image?.uri}
                      sx={{ width: 28, height: 28, bgcolor: colors.accent, color: colors.background, fontSize: '0.65rem', fontWeight: 600 }}
                    >
                      {artistInitials}
                    </Avatar>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <CalendarMonthIcon sx={{ fontSize: 48, color: colors.textMuted, mb: 1 }} />
            <Typography sx={{ color: colors.textSecondary, fontSize: '1rem' }}>No upcoming appointments</Typography>
            <Button
              onClick={() => router.push('/artists')}
              sx={{
                mt: 2, px: 3, py: 1,
                bgcolor: colors.accent, color: colors.background,
                borderRadius: '8px', textTransform: 'none', fontWeight: 500,
                '&:hover': { bgcolor: colors.accentHover },
              }}
            >
              Browse Artists
            </Button>
          </Box>
        )}
      </Box>

      {/* Appointment Detail Modal */}
      <Dialog
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { bgcolor: colors.surface, backgroundImage: 'none', borderRadius: '16px', border: `1px solid ${colors.border}` } }}
      >
        {selectedAppointment && (() => {
          const [y, m, d] = (selectedAppointment.date || '').split('T')[0].split('-').map(Number);
          const dateObj = new Date(y, m - 1, d);
          const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
          const artistName = selectedAppointment.artist?.name || selectedAppointment.artist?.username;
          return (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2.5, borderBottom: `1px solid ${colors.border}` }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <CalendarMonthIcon sx={{ color: colors.accent, fontSize: 22 }} />
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.textPrimary }}>Appointment Details</Typography>
                </Box>
                <IconButton onClick={() => setDetailOpen(false)} sx={{ color: colors.textMuted, '&:hover': { color: colors.textPrimary } }}>
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Date</Typography>
                  <Typography sx={{ color: colors.textPrimary, fontWeight: 500, fontSize: '0.9rem' }}>{formattedDate}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Time</Typography>
                  <Typography sx={{ color: colors.textPrimary, fontWeight: 500, fontSize: '0.9rem' }}>{formatTime(selectedAppointment.start_time)}{selectedAppointment.end_time ? ` - ${formatTime(selectedAppointment.end_time)}` : ''}</Typography>
                </Box>
                {selectedAppointment.title && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Type</Typography>
                    <Typography sx={{ color: colors.textPrimary, fontWeight: 500, fontSize: '0.9rem' }}>{selectedAppointment.title}</Typography>
                  </Box>
                )}
                {artistName && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>Artist</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Avatar src={selectedAppointment.artist.image?.uri} sx={{ width: 24, height: 24, bgcolor: colors.accent, color: colors.background, fontSize: '0.6rem', fontWeight: 600 }}>
                        {(selectedAppointment.artist.name || selectedAppointment.artist.username || '??').slice(0, 2).toUpperCase()}
                      </Avatar>
                      <Typography sx={{ color: colors.textPrimary, fontWeight: 500, fontSize: '0.9rem' }}>{artistName}</Typography>
                    </Box>
                  </Box>
                )}
              </Box>
              <Box sx={{ display: 'flex', gap: 1, p: 2.5, pt: 0 }}>
                <Button
                  onClick={() => { setDetailOpen(false); router.push(`/inbox?participant=${selectedAppointment.artist.id}`); }}
                  sx={{ flex: 1, py: 1, borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.85rem', color: colors.textPrimary, border: `1px solid ${colors.border}`, '&:hover': { borderColor: colors.accent, color: colors.accent } }}
                  startIcon={<ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />}
                >
                  Message
                </Button>
                <Button
                  onClick={() => { setDetailOpen(false); setRescheduleOpen(true); }}
                  sx={{ flex: 1, py: 1, borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.85rem', color: colors.accent, border: `1px solid ${colors.accent}40`, '&:hover': { bgcolor: `${colors.accent}15` } }}
                  startIcon={<UpdateIcon sx={{ fontSize: 16 }} />}
                >
                  Reschedule
                </Button>
                <Button
                  onClick={() => { setDetailOpen(false); setCancelOpen(true); }}
                  sx={{ flex: 1, py: 1, borderRadius: '8px', textTransform: 'none', fontWeight: 500, fontSize: '0.85rem', color: colors.error, border: `1px solid ${colors.error}40`, '&:hover': { bgcolor: `${colors.error}15` } }}
                  startIcon={<EventBusyIcon sx={{ fontSize: 16 }} />}
                >
                  Cancel
                </Button>
              </Box>
            </>
          );
        })()}
      </Dialog>

      <RescheduleAppointmentModal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        onSubmit={handleRescheduleSubmit}
        clientName={selectedAppointment?.artist?.name || undefined}
        recipientLabel="artist"
        currentDate={selectedAppointment?.date}
        currentStartTime={selectedAppointment?.start_time}
        currentEndTime={selectedAppointment?.end_time}
      />
      <CancelAppointmentModal open={cancelOpen} onClose={() => setCancelOpen(false)} onSubmit={handleCancelSubmit} clientName={selectedAppointment?.artist?.name || undefined} />

      <Snackbar open={snackbar.open} autoHideDuration={5000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ bgcolor: snackbar.severity === 'success' ? colors.success : colors.error, color: 'white' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
