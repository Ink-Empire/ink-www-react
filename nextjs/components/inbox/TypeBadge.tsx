import React from 'react';
import { Box } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BrushIcon from '@mui/icons-material/Brush';
import { colors } from '@/styles/colors';
import { ConversationType } from '@/hooks/useConversations';

interface TypeBadgeProps {
  type: ConversationType;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  const config = {
    booking: {
      icon: <CalendarMonthIcon sx={{ fontSize: 10 }} />,
      label: 'Booking',
      bgcolor: colors.successDim,
      color: colors.success,
    },
    consultation: {
      icon: <HelpOutlineIcon sx={{ fontSize: 10 }} />,
      label: 'Consultation',
      bgcolor: colors.infoDim,
      color: colors.info,
    },
    'guest-spot': {
      icon: <LocationOnIcon sx={{ fontSize: 10 }} />,
      label: 'Guest Spot',
      bgcolor: colors.warningDim,
      color: colors.warning,
    },
    design: {
      icon: <BrushIcon sx={{ fontSize: 10 }} />,
      label: 'Design',
      bgcolor: colors.accentDim,
      color: colors.accent,
    },
  };

  const { icon, label, bgcolor, color } = config[type] || config.booking;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: '100px',
        fontSize: '0.7rem',
        fontWeight: 500,
        bgcolor,
        color,
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

export default TypeBadge;
