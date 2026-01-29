import React from 'react';
import { Box, Typography } from '@mui/material';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { colors } from '@/styles/colors';

interface ComingSoonBadgeProps {
  /** Size variant */
  size?: 'small' | 'medium';
  /** Optional custom label (default: "Coming Soon") */
  label?: string;
  /** Show icon */
  showIcon?: boolean;
}

/**
 * A badge to indicate features that are in development.
 *
 * Usage:
 *   <ComingSoonBadge />
 *   <ComingSoonBadge size="small" />
 *   <ComingSoonBadge label="In Development" />
 */
const ComingSoonBadge: React.FC<ComingSoonBadgeProps> = ({
  size = 'medium',
  label = 'Coming Soon',
  showIcon = true,
}) => {
  const isSmall = size === 'small';

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSmall ? 0.5 : 0.75,
        px: isSmall ? 1 : 1.5,
        py: isSmall ? 0.25 : 0.5,
        bgcolor: colors.infoDim,
        border: `1px solid ${colors.info}40`,
        borderRadius: '100px',
      }}
    >
      {showIcon && (
        <RocketLaunchIcon
          sx={{
            fontSize: isSmall ? 12 : 14,
            color: colors.info,
          }}
        />
      )}
      <Typography
        sx={{
          fontSize: isSmall ? '0.65rem' : '0.75rem',
          fontWeight: 600,
          color: colors.info,
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        {label}
      </Typography>
    </Box>
  );
};

export default ComingSoonBadge;
