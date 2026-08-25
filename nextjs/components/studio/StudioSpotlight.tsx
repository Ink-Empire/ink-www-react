import React from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { colors } from '@/styles/colors';

interface StudioSpotlightProps {
  artists?: any;
  handleTattooClick: (...args: any[]) => void;
  slug?: any;
  spotlights?: any;
  studio?: any;
  router?: any;
}

/**
 * Section of the public studio page, extracted so the page and the studio
 * editor render the same markup.
 */
const StudioSpotlight: React.FC<StudioSpotlightProps> = ({
  artists,
  handleTattooClick,
  slug,
  spotlights,
  studio,
  router,
}) => (
  <>
        {/* Spotlights - hidden entirely when the studio has pinned nothing */}
        {spotlights.length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '1.35rem',
              fontWeight: 500,
              color: colors.textPrimary,
              mb: 1.5,
            }}>
              Spotlight
            </Typography>

            <Box sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pb: 1,
              '&::-webkit-scrollbar': { height: 6 },
              '&::-webkit-scrollbar-track': { bgcolor: colors.background, borderRadius: 3 },
              '&::-webkit-scrollbar-thumb': { bgcolor: colors.border, borderRadius: 3 },
            }}>
              {spotlights.map((spotlight: any) => {
                const item = spotlight.item;
                if (!item) return null;

                const isArtist = spotlight.type === 'artist';
                const imageUri = isArtist ? item.image?.uri : item.primary_image?.uri;
                const label = isArtist ? item.name : (item.title || 'Untitled');
                const caption = isArtist ? 'Artist' : (item.primary_style || 'Tattoo');

                return (
                  <Box
                    key={spotlight.id}
                    onClick={() => isArtist
                      ? router.push(`/artists/${item.slug}`)
                      : handleTattooClick(String(item.id))}
                    sx={{
                      flexShrink: 0,
                      width: 150,
                      cursor: 'pointer',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      bgcolor: colors.surface,
                      border: `1px solid ${colors.border}`,
                      transition: 'border-color 0.2s',
                      '&:hover': { borderColor: colors.accent },
                    }}
                  >
                    <Box sx={{
                      position: 'relative',
                      width: '100%',
                      height: 150,
                      bgcolor: colors.background,
                    }}>
                      {imageUri ? (
                        <Image
                          src={imageUri}
                          alt={label || 'Spotlight'}
                          fill
                          sizes="150px"
                          style={{ objectFit: 'cover' }}
                        />
                      ) : (
                        <Box sx={{
                          width: '100%',
                          height: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: colors.accent,
                          fontFamily: '"Cormorant Garamond", Georgia, serif',
                          fontSize: '2rem',
                        }}>
                          {label?.substring(0, 2).toUpperCase() || '--'}
                        </Box>
                      )}
                    </Box>

                    <Box sx={{ p: 1.25 }}>
                      <Typography noWrap sx={{
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        color: colors.textPrimary,
                      }}>
                        {label}
                      </Typography>
                      <Typography noWrap sx={{ fontSize: '0.75rem', color: colors.textSecondary }}>
                        {caption}
                      </Typography>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
  </>
);

export default StudioSpotlight;
