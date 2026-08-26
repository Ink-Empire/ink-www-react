import React from 'react';
import { GetServerSideProps } from 'next';
import Head from 'next/head';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CampaignIcon from '@mui/icons-material/Campaign';
import Layout from '@/components/Layout';
import { colors } from '@/styles/colors';

interface StudioNewsPostProps {
  post?: any;
  studioName?: string;
  studioSlug?: string;
}

/**
 * A single studio announcement at its own URL.
 *
 * Substantive announcements - a flash drop, a guest spot, books opening - keep
 * their page after they come off the studio page, so a link shared at the time
 * still resolves.
 */
export default function StudioNewsPost({ post, studioName, studioSlug }: StudioNewsPostProps) {
  if (!post) {
    return (
      <Layout>
        <Box sx={{ p: 6, textAlign: 'center', color: colors.textSecondary }}>
          That announcement is no longer available.
        </Box>
      </Layout>
    );
  }

  const published = post.published_at
    ? new Date(post.published_at).toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
      })
    : null;

  const hasEnded = post.ends_at && new Date(post.ends_at) < new Date();

  return (
    <Layout>
      <Head>
        <title>{`${post.title} - ${studioName} | InkedIn`}</title>
        <meta name="description" content={post.excerpt || String(post.content).slice(0, 155)} />
        <meta property="og:title" content={`${post.title} - ${studioName}`} />
        <meta property="og:description" content={post.excerpt || String(post.content).slice(0, 155)} />
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

        {post.type_label && post.type !== 'general' && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 1 }}>
            <CampaignIcon sx={{ fontSize: 18, color: colors.accent }} />
            <Typography
              sx={{
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: colors.accent,
              }}
            >
              {post.type_label}
            </Typography>
          </Box>
        )}

        <Typography
          component="h1"
          sx={{
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontSize: '2.25rem',
            fontWeight: 500,
            color: colors.textPrimary,
            lineHeight: 1.2,
            mb: 1,
          }}
        >
          {post.title}
        </Typography>

        {published && (
          <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mb: 3 }}>
            {published}
          </Typography>
        )}

        {hasEnded && (
          <Box sx={{
            p: 1.5,
            mb: 3,
            borderRadius: '8px',
            bgcolor: colors.surface,
            border: `1px solid ${colors.border}`,
            color: colors.textSecondary,
            fontSize: '0.875rem',
          }}>
            This has passed. It is kept here for reference.
          </Box>
        )}

        <Typography
          sx={{
            fontSize: '1.05rem',
            color: colors.textSecondary,
            lineHeight: 1.7,
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.content}
        </Typography>
      </Box>
    </Layout>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const { slug, postSlug } = context.params || {};

  if (typeof slug !== 'string' || typeof postSlug !== 'string') {
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
    const [postRes, studioRes] = await Promise.all([
      fetch(`${apiUrl}/api/studios/${slug}/news/${postSlug}`, { method: 'GET', headers }),
      fetch(`${apiUrl}/api/studios/${slug}`, { method: 'GET', headers }),
    ]);

    if (!postRes.ok) {
      return { notFound: true };
    }

    const post = (await postRes.json())?.post || null;
    if (!post) {
      return { notFound: true };
    }

    const studio = studioRes.ok ? (await studioRes.json())?.studio : null;

    return {
      props: {
        post,
        studioName: studio?.name || 'Studio',
        studioSlug: studio?.slug || slug,
      },
    };
  } catch {
    return { notFound: true };
  }
};
