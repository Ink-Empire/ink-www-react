import React from 'react';
import { Box, Typography } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EmailIcon from '@mui/icons-material/Email';
import InstagramIcon from '@mui/icons-material/Instagram';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneIcon from '@mui/icons-material/Phone';
import { colors } from '@/styles/colors';

interface StudioInfoCardProps {
  studio?: any;
  todayHours?: any;
}

/**
 * Section of the public studio page, extracted so the page and the studio
 * editor render the same markup.
 */
const StudioInfoCard: React.FC<StudioInfoCardProps> = ({
  studio,
  todayHours,
}) => (
  <>
              {/* Studio Info Card */}
              <Box sx={{
                bgcolor: colors.surface,
                borderRadius: '12px',
                p: 2,
                border: `1px solid ${colors.border}`
              }}>
                <Typography sx={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  mb: 1.5,
                  color: colors.textPrimary
                }}>
                  Studio Info
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {todayHours && (
                    <Box sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      color: colors.textSecondary,
                      fontSize: '0.9rem',
                    }}>
                      <AccessTimeIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                      <span>
                        Today:{' '}
                        <Box component="span" sx={{ color: colors.textPrimary }}>
                          {todayHours.hours}
                        </Box>
                      </span>
                    </Box>
                  )}
                  {studio.phone && (
                    <Box
                      component="a"
                      href={`tel:${studio.phone}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: colors.textSecondary,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.15s ease',
                        '&:hover': { color: colors.accent }
                      }}
                    >
                      <PhoneIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                      {studio.phone}
                    </Box>
                  )}
                  {studio.email && (
                    <Box
                      component="a"
                      href={`mailto:${studio.email}`}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: colors.textSecondary,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.15s ease',
                        '&:hover': { color: colors.accent }
                      }}
                    >
                      <EmailIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                      {studio.email}
                    </Box>
                  )}
                  {studio.website && (
                    <Box
                      component="a"
                      href={studio.website.startsWith('http') ? studio.website : `https://${studio.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: colors.textSecondary,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.15s ease',
                        '&:hover': { color: colors.accent }
                      }}
                    >
                      <LanguageIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                      {studio.website.replace(/^https?:\/\//, '')}
                    </Box>
                  )}
                  {studio.instagram && (
                    <Box
                      component="a"
                      href={`https://instagram.com/${studio.instagram}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: colors.textSecondary,
                        textDecoration: 'none',
                        fontSize: '0.9rem',
                        transition: 'color 0.15s ease',
                        '&:hover': { color: colors.accent }
                      }}
                    >
                      <InstagramIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                      @{studio.instagram}
                    </Box>
                  )}
                </Box>
              </Box>
  </>
);

export default StudioInfoCard;
