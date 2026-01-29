import React from 'react';
import { Box } from '@mui/material';
import { colors } from '@/styles/colors';

interface FilterChipProps {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}

export function FilterChip({ label, count, active, onClick }: FilterChipProps) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.5,
        py: 0.75,
        borderRadius: '100px',
        fontSize: '0.8rem',
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease',
        bgcolor: active ? colors.accent : 'transparent',
        color: active ? colors.background : colors.textSecondary,
        border: `1px solid ${active ? colors.accent : colors.borderLight}`,
        '&:hover': {
          borderColor: active ? colors.accent : colors.textSecondary,
        },
      }}
    >
      {label}
      {count !== undefined && (
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 18,
            height: 18,
            px: 0.5,
            borderRadius: '100px',
            fontSize: '0.7rem',
            bgcolor: 'rgba(0,0,0,0.2)',
          }}
        >
          {count}
        </Box>
      )}
    </Box>
  );
}

export default FilterChip;
