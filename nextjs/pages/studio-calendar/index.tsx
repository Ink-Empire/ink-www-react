import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import StudioCalendar from '@/components/StudioCalendar';
import { useAuth } from '@/contexts/AuthContext';
import { studioService } from '@/services/studioService';
import { Box, Typography, Button, Avatar } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { colors } from '@/styles/colors';

interface Artist {
  id: number;
  name: string;
  slug?: string;
  image?: { uri?: string };
}

const StudioCalendarPage: React.FC = () => {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(true);

  const ownedStudio = user?.owned_studio || user?.studio;

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Redirect to regular calendar if user doesn't own a studio
  useEffect(() => {
    if (!authLoading && isAuthenticated && !ownedStudio) {
      router.push('/calendar');
    }
  }, [authLoading, isAuthenticated, ownedStudio, router]);

  // Fetch studio artists
  useEffect(() => {
    const fetchArtists = async () => {
      if (!ownedStudio?.id) return;

      setLoadingArtists(true);
      try {
        const response = await studioService.getArtists(ownedStudio.id);
        const studioArtists = Array.isArray(response) ? response : [];

        // Include the owner as an artist if not already in the list
        const ownerInList = studioArtists.some((a: Artist) => a.id === user?.id);
        if (!ownerInList && user) {
          studioArtists.unshift({
            id: user.id,
            name: user.name || user.username,
            slug: user.slug,
            image: user.image,
          });
        }

        setArtists(studioArtists);
      } catch (err) {
        console.error('Failed to fetch studio artists:', err);
        // Fallback to just the owner
        if (user) {
          setArtists([{
            id: user.id,
            name: user.name || user.username || 'Owner',
            slug: user.slug,
            image: user.image,
          }]);
        }
      } finally {
        setLoadingArtists(false);
      }
    };

    if (ownedStudio?.id) {
      fetchArtists();
    }
  }, [ownedStudio?.id, user]);

  if (authLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography sx={{ color: colors.textSecondary }}>Loading...</Typography>
        </Box>
      </Layout>
    );
  }

  if (!isAuthenticated || !user || !ownedStudio) {
    return null; // Will redirect
  }

  return (
    <Layout>
      <Head>
        <title>{ownedStudio.name} Calendar | InkedIn</title>
        <meta name="description" content="View studio schedule and manage appointments" />
      </Head>

      <Box sx={{ maxWidth: 1400, mx: 'auto', py: 3, px: { xs: 2, md: 3 } }}>
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
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={ownedStudio.image?.uri}
              sx={{
                width: 48,
                height: 48,
                bgcolor: colors.accent,
                color: colors.background,
                fontSize: '1rem',
                fontWeight: 600,
                borderRadius: '8px'
              }}
              variant="rounded"
            >
              {ownedStudio.name?.substring(0, 2).toUpperCase() || 'ST'}
            </Avatar>
            <Box>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: { xs: '1.5rem', md: '2rem' },
                fontWeight: 600,
                color: colors.textPrimary,
              }}>
                {ownedStudio.name} Calendar
              </Typography>
              <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                View all appointments across your studio
              </Typography>
            </Box>
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
        <Box sx={{
          bgcolor: colors.surface,
          borderRadius: '12px',
          p: 3,
          border: `1px solid ${colors.border}`,
        }}>
          {loadingArtists ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Typography sx={{ color: colors.textSecondary }}>Loading artists...</Typography>
            </Box>
          ) : (
            <StudioCalendar
              studioId={ownedStudio.id}
              artists={artists}
            />
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default StudioCalendarPage;
