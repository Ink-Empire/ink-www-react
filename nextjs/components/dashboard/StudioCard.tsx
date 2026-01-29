import React from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarIcon from '@mui/icons-material/Star';
import { colors } from '@/styles/colors';
import { GuestSpotStudio } from './types';

interface StudioCardProps {
  studio: GuestSpotStudio;
}

export function StudioCard({ studio }: StudioCardProps) {
  return (
    <Box sx={{
      bgcolor: colors.background,
      border: `1px solid ${colors.borderLight}`,
      borderRadius: '8px',
      p: 2,
      transition: 'border-color 0.2s',
      '&:hover': { borderColor: colors.accent }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1.5 }}>
        <Avatar sx={{
          width: 44,
          height: 44,
          bgcolor: colors.surface,
          color: colors.textSecondary,
          fontWeight: 600,
          borderRadius: '6px'
        }}>
          {studio.initials}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontWeight: 600, fontSize: '0.95rem', color: colors.textPrimary }}>
            {studio.name}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
            {studio.location}
          </Typography>
        </Box>
        {studio.seeking && (
          <Box sx={{
            px: 1,
            py: 0.5,
            borderRadius: '100px',
            fontSize: '0.7rem',
            fontWeight: 500,
            bgcolor: `${colors.success}26`,
            color: colors.success
          }}>
            Seeking Guests
          </Box>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 2, mb: 1.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', color: colors.textSecondary }}>
          <VisibilityIcon sx={{ fontSize: 14, color: colors.textMuted }} />
          Viewed {studio.viewedAgo}
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, fontSize: '0.8rem', color: colors.textSecondary }}>
          <StarIcon sx={{ fontSize: 14, color: colors.textMuted }} />
          {studio.rating} ({studio.reviews} reviews)
        </Box>
      </Box>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 2 }}>
        {studio.styles.map(style => (
          <Box key={style} sx={{
            px: 1,
            py: 0.5,
            bgcolor: colors.surface,
            borderRadius: '100px',
            fontSize: '0.7rem',
            color: colors.textSecondary
          }}>
            {style}
          </Box>
        ))}
      </Box>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button sx={{
          flex: 1,
          py: 0.75,
          color: colors.textPrimary,
          border: `1px solid ${colors.borderLight}`,
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 500,
          textTransform: 'none',
          '&:hover': { borderColor: colors.accent, color: colors.accent }
        }}>
          View Studio
        </Button>
        <Button sx={{
          flex: 2,
          py: 0.75,
          bgcolor: colors.accent,
          color: colors.background,
          borderRadius: '6px',
          fontSize: '0.8rem',
          fontWeight: 500,
          textTransform: 'none',
          '&:hover': { bgcolor: colors.accentHover }
        }}>
          Inquire About Guest Spot
        </Button>
      </Box>
    </Box>
  );
}

export default StudioCard;
