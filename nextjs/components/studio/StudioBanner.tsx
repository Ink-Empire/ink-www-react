import React from 'react';
import { Box } from '@mui/material';
import Image from 'next/image';
import { colors } from '@/styles/colors';

interface StudioBannerProps {
  studio?: any;
}

/**
 * Section of the public studio page, extracted so the page and the studio
 * editor render the same markup.
 */
const StudioBanner: React.FC<StudioBannerProps> = ({
  studio,
}) => (
  <>
        {/* Banner - only when the studio has set one. Without it the header
            below is exactly the layout every studio has always had. */}
        {studio.banner?.uri && (
          <Box sx={{
            position: 'relative',
            width: '100%',
            aspectRatio: '4 / 1',
            minHeight: { xs: 110, md: 180 },
            borderRadius: '12px',
            overflow: 'hidden',
            mb: 3,
            border: `1px solid ${colors.border}`,
            bgcolor: colors.surface,
          }}>
            <Image
              src={studio.banner.uri}
              alt={`${studio.name || 'Studio'} banner`}
              fill
              sizes="(max-width: 1200px) 100vw, 1200px"
              style={{ objectFit: 'cover' }}
              priority
            />
          </Box>
        )}
  </>
);

export default StudioBanner;
