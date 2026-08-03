import React from 'react';
import Link from 'next/link';
import { Box, Typography } from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import { colors } from '@/styles/colors';

interface StatCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  trend?: string;
  trendUp?: boolean;
  href?: string;
  onClick?: () => void;
}

const cardShadow = `0 4px 24px rgba(0, 0, 0, 0.4), 0 0 50px ${colors.accent}25`;

export function StatCard({ icon, value, label, trend, trendUp, href, onClick }: StatCardProps) {
  const card = (
    <Box
      onClick={!href && onClick ? onClick : undefined}
      sx={{
        bgcolor: colors.surface,
        border: `1px solid ${colors.accent}35`,
        borderRadius: '12px',
        p: 2,
        boxShadow: cardShadow,
        transition: 'all 0.2s',
        '&:hover': { borderColor: colors.accent },
        ...((href || onClick) ? { cursor: 'pointer' } : {}),
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
        <Box sx={{
          width: 40,
          height: 40,
          bgcolor: `${colors.accent}26`,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: colors.accent
        }}>
          {icon}
        </Box>
        {trend && (
          <Typography sx={{
            fontSize: '0.75rem',
            fontWeight: 500,
            color: trendUp ? colors.success : colors.textSecondary,
            display: 'flex',
            alignItems: 'center',
            gap: 0.25
          }}>
            {trendUp && <TrendingUpIcon sx={{ fontSize: 14 }} />}
            {trend}
          </Typography>
        )}
      </Box>
      <Typography sx={{ fontSize: '1.75rem', fontWeight: 600, color: colors.textPrimary, mb: 0.25 }}>
        {value}
      </Typography>
      <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
        {label}
      </Typography>
    </Box>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none' }}>
        {card}
      </Link>
    );
  }

  return card;
}

export default StatCard;
