import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ArtistCalendar from '@/components/ArtistCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import { Box, Typography, Button, Switch, Alert } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { colors } from '@/styles/colors';

const MyCalendarPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const [booksOpen, setBooksOpen] = useState<boolean | null>(null);
  const [isTogglingBooks, setIsTogglingBooks] = useState(false);
  const hasFetchedSettings = useRef(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch artist settings to check books_open status (only once on mount)
  useEffect(() => {
    const fetchArtistSettings = async () => {
      if (!user?.slug && !user?.id) return;
      if (hasFetchedSettings.current) return;

      hasFetchedSettings.current = true;

      try {
        const artistSlug = user.slug || user.id?.toString();
        const response = await api.get(`/artists/${artistSlug}`) as any;
        const settings = response.artist?.artist_settings || response.artist_settings;
        setBooksOpen(settings?.books_open ?? false);
      } catch (err) {
        console.error('Failed to fetch artist settings:', err);
        setBooksOpen(false);
      }
    };

    if (isAuthenticated && user) {
      fetchArtistSettings();
    }
  }, [isAuthenticated, user]);

  // Handle toggling books open/closed
  const handleToggleBooks = async () => {
    const artistId = user?.id;
    console.log('Toggle books - artistId:', artistId, 'current booksOpen:', booksOpen);
    if (!artistId) {
      console.error('No artistId found');
      return;
    }

    const newValue = !booksOpen;
    const previousValue = booksOpen;

    // Optimistic update
    setBooksOpen(newValue);
    setIsTogglingBooks(true);

    try {
      console.log('Calling API:', `/artists/${artistId}/settings`, { books_open: newValue });
      const response = await api.put(`/artists/${artistId}/settings`, { books_open: newValue }, { requiresAuth: true });
      console.log('API response:', response);
    } catch (err) {
      console.error('Failed to update books status:', err);
      // Revert on error
      setBooksOpen(previousValue);
    } finally {
      setIsTogglingBooks(false);
    }
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
          border: `1px solid ${colors.border}`
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

        {/* Books Status Banner */}
        {booksOpen !== null && (
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 2,
            mb: 3,
            p: 2,
            bgcolor: booksOpen ? `${colors.success}15` : `${colors.accent}15`,
            borderRadius: '12px',
            border: `1px solid ${booksOpen ? colors.success : colors.accent}40`,
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <EventBusyIcon sx={{ color: booksOpen ? colors.success : colors.accent, fontSize: 28 }} />
              <Box>
                <Typography sx={{
                  fontWeight: 600,
                  color: colors.textPrimary,
                  fontSize: '0.95rem',
                }}>
                  {booksOpen ? 'Your books are open' : 'Your books are currently closed'}
                </Typography>
                <Typography sx={{
                  color: colors.textSecondary,
                  fontSize: '0.85rem',
                }}>
                  {booksOpen
                    ? 'Clients can request appointments with you.'
                    : 'Clients cannot request appointments until you open your books.'}
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography sx={{
                fontSize: '0.85rem',
                fontWeight: 500,
                color: booksOpen ? colors.success : colors.textMuted,
              }}>
                {booksOpen ? 'Open' : 'Closed'}
              </Typography>
              <Switch
                checked={booksOpen}
                onChange={() => handleToggleBooks()}
                disabled={isTogglingBooks}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.success,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: colors.success,
                  },
                }}
              />
            </Box>
          </Box>
        )}

        {/* Calendar */}
        <Box sx={{
          bgcolor: colors.surface,
          borderRadius: '12px',
          p: 3,
          border: `1px solid ${colors.border}`,
          mb: 3
        }}>
          {userSlug ? (
            <ArtistCalendar artistIdOrSlug={userSlug} isOwnCalendar={true} />
          ) : (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Typography sx={{ color: colors.textMuted }}>
                Unable to load calendar. Please try again.
              </Typography>
            </Box>
          )}
        </Box>

        {/* Legend & Info */}
        <Box sx={{
          bgcolor: colors.surface,
          borderRadius: '12px',
          p: 3,
          border: `1px solid ${colors.border}`
        }}>
          <Typography sx={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '1.25rem',
            fontWeight: 500,
            color: colors.textPrimary,
            mb: 2
          }}>
            Calendar Legend
          </Typography>

          <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: colors.success, borderRadius: '2px' }} />
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>Available</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: colors.accent, borderRadius: '2px' }} />
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>Booked</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '2px' }} />
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>Unavailable</Typography>
            </Box>
          </Box>

          <Box sx={{
            mt: 3,
            p: 2,
            bgcolor: colors.background,
            borderRadius: '8px',
            border: `1px solid ${colors.border}`
          }}>
            <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, lineHeight: 1.6 }}>
              Click on any day to view details. You can manage your availability and appointments from this calendar.
            </Typography>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default MyCalendarPage;
