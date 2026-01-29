import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors } from '@/styles/colors';

interface FormGroupProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export const FormGroup: React.FC<FormGroupProps> = ({ label, hint, children }) => (
  <Box sx={{ mb: '1.25rem', '&:last-child': { mb: 0 } }}>
    <Typography sx={{
      fontSize: '0.85rem',
      fontWeight: 500,
      color: colors.textSecondary,
      mb: '0.5rem'
    }}>
      {label}
    </Typography>
    {children}
    {hint && (
      <Typography sx={{
        fontSize: '0.8rem',
        color: colors.textSecondary,
        mt: '0.35rem',
        opacity: 0.7
      }}>
        {hint}
      </Typography>
    )}
  </Box>
);

export default FormGroup;
