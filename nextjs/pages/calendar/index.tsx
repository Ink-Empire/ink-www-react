import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import Layout from '@/components/Layout';
import ArtistProfileCalendar, { ArtistProfileCalendarRef } from '@/components/ArtistProfileCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Typography, Button, Switch, Snackbar, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ScheduleIcon from '@mui/icons-material/Schedule';
import { colors } from '@/styles/colors';
import GoogleCalendarButton from '@/components/GoogleCalendarButton';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';
import { useWorkingHours } from '@/hooks';
import { artistService } from '@/services/artistService';

const WorkingHoursModal = dynamic(() => import('@/components/WorkingHoursModal'), { ssr: false });

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

  // Only show books toggle for artists
  const isArtist = user?.type === 'artist';

  // Books open state — same pattern as profile.tsx (artists only)
  const [booksOpen, setBooksOpen] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [workingHoursModalOpen, setWorkingHoursModalOpen] = useState(false);
  const pendingBooksOpen = useRef(false);
  const { workingHours, saveWorkingHours } = useWorkingHours(isArtist ? user?.id : null);

  // Fetch artist settings on mount to hydrate booksOpen
  useEffect(() => {
    if (!isArtist || !user?.id) return;
    const fetchSettings = async () => {
      try {
        const response = await artistService.getSettings(user.id);
        const data = response?.data ?? response;
        setBooksOpen(data?.books_open ?? false);
      } catch (err) {
        console.error('Failed to fetch artist settings:', err);
      }
    };
    fetchSettings();
  }, [isArtist, user?.id]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch upcoming appointments
  const fetchUpcoming = async () => {
    if (!user?.id) return;
    try {
      const response = await artistService.getUpcomingSchedule(user.id);
      const data = (response as any)?.data ?? response ?? [];
      setUpcomingAppointments(Array.isArray(data) ? data.slice(0, 5) : []);
    } catch (err) {
      console.error('Failed to fetch upcoming appointments:', err);
    }
  };

  useEffect(() => {
    fetchUpcoming();
  }, [user?.id]);

  // Handle OAuth callback success/error from URL params
  useEffect(() => {
    const { calendar_connected, calendar_error } = router.query;

    if (calendar_connected === 'true') {
      setNotification({ type: 'success', message: 'Google Calendar connected successfully!' });
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

  // --- Books open toggle: copied exactly from profile.tsx handleSettingToggle ---
  const handleBooksOpenToggle = async () => {
    if (!user?.id) return;

    const newValue = !booksOpen;
    const previousValue = booksOpen;

    // Optimistic update
    setBooksOpen(newValue);

    try {
      setSavingSettings(true);
      await artistService.updateSettings(user.id, { books_open: newValue });
      setNotification({ type: 'success', message: 'Settings updated successfully' });
    } catch (err: any) {
      // If API returns requires_availability, open the working hours modal
      if (err?.status === 422 && err?.data?.requires_availability) {
        pendingBooksOpen.current = true;
        setWorkingHoursModalOpen(true);
        return;
      }
      // Revert on error
      setBooksOpen(previousValue);
      setNotification({ type: 'error', message: 'Failed to update setting' });
    } finally {
      setSavingSettings(false);
    }
  };

  // --- Save working hours: copied exactly from profile.tsx handleSaveWorkingHours ---
  const handleSaveWorkingHours = async (hours: any[]) => {
    try {
      const result = await saveWorkingHours(hours);
      setWorkingHoursModalOpen(false);

      // If we were waiting to open books, do it now
      if (pendingBooksOpen.current && user?.id) {
        pendingBooksOpen.current = false;
        const hasAvailableHours = hours.some((h: any) => !h.is_day_off);
        if (hasAvailableHours) {
          try {
            await artistService.updateSettings(user.id, { books_open: true });
            setBooksOpen(true);
            setNotification({ type: 'success', message: 'Working hours saved and books opened' });
            return;
          } catch (err) {
            setBooksOpen(false);
            setNotification({ type: 'error', message: 'Hours saved but failed to open books' });
            return;
          }
        } else {
          // Saved hours but all are day-off, revert books_open
          setBooksOpen(false);
        }
      }

      if (result.booksClosed) {
        setBooksOpen(false);
        setNotification({ type: 'success', message: 'Working hours updated. Books have been closed until available hours are set.' });
        return;
      }

      setNotification({ type: 'success', message: 'Working hours updated successfully' });
    } catch (err) {
      if (pendingBooksOpen.current) {
        pendingBooksOpen.current = false;
        setBooksOpen(false);
      }
      setNotification({ type: 'error', message: 'Failed to update working hours' });
    }
  };

  // --- Modal close: copied exactly from profile.tsx handleWorkingHoursModalClose ---
  const handleWorkingHoursModalClose = () => {
    pendingBooksOpen.current = false;
    const hasAvailableHours = workingHours.some(h => !h.is_day_off);
    if (!hasAvailableHours) {
      setBooksOpen(false);
      if (user?.id) {
        artistService.updateSettings(user.id, { books_open: false }).catch(() => {});
      }
    }
    setWorkingHoursModalOpen(false);
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
            {/* Books Open toggle — artists only */}
            {isArtist && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography sx={{
                fontSize: '0.85rem',
                fontWeight: 500,
                color: booksOpen ? colors.accent : colors.textSecondary,
              }}>
                Books {booksOpen ? 'Open' : 'Closed'}
              </Typography>
              <Switch
                checked={booksOpen}
                onChange={handleBooksOpenToggle}
                disabled={savingSettings}
                size="small"
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': { color: colors.accent },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: colors.accent },
                }}
              />
            </Box>
            )}

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
            onAppointmentChanged={fetchUpcoming}
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

      {/* Working Hours Modal — artists only, same as profile.tsx */}
      {isArtist && user?.id && (
        <WorkingHoursModal
          isOpen={workingHoursModalOpen}
          onClose={handleWorkingHoursModalClose}
          onSave={handleSaveWorkingHours}
          artistId={user.id}
          initialWorkingHours={workingHours}
          infoText={pendingBooksOpen.current ? 'In order to set your books to open you must have working hours set.' : undefined}
        />
      )}

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
