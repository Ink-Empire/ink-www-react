import React, { useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import CampaignIcon from '@mui/icons-material/Campaign';
import Link from 'next/link';
import { colors } from '@/styles/colors';

interface StudioAnnouncementsProps {
  studio?: any;
}

/** How many show before the rest are collapsed. */
const VISIBLE_LIMIT = 2;

/**
 * Studio news, banner-style above the studio's name and photo. These are
 * time-sensitive - open books, flash days, a guest artist - so they are meant
 * to be the first thing a visitor reads.
 *
 * The newest is filled with the accent so one thing catches the eye; the rest
 * are tinted so several announcements do not turn the top of the page into a
 * wall of gold. Anything past the first two is collapsed.
 *
 * Renders nothing at all when the studio has posted none.
 */
const StudioAnnouncements: React.FC<StudioAnnouncementsProps> = ({ studio }) => {
  const [expanded, setExpanded] = useState(false);
  const announcements = studio?.announcements || [];

  if (announcements.length === 0) {
    return null;
  }

  const shown = expanded ? announcements : announcements.slice(0, VISIBLE_LIMIT);
  const hiddenCount = announcements.length - VISIBLE_LIMIT;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 3 }}>
      {shown.map((announcement: any, index: number) => {
        const isLead = index === 0;

        return (
          <Box
            key={announcement.id ?? announcement.title}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              px: 2,
              py: 1.25,
              borderRadius: '10px',
              ...(isLead
                ? { bgcolor: colors.accent }
                : {
                    bgcolor: `${colors.accent}14`,
                    border: `1px solid ${colors.accent}3D`,
                    borderLeft: `3px solid ${colors.accent}`,
                  }),
            }}
          >
            <CampaignIcon
              sx={{
                color: isLead ? colors.background : colors.accent,
                fontSize: 22,
                flexShrink: 0,
              }}
            />

            <Box sx={{ minWidth: 0 }}>
              {announcement.type_label && announcement.type !== 'general' && (
                <Typography
                  sx={{
                    fontSize: '0.7rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    color: isLead ? 'rgba(15, 15, 15, 0.65)' : colors.accent,
                  }}
                >
                  {announcement.type_label}
                </Typography>
              )}

              <Typography
                component={announcement.url ? Link : 'p'}
                {...(announcement.url ? { href: announcement.url } : {})}
                sx={{
                  display: 'block',
                  fontWeight: isLead ? 700 : 600,
                  fontSize: '0.95rem',
                  color: isLead ? colors.background : colors.textPrimary,
                  lineHeight: 1.3,
                  textDecoration: 'none',
                  ...(announcement.url ? { '&:hover': { textDecoration: 'underline' } } : {}),
                }}
              >
                {announcement.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: '0.875rem',
                  color: isLead ? 'rgba(15, 15, 15, 0.78)' : colors.textSecondary,
                  lineHeight: 1.4,
                }}
              >
                {announcement.content}
              </Typography>
            </Box>
          </Box>
        );
      })}

      {hiddenCount > 0 && (
        <Button
          onClick={() => setExpanded((open) => !open)}
          size="small"
          sx={{
            alignSelf: 'flex-start',
            color: colors.textSecondary,
            textTransform: 'none',
            '&:hover': { color: colors.accent, bgcolor: 'transparent' },
          }}
        >
          {expanded
            ? 'Show less'
            : `${hiddenCount} more ${hiddenCount === 1 ? 'announcement' : 'announcements'}`}
        </Button>
      )}
    </Box>
  );
};

export default StudioAnnouncements;
