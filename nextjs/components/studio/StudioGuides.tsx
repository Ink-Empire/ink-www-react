import React from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { colors } from '@/styles/colors';

interface StudioGuidesProps {
  guides?: any[];
  studioSlug?: string;
}

/**
 * Used only for a guide written in the editor but not yet published, which has
 * no type_label from the API yet. Published guides carry their own.
 */
const FALLBACK_LABELS: Record<string, string> = {
  aftercare: 'Aftercare guide',
  prep: 'Preparation guide',
  article: 'Guide',
};

/**
 * Practical writing from the studio: aftercare, preparation, or anything else
 * it wanted to write once. Absent entirely when the studio has written none.
 *
 * A guide only links when it has somewhere to go. One written in the editor
 * has no slug until it is published, so it renders as plain text rather than a
 * link to /guides/undefined.
 */
const StudioGuides: React.FC<StudioGuidesProps> = ({ guides = [], studioSlug }) => {
  if (guides.length === 0) {
    return null;
  }

  const hrefFor = (guide: any): string | null => {
    if (guide.url) return guide.url;
    if (studioSlug && guide.slug) return `/studios/${studioSlug}/guides/${guide.slug}`;
    return null;
  };

  return (
    <Box sx={{ mb: 3 }}>
      <Typography sx={{
        fontFamily: '"Cormorant Garamond", Georgia, serif',
        fontSize: '1.25rem',
        fontWeight: 500,
        color: colors.textPrimary,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        mb: 1.5,
      }}>
        <MenuBookIcon sx={{ color: colors.accent }} />
        Guides
      </Typography>

      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {guides.map((guide: any) => {
          const href = hrefFor(guide);

          return (
            <Box
              key={guide.id ?? guide.slug ?? guide.title}
              component={href ? Link : 'div'}
              {...(href ? { href } : {})}
              sx={{
                display: 'block',
                p: 1.5,
                borderRadius: '10px',
                bgcolor: colors.surface,
                border: `1px solid ${colors.border}`,
                textDecoration: 'none',
                transition: 'border-color 0.15s',
                ...(href ? { '&:hover': { borderColor: colors.accent } } : {}),
              }}
            >
              <Typography sx={{
                fontSize: '0.7rem',
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                color: colors.accent,
              }}>
                {guide.type_label || FALLBACK_LABELS[guide.type] || 'Guide'}
              </Typography>

              <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textPrimary }}>
                {guide.title}
                {!href && (
                  <Box component="span" sx={{ ml: 1, fontSize: '0.75rem', color: colors.accent }}>
                    not published yet
                  </Box>
                )}
              </Typography>

              {guide.excerpt && (
                <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                  {guide.excerpt}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default StudioGuides;
