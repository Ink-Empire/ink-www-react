import React from 'react';
import { Box, Typography, Switch } from '@mui/material';
import { colors } from '@/styles/colors';

interface BookingOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked: boolean;
  onChange: () => void;
  disabled?: boolean;
}

export const BookingOption: React.FC<BookingOptionProps> = ({
  icon,
  title,
  description,
  checked,
  onChange,
  disabled = false
}) => (
  <Box sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    p: '1rem 1.25rem',
    bgcolor: colors.background,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    transition: 'border-color 0.2s ease',
    '&:hover': { borderColor: colors.borderLight }
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <Box sx={{
        width: 40,
        height: 40,
        bgcolor: checked ? `${colors.accent}26` : colors.surface,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: checked ? colors.accent : colors.textSecondary
      }}>
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontSize: '0.95rem', fontWeight: 500, color: colors.textPrimary, mb: '0.15rem' }}>
          {title}
        </Typography>
        <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
          {description}
        </Typography>
      </Box>
    </Box>
    <Switch
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      sx={{
        '& .MuiSwitch-switchBase': {
          '&.Mui-checked': {
            color: colors.accent,
            '& + .MuiSwitch-track': { bgcolor: colors.accent }
          }
        },
        '& .MuiSwitch-track': { bgcolor: '#242424' }
      }}
    />
  </Box>
);

export default BookingOption;
