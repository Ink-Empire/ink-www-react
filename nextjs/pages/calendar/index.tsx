import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ArtistProfileCalendar from '@/components/ArtistProfileCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { colors } from '@/styles/colors';

const MyCalendarPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

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

        {/* Calendar */}
        {userSlug ? (
          <ArtistProfileCalendar
            artistIdOrSlug={userSlug}
            artistId={user.id}
            artistName={user.name || 'Artist'}
          />
        ) : (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography sx={{ color: colors.textMuted }}>
              Unable to load calendar. Please try again.
            </Typography>
          </Box>
        )}
      </Box>
    </Layout>
  );
};

export default MyCalendarPage;
