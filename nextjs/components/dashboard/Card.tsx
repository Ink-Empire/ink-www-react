import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors } from '@/styles/colors';

interface CardProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
}

const cardShadow = `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 50px ${colors.accent}25`;

export function Card({ title, subtitle, action, children, icon, badge }: CardProps) {
  return (
    <Box sx={{
      bgcolor: colors.surface,
      border: `1px solid ${colors.accent}35`,
      borderRadius: '12px',
      overflow: 'hidden',
      boxShadow: cardShadow,
    }}>
      <Box sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        justifyContent: 'space-between',
        alignItems: { xs: 'flex-start', sm: 'flex-start' },
        gap: { xs: 1, sm: 0 },
        p: 2,
        borderBottom: `1px solid ${colors.border}`
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {icon && (
            <Box sx={{ color: colors.accent }}>
              {icon}
            </Box>
          )}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.textPrimary }}>
                {title}
              </Typography>
              {badge}
            </Box>
            {subtitle && (
              <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted, mt: 0.25 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}

export default Card;
