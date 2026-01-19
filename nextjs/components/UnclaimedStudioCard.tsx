import React from 'react';
import Link from 'next/link';
import { Box, Typography, Button, Avatar } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BusinessIcon from '@mui/icons-material/Business';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import StarIcon from '@mui/icons-material/Star';
import { colors } from '@/styles/colors';

interface UnclaimedStudio {
  id: number;
  name: string;
  location?: string;
  rating?: number;
  weekly_impressions?: number;
}

interface UnclaimedStudioCardProps {
  studio: UnclaimedStudio;
}

const UnclaimedStudioCard: React.FC<UnclaimedStudioCardProps> = ({ studio }) => {
  return (
    <Box
      sx={{
        bgcolor: colors.surface,
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px dashed ${colors.border}`,
        transition: 'all 0.25s ease',
        '&:hover': {
          borderColor: `${colors.accent}4D`,
        },
      }}
    >
      {/* Header - fixed height for consistency */}
      <Box sx={{ p: 2, height: 88, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
        <Avatar
          sx={{
            width: 48,
            height: 48,
            bgcolor: colors.surfaceElevated,
            flexShrink: 0,
          }}
        >
          <BusinessIcon sx={{ color: colors.textMuted }} />
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            variant="subtitle1"
            sx={{
              color: colors.textPrimary,
              fontWeight: 600,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {studio.name}
          </Typography>
          {studio.location && (
            <Typography
              variant="body2"
              sx={{
                color: colors.textSecondary,
                fontSize: '0.8rem',
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                mt: 0.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              <LocationOnIcon sx={{ fontSize: 14, flexShrink: 0 }} />
              <Box component="span" sx={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {studio.location}
              </Box>
            </Typography>
          )}
        </Box>
        {studio.rating && studio.rating > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 0.5,
              color: colors.accent,
              flexShrink: 0,
            }}
          >
            <StarIcon sx={{ fontSize: 16 }} />
            <Typography variant="body2" sx={{ fontWeight: 500 }}>
              {studio.rating}
            </Typography>
          </Box>
        )}
      </Box>

      {/* CTA Area */}
      <Box
        sx={{
          bgcolor: colors.surfaceElevated,
          aspectRatio: '1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3,
          textAlign: 'center',
        }}
      >
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            bgcolor: colors.accentDim,
            border: `1px solid ${colors.accent}4D`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
          }}
        >
          <AddIcon sx={{ fontSize: 32, color: colors.accent }} />
        </Box>
        <Typography
          variant="body2"
          sx={{ color: colors.textSecondary, mb: 2 }}
        >
          This studio hasn't joined InkedIn yet
        </Typography>
        <Button
          component={Link}
          href="/register"
          variant="contained"
          sx={{
            bgcolor: colors.accent,
            color: colors.textOnLight,
            textTransform: 'none',
            fontWeight: 500,
            px: 3,
            py: 1,
            borderRadius: '24px',
            '&:hover': {
              bgcolor: colors.accentHover,
            },
          }}
        >
          Is this your studio?
        </Button>
      </Box>

      {/* Footer with impressions */}
      {studio.weekly_impressions !== undefined && studio.weekly_impressions > 0 && (
        <Box
          sx={{
            px: 2,
            py: 1.5,
            borderTop: `1px solid ${colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          <VisibilityIcon sx={{ fontSize: 16, color: colors.textMuted }} />
          <Typography variant="body2" sx={{ color: colors.textMuted, fontSize: '0.8rem' }}>
            Appeared in {studio.weekly_impressions} searches this week
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default UnclaimedStudioCard;
