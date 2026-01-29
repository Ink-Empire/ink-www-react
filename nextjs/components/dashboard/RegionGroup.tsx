import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors } from '@/styles/colors';
import { GuestSpotRegion } from './types';
import { StudioCard } from './StudioCard';

interface RegionGroupProps {
  region: GuestSpotRegion;
  isLast: boolean;
}

export function RegionGroup({ region, isLast }: RegionGroupProps) {
  return (
    <Box sx={{
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
        <Typography sx={{ fontSize: '1.5rem' }}>{region.flag}</Typography>
        <Box>
          <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: colors.textPrimary }}>
            {region.region}
          </Typography>
          <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
            {region.studioCount} studio{region.studioCount !== 1 ? 's' : ''} viewed your profile
          </Typography>
        </Box>
      </Box>
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(auto-fill, minmax(300px, 1fr))' },
        gap: 2
      }}>
        {region.studios.map(studio => (
          <StudioCard key={studio.id} studio={studio} />
        ))}
      </Box>
    </Box>
  );
}

export default RegionGroup;
