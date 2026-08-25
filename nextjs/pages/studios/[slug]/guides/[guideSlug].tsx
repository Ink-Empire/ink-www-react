import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import Layout from '@/components/Layout';
import { colors } from '@/styles/colors';

interface StudioGuideProps {
  guide?: any;
  studioName?: string;
  studioSlug?: string;
}

/**
 * A studio's aftercare or preparation guide at its own URL. This is what the
 * aftercare message links to, and what a search for "tattoo aftercare" can
 * land on.
 */
export default function StudioGuide({ guide, studioName, studioSlug }: StudioGuideProps) {
  if (!guide) {
    return (
      <Layout>
        <Box sx={{ p: 6, textAlign: 'center', color: colors.textSecondary }}>
          That guide is no longer available.
        </Box>
      </Layout>
    );
  }

  const description = guide.excerpt || String(guide.content).slice(0, 155);

  return (
    <Layout>
      <Head>
        <title>{`${guide.title} - ${studioName} | InkedIn`}</title>
        <meta name="description" content={description} />
        <meta property="og:title" content={`${guide.title} - ${studioName}`} />
        <meta property="og:description" content={description} />
      </Head>

      <Box sx={{ maxWidth: 760, mx: 'auto', py: 4, px: 2 }}>
        <Box
          component={Link}
          href={`/studios/${studioSlug}`}
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 0.75,
            mb: 3,
            color: colors.textSecondary,
            textDecoration: 'none',
            fontSize: '0.9rem',
            '&:hover': { color: colors.accent },
          }}
        >
          <ArrowBackIcon sx={{ fontSize: 18 }} />
          {studioName}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
          <MenuBookIcon sx={{ fontSize: 18, color: colors.accent }} />
          <Typography sx={{
            fontSize: '0.75rem',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            color: colors.accent,
          }}>
            {guide.type_label}
          </Typography>
        </Box>

        <Typography
          component="h1"
          sx={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '2.25rem',
            fontWeight: 500,
            color: colors.textPrimary,
            lineHeight: 1.2,
            mb: guide.excerpt ? 1 : 3,
          }}
        >
          {guide.title}
        </Typography>

        {guide.excerpt && (
          <Typography sx={{ fontSize: '1.05rem', color: colors.textMuted, mb: 3 }}>
            {guide.excerpt}
          </Typography>
        )}

        <Typography sx={{
          fontSize: '1.05rem',
          color: colors.textSecondary,
          lineHeight: 1.75,
          whiteSpace: 'pre-wrap',
        }}>
          {guide.content}
        </Typography>
      </Box>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, guideSlug } = context.params || {};

  if (typeof slug !== 'string' || typeof guideSlug !== 'string') {
    return { notFound: true };
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost';
  const appToken = process.env.NEXT_PUBLIC_API_APP_TOKEN || '';
  const headers = {
    Accept: 'application/json',
    ...(appToken ? { 'X-App-Token': appToken } : {}),
  };

  context.res.setHeader('Cache-Control', 'public, s-maxage=30');

  try {
    const [guideRes, studioRes] = await Promise.all([
      fetch(`${apiUrl}/api/studios/${slug}/guides/${guideSlug}`, { method: 'GET', headers }),
      fetch(`${apiUrl}/api/studios/${slug}`, { method: 'GET', headers }),
    ]);

    if (!guideRes.ok) {
      return { notFound: true };
    }

    const guide = (await guideRes.json())?.guide || null;
    if (!guide) {
      return { notFound: true };
    }

    const studio = studioRes.ok ? (await studioRes.json())?.studio : null;

    return {
      props: {
        guide,
        studioName: studio?.name || 'Studio',
        studioSlug: studio?.slug || slug,
      },
    };
  } catch {
    return { notFound: true };
  }
};
