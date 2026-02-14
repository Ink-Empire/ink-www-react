import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ArtistProfileCalendar, { ArtistProfileCalendarRef } from '@/components/ArtistProfileCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Typography, Button, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { colors } from '@/styles/colors';
import GoogleCalendarButton from '@/components/GoogleCalendarButton';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { artistService } from '@/services/artistService';

interface UpcomingAppointment {
  id: number;
  date: string;
  day: number;
  month: string;
  time: string;
  title: string;
  clientName: string;
  clientInitials: string;
  type: string;
}

const MyCalendarPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const { status: calendarStatus, sync } = useGoogleCalendar();
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const calendarRef = useRef<ArtistProfileCalendarRef>(null);
  const initialSyncDone = useRef(false);
  const [upcomingAppointments, setUpcomingAppointments] = useState<UpcomingAppointment[]>([]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch upcoming appointments
  useEffect(() => {
    if (!user?.id) return;
    const fetchUpcoming = async () => {
      try {
        const response = await artistService.getUpcomingSchedule(user.id);
        const data = (response as any)?.data ?? response ?? [];
        setUpcomingAppointments(Array.isArray(data) ? data.slice(0, 5) : []);
      } catch (err) {
        console.error('Failed to fetch upcoming appointments:', err);
      }
    };
    fetchUpcoming();
  }, [user?.id]);

  // Handle OAuth callback success/error from URL params
  useEffect(() => {
    const { calendar_connected, calendar_error } = router.query;

    if (calendar_connected === 'true') {
      setNotification({ type: 'success', message: 'Google Calendar connected successfully!' });
      // Clean up URL params
      router.replace('/calendar', undefined, { shallow: true });
    } else if (calendar_error) {
      setNotification({ type: 'error', message: `Failed to connect: ${calendar_error}` });
      router.replace('/calendar', undefined, { shallow: true });
    }
  }, [router.query, router]);

  // Trigger sync on initial load if calendar is connected
  useEffect(() => {
    if (calendarStatus?.connected && !initialSyncDone.current) {
      initialSyncDone.current = true;
      sync().then(() => {
        calendarRef.current?.refreshEvents?.();
      });
    }
  }, [calendarStatus?.connected, sync]);

  const handleSyncComplete = () => {
    calendarRef.current?.refreshEvents?.();
  };

  const handleUpcomingClick = (apt: UpcomingAppointment) => {
    calendarRef.current?.selectDay(apt.date);
  };

  if (authLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography sx={{ color: colors.textSecondary }}>Loading...</Typography>
        </Box>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect
  }

  const userSlug = user.slug || user.id?.toString();

  return (
    <Layout>
      <Head>
        <title>My Calendar | InkedIn</title>
        <meta name="description" content="View your schedule and manage appointments" />
      </Head>

      <Box sx={{ maxWidth: 1200, mx: 'auto', py: 3, px: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          p: 2,
          bgcolor: colors.surface,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Box>
            <Typography sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 600,
              color: colors.textPrimary,
            }}>
              My Calendar
            </Typography>
            <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
              View your schedule and manage appointments
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <GoogleCalendarButton onSyncComplete={handleSyncComplete} />

            <Button
              component={Link}
              href="/dashboard"
              sx={{
                px: 2,
                py: 1,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.9rem',
                '&:hover': { borderColor: colors.accent, color: colors.accent }
              }}
              startIcon={<ArrowBackIcon sx={{ fontSize: 18 }} />}
            >
              Back to Dashboard
            </Button>
          </Box>
        </Box>

        {/* Calendar */}
        {userSlug ? (
          <ArtistProfileCalendar
            ref={calendarRef}
            artistIdOrSlug={userSlug}
            artistId={user.id}
            artistName={user.name || 'Artist'}
            showExternalEvents={true}
            isOwnCalendar={true}
          />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: colors.textMuted }}>
              Unable to load calendar. Please try again.
            </Typography>
          </Box>
        )}

        {/* Upcoming Appointments - below calendar, stacked vertically like RN */}
        {upcomingAppointments.length > 0 && (
          <Box sx={{ pb: 3, mt: 3 }}>
            <Typography sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              mb: 1.5,
            }}>
              Upcoming Appointments
            </Typography>
            {upcomingAppointments.map((apt) => (
              <Box
                key={apt.id}
                onClick={() => handleUpcomingClick(apt)}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5,
                  p: 1.5,
                  mb: 1,
                  bgcolor: colors.surfaceElevated,
                  borderRadius: '10px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  border: `1px solid transparent`,
                  '&:hover': {
                    borderColor: colors.accent,
                    bgcolor: colors.surface,
                  },
                }}
              >
                {/* Date block */}
                <Box sx={{
                  minWidth: 44,
                  textAlign: 'center',
                  bgcolor: colors.surface,
                  borderRadius: '8px',
                  py: 0.75,
                  px: 1,
                }}>
                  <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: colors.textPrimary, lineHeight: 1.2 }}>
                    {apt.day}
                  </Typography>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' }}>
                    {apt.month}
                  </Typography>
                </Box>

                {/* Info */}
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography sx={{
                    fontSize: '0.85rem',
                    fontWeight: 600,
                    color: colors.textPrimary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {apt.title}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                    <ScheduleIcon sx={{ fontSize: 12, color: colors.textMuted }} />
                    <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
                      {apt.time}
                    </Typography>
                  </Box>
                  <Typography sx={{
                    fontSize: '0.75rem',
                    color: colors.textSecondary,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {apt.clientName}
                  </Typography>
                </Box>

                {/* Type badge */}
                <Box sx={{
                  px: 1,
                  py: 0.25,
                  bgcolor: colors.accentDim,
                  borderRadius: '4px',
                  flexShrink: 0,
                }}>
                  <Typography sx={{
                    fontSize: '0.6rem',
                    fontWeight: 600,
                    color: colors.accent,
                    textTransform: 'uppercase',
                  }}>
                    {apt.type}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Notification Snackbar */}
      <Snackbar
        open={!!notification}
        autoHideDuration={5000}
        onClose={() => setNotification(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setNotification(null)}
          severity={notification?.type || 'info'}
          sx={{ width: '100%' }}
        >
          {notification?.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
};

export default MyCalendarPage;
