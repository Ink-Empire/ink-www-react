import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import ArtistCalendar from '@/components/ArtistCalendar';
import { useArtist } from '@/hooks/useArtists';
import { Box, Typography, Button } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { colors } from '@/styles/colors';

const ArtistCalendarPage: React.FC = () => {
  const router = useRouter();
  const { slug } = router.query;
  const artistSlug = slug as string;

  const { artist, loading: artistLoading } = useArtist(artistSlug);

  if (!slug) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography sx={{ color: colors.textSecondary }}>Loading...</Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>{artist?.name ? `${artist.name}'s Calendar` : 'Artist Calendar'} | InkedIn</title>
        <meta name="description" content="View artist's availability and schedule appointments" />
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
              {artistLoading ? 'Loading...' : artist?.name ? `${artist.name}'s Calendar` : 'Artist Calendar'}
            </Typography>
            <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
              View availability and book appointments
            </Typography>
          </Box>

          <Button
            component={Link}
            href={`/artists/${artistSlug}`}
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
            Back to Profile
          </Button>
        </Box>

        {/* Calendar */}
        <Box sx={{
          bgcolor: colors.surface,
          borderRadius: '12px',
          p: 3,
          border: `1px solid ${colors.border}`,
          mb: 3
        }}>
          <ArtistCalendar artistIdOrSlug={artistSlug} />
        </Box>

        {/* Booking Instructions */}
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
            Booking Instructions
          </Typography>

          <Typography sx={{ color: colors.textSecondary, mb: 3, lineHeight: 1.6 }}>
            To book an appointment with {artist?.name || 'this artist'}, select a{' '}
            <Box component="span" sx={{ color: colors.success, fontWeight: 500 }}>green</Box>{' '}
            date on the calendar above. Only days with available time slots are shown in green.
          </Typography>

          <Box sx={{
            p: 2,
            bgcolor: colors.background,
            borderRadius: '8px',
            border: `1px solid ${colors.border}`
          }}>
            <Typography sx={{ fontWeight: 500, color: colors.textPrimary, mb: 1.5 }}>
              How booking works:
            </Typography>
            <Box component="ul" sx={{
              pl: 2.5,
              m: 0,
              '& li': {
                color: colors.textSecondary,
                fontSize: '0.9rem',
                mb: 0.75,
                '&:last-child': { mb: 0 }
              }
            }}>
              <li>Green days have available time slots</li>
              <li>Click on a green day to see available time slots</li>
              <li>Fill out the appointment request form</li>
              <li>Your request will be sent to the artist for approval</li>
              <li>You'll be notified when the artist approves your request</li>
            </Box>
          </Box>

          {/* Legend */}
          <Box sx={{ display: 'flex', gap: 4, mt: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: colors.success, borderRadius: '2px' }} />
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>Available</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box sx={{ width: 16, height: 16, bgcolor: colors.surface, border: `1px solid ${colors.border}`, borderRadius: '2px' }} />
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>Unavailable</Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </Layout>
  );
};

export default ArtistCalendarPage;
