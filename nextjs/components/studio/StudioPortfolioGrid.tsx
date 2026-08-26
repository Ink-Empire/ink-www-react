import React from 'react';
import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import { colors } from '@/styles/colors';

interface StudioPortfolioGridProps {
  filteredPortfolio?: any;
  handleTattooClick: (...args: any[]) => void;
}

/**
 * Section of the public studio page, extracted so the page and the studio
 * editor render the same markup.
 */
const StudioPortfolioGrid: React.FC<StudioPortfolioGridProps> = ({
  filteredPortfolio,
  handleTattooClick,
}) => (
  <>
              {/* Portfolio Grid */}
              {filteredPortfolio.length > 0 ? (
                <Box sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(3, 1fr)' },
                  gap: 1.5
                }}>
                  {filteredPortfolio.map((tattoo: any, index: number) => {
                    const isFeatured = index === 0;
                    const tattooStyle = tattoo.styles?.[0];
                    const styleName = typeof tattooStyle === 'string' ? tattooStyle : tattooStyle?.name;

                    return (
                      <Box
                        key={tattoo.id}
                        onClick={() => handleTattooClick(tattoo.id.toString())}
                        sx={{
                          aspectRatio: '1',
                          bgcolor: colors.background,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          cursor: 'pointer',
                          position: 'relative',
                          transition: 'all 0.3s ease',
                          ...(isFeatured && {
                            gridColumn: { xs: 'span 2', sm: 'span 2' },
                            gridRow: { xs: 'span 1', sm: 'span 2' }
                          }),
                          '&:hover': {
                            transform: 'scale(1.02)',
                            zIndex: 2,
                            '& img': { transform: 'scale(1.05)' },
                            '& .overlay': { opacity: 1 }
                          }
                        }}
                      >
                        {tattoo.primary_image?.uri ? (
                          <Image
                            src={tattoo.primary_image.uri}
                            alt={tattoo.title || 'Tattoo work'}
                            fill
                            style={{ objectFit: 'cover', transition: 'transform 0.3s ease' }}
                          />
                        ) : (
                          <Box sx={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: colors.textSecondary,
                            fontSize: '0.8rem',
                            background: `linear-gradient(135deg, ${colors.background} 0%, ${colors.surface} 100%)`
                          }}>
                            No Image
                          </Box>
                        )}

                        {/* Overlay */}
                        <Box
                          className="overlay"
                          sx={{
                            position: 'absolute',
                            inset: 0,
                            background: 'linear-gradient(to top, rgba(15, 15, 15, 0.9) 0%, transparent 50%)',
                            opacity: 0,
                            transition: 'opacity 0.3s ease',
                            display: 'flex',
                            alignItems: 'flex-end',
                            p: 1.5
                          }}
                        >
                          <Box>
                            {styleName && (
                              <Typography sx={{
                                fontSize: '0.7rem',
                                color: colors.accent,
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                mb: 0.25
                              }}>
                                {styleName}
                              </Typography>
                            )}
                            <Typography sx={{
                              fontSize: '0.9rem',
                              fontWeight: 500,
                              color: colors.textPrimary
                            }}>
                              {tattoo.title || 'Untitled'}
                            </Typography>
                            {tattoo.artist_name && (
                              <Typography sx={{
                                fontSize: '0.8rem',
                                color: colors.textSecondary
                              }}>
                                by {tattoo.artist_name}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography sx={{ color: colors.textSecondary }}>No portfolio items found.</Typography>
                </Box>
              )}
  </>
);

export default StudioPortfolioGrid;
