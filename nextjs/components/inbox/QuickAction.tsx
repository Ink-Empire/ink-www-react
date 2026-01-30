import React from 'react';
import { Box } from '@mui/material';
import { colors } from '@/styles/colors';

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

export function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        bgcolor: colors.background,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '100px',
        fontSize: '0.8rem',
        color: colors.textSecondary,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: colors.accent,
          color: colors.accent,
        },
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

export default QuickAction;
