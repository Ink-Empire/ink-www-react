import React from 'react';
import { Box, Typography } from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import NavigationIcon from '@mui/icons-material/Navigation';
import { colors } from '@/styles/colors';

interface StudioLocationHoursProps {
  studio?: any;
}

/**
 * Section of the public studio page, extracted so the page and the studio
 * editor render the same markup.
 */
const StudioLocationHours: React.FC<StudioLocationHoursProps> = ({
  studio,
}) => (
  <>
            {/* Location & Hours */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 3,
              border: `1px solid ${colors.border}`
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.5rem',
                fontWeight: 500,
                mb: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                <LocationOnIcon sx={{ color: colors.accent }} />
                Location
              </Typography>
              <Typography sx={{ color: colors.textSecondary, mb: 2, lineHeight: 1.6 }}>
                {studio.address && <>{studio.address}<br /></>}
                {studio.city && studio.state && `${studio.city}, ${studio.state}`} {studio.postal_code}
              </Typography>
              {studio.address && (
                <Box
                  component="a"
                  href={`https://maps.google.com/?q=${encodeURIComponent(`${studio.address}, ${studio.city}, ${studio.state}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 0.5,
                    color: colors.accent,
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  <NavigationIcon sx={{ fontSize: 16 }} />
                  Get Directions
                </Box>
              )}
            </Box>
  </>
);

export default StudioLocationHours;
