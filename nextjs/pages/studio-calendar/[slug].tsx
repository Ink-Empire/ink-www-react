import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import StudioCalendar from '@/components/StudioCalendar';
import { useStudio, useStudioArtists } from '@/hooks/useStudios';
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
  const { slug } = router.query;
  const studioSlug = slug as string;

  const { studio, loading: studioLoading } = useStudio(studioSlug);
  const { artists: rawArtists, loading: artistsLoading } = useStudioArtists(studioSlug);

  // Transform artists to the format StudioCalendar expects
  const artists: Artist[] = (rawArtists || []).map((a: any) => ({
    id: a.id,
    name: a.name,
    slug: a.slug,
    image: a.image || a.primary_image,
  }));

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
        <title>{studio?.name ? `${studio.name} Calendar` : 'Studio Calendar'} | InkedIn</title>
        <meta name="description" content="View studio availability and schedule appointments" />
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
              src={studio?.image?.uri || studio?.primary_image?.uri}
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
              {studio?.name?.substring(0, 2).toUpperCase() || 'ST'}
            </Avatar>
            <Box>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: { xs: '1.5rem', md: '2rem' },
                fontWeight: 600,
                color: colors.textPrimary,
              }}>
                {studioLoading ? 'Loading...' : studio?.name ? `${studio.name} Calendar` : 'Studio Calendar'}
              </Typography>
              <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                View availability and book appointments
              </Typography>
            </Box>
          </Box>

          <Button
            component={Link}
            href={`/studios/${studioSlug}`}
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
            Back to Studio
          </Button>
        </Box>

        {/* Calendar */}
        <Box sx={{
          bgcolor: colors.surface,
          borderRadius: '12px',
          p: 3,
          border: `1px solid ${colors.border}`,
        }}>
          {studioLoading || artistsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <Typography sx={{ color: colors.textSecondary }}>Loading calendar...</Typography>
            </Box>
          ) : artists.length > 0 ? (
            <StudioCalendar
              studioId={studio?.id || 0}
              artists={artists}
            />
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{ color: colors.textMuted }}>
                No artists found at this studio.
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Layout>
  );
};

export default StudioCalendarPage;
