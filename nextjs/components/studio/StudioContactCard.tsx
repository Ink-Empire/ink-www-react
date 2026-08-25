import React from 'react';
import { Box, Typography } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LanguageIcon from '@mui/icons-material/Language';
import PhoneIcon from '@mui/icons-material/Phone';
import { colors } from '@/styles/colors';

interface StudioContactCardProps {
  canContact?: any;
  handleContactStudio: (...args: any[]) => void;
  studio?: any;
}

/**
 * Section of the public studio page, extracted so the page and the studio
 * editor render the same markup.
 */
const StudioContactCard: React.FC<StudioContactCardProps> = ({
  canContact,
  handleContactStudio,
  studio,
}) => (
  <>
            {/* Contact */}
            {(canContact || studio.phone || studio.website) && (
              <Box sx={{
                bgcolor: colors.surface,
                borderRadius: '12px',
                p: 3,
                border: `1px solid ${colors.border}`,
                gridColumn: { xs: '1', md: '1 / -1' }
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
                  <ChatBubbleOutlineIcon sx={{ color: colors.accent }} />
                  Contact
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {canContact && (
                    <Box
                      component="button"
                      onClick={handleContactStudio}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        color: colors.accent,
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                        fontSize: 'inherit',
                        '&:hover': { textDecoration: 'underline' }
                      }}
                    >
                      <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
                      Send Message
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
                        '&:hover': { color: colors.accent }
                      }}
                    >
                      <PhoneIcon sx={{ fontSize: 18 }} />
                      {studio.phone}
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
                        '&:hover': { color: colors.accent }
                      }}
                    >
                      <LanguageIcon sx={{ fontSize: 18 }} />
                      {studio.website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                    </Box>
                  )}
                </Box>
              </Box>
            )}
  </>
);

export default StudioContactCard;
