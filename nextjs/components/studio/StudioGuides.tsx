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
 * Practical writing from the studio: aftercare and preparation. Absent
 * entirely when the studio has written none.
 */
const StudioGuides: React.FC<StudioGuidesProps> = ({ guides = [], studioSlug }) => {
  if (guides.length === 0) {
    return null;
  }

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
        {guides.map((guide: any) => (
          <Box
            key={guide.id ?? guide.slug}
            component={guide.url || studioSlug ? Link : 'div'}
            {...(guide.url || studioSlug
              ? { href: guide.url || `/studios/${studioSlug}/guides/${guide.slug}` }
              : {})}
            sx={{
              display: 'block',
              p: 1.5,
              borderRadius: '10px',
              bgcolor: colors.surface,
              border: `1px solid ${colors.border}`,
              textDecoration: 'none',
              transition: 'border-color 0.15s',
              '&:hover': { borderColor: colors.accent },
            }}
          >
            <Typography sx={{ fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.06em', color: colors.accent }}>
              {guide.type_label}
            </Typography>
            <Typography sx={{ fontSize: '0.95rem', fontWeight: 600, color: colors.textPrimary }}>
              {guide.title}
            </Typography>
            {guide.excerpt && (
              <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
                {guide.excerpt}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default StudioGuides;
