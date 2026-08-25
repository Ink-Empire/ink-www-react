import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors } from '@/styles/colors';

interface StudioFilterCardProps {
  selectedStyleFilter?: any;
  setSelectedStyleFilter: (...args: any[]) => void;
  studioStyles?: any;
}

/**
 * Section of the public studio page, extracted so the page and the studio
 * editor render the same markup.
 */
const StudioFilterCard: React.FC<StudioFilterCardProps> = ({
  selectedStyleFilter,
  setSelectedStyleFilter,
  studioStyles,
}) => (
  <>
              {/* Filter Card */}
              <Box sx={{
                bgcolor: colors.surface,
                borderRadius: '12px',
                p: 2,
                border: `1px solid ${colors.border}`
              }}>
                <Box sx={{
                  bgcolor: `${colors.accent}1A`,
                  border: `1px solid ${colors.accent}4D`,
                  borderRadius: '8px',
                  p: 1.5,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1,
                  mb: 1.5
                }}>
                  <Box sx={{ width: 10, height: 10, bgcolor: colors.accent, borderRadius: '50%' }} />
                  <Typography sx={{ fontSize: '0.85rem', color: colors.textPrimary }}>
                    Showing <Box component="strong" sx={{ color: colors.accent }}>{selectedStyleFilter === 'all' ? 'all' : selectedStyleFilter}</Box> work
                  </Typography>
                </Box>

                <Typography sx={{
                  fontSize: '0.8rem',
                  color: colors.textSecondary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  mb: 1
                }}>
                  Filter by style
                </Typography>

                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                  <Box
                    onClick={() => setSelectedStyleFilter('all')}
                    sx={{
                      px: 1.5,
                      py: 0.75,
                      borderRadius: '100px',
                      fontSize: '0.8rem',
                      fontWeight: 500,
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      ...(selectedStyleFilter === 'all' ? {
                        bgcolor: colors.accent,
                        color: colors.background,
                        border: `1px solid ${colors.accent}`
                      } : {
                        bgcolor: colors.background,
                        color: colors.textSecondary,
                        border: `1px solid ${colors.border}`,
                        '&:hover': { borderColor: colors.textSecondary, color: colors.textPrimary }
                      })
                    }}
                  >
                    All
                  </Box>
                  {studioStyles.map((style: string, index: number) => (
                    <Box
                      key={index}
                      onClick={() => setSelectedStyleFilter(style)}
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        borderRadius: '100px',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        ...(selectedStyleFilter === style ? {
                          bgcolor: colors.accent,
                          color: colors.background,
                          border: `1px solid ${colors.accent}`
                        } : {
                          bgcolor: colors.background,
                          color: colors.textSecondary,
                          border: `1px solid ${colors.border}`,
                          '&:hover': { borderColor: colors.textSecondary, color: colors.textPrimary }
                        })
                      }}
                    >
                      {style}
                    </Box>
                  ))}
                </Box>
              </Box>
  </>
);

export default StudioFilterCard;
