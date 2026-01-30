import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { colors } from '@/styles/colors';

interface DashboardTabProps {
  label: string;
  initials: string;
  imageUrl?: string;
  isActive: boolean;
  onClick: () => void;
  accentAvatar?: boolean;
}

export function DashboardTab({ label, initials, imageUrl, isActive, onClick, accentAvatar }: DashboardTabProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        pb: 1.5,
        px: 0.5,
        cursor: 'pointer',
        borderBottom: isActive ? `2px solid ${colors.accent}` : '2px solid transparent',
        mb: '-1px',
        transition: 'border-color 0.2s',
        '&:hover': {
          borderColor: isActive ? colors.accent : colors.borderLight
        }
      }}
    >
      <Avatar
        src={imageUrl}
        sx={{
          width: 32,
          height: 32,
          bgcolor: accentAvatar ? colors.accent : colors.surface,
          color: accentAvatar ? colors.background : colors.textSecondary,
          fontSize: '0.75rem',
          fontWeight: 600
        }}
      >
        {initials}
      </Avatar>
      <Typography sx={{
        fontSize: '0.95rem',
        fontWeight: isActive ? 600 : 500,
        color: isActive ? colors.textPrimary : colors.textSecondary
      }}>
        {label}
      </Typography>
    </Box>
  );
}

export default DashboardTab;
