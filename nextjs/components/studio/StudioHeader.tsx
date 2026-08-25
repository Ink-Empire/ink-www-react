import React from 'react';
import { Box, Button, Tooltip, Typography } from '@mui/material';
import Image from 'next/image';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import VerifiedIcon from '@mui/icons-material/Verified';
import { colors } from '@/styles/colors';

interface StudioHeaderProps {
  artists?: any;
  canContact?: any;
  handleContactStudio: (...args: any[]) => void;
  handleSaveStudio: (...args: any[]) => void;
  isSaved?: any;
  studio?: any;
  studioStyles?: any;
}

/**
 * Section of the public studio page, extracted so the page and the studio
 * editor render the same markup.
 */
const StudioHeader: React.FC<StudioHeaderProps> = ({
  artists,
  canContact,
  handleContactStudio,
  handleSaveStudio,
  isSaved,
  studio,
  studioStyles,
}) => (
  <>
        {/* Studio Header */}
        <Box sx={{
          display: 'flex',
          gap: 3,
          mb: 4,
          pb: 3,
          borderBottom: `1px solid ${colors.border}`,
          flexWrap: { xs: 'wrap', md: 'nowrap' }
        }}>
          {/* Avatar */}
          {(studio.image?.uri || studio.primary_image?.uri) ? (
            <Box sx={{
              width: 120,
              height: 120,
              position: 'relative',
              borderRadius: '12px',
              overflow: 'hidden',
              flexShrink: 0,
              border: `2px solid ${colors.accent}4D`
            }}>
              <Image
                src={studio.image?.uri || studio.primary_image?.uri}
                alt={studio.name || 'Studio'}
                fill
                style={{ objectFit: 'cover' }}
              />
            </Box>
          ) : (
            <Box sx={{
              width: 120,
              height: 120,
              bgcolor: colors.surface,
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '2.5rem',
              fontWeight: 600,
              color: colors.accent,
              border: `2px solid ${colors.accent}4D`,
              flexShrink: 0
            }}>
              {studio.name?.substring(0, 2).toUpperCase() || 'ST'}
            </Box>
          )}

          {/* Studio Details */}
          <Box sx={{ flex: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '2.5rem',
                fontWeight: 500,
                color: colors.textPrimary,
                lineHeight: 1.2
              }}>
                {studio.name}
              </Typography>
              <VerifiedIcon sx={{ fontSize: 24, color: '#6495ED' }} />
            </Box>

            {studio.location && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: colors.textSecondary, mb: 0.75 }}>
                <LocationOnIcon sx={{ fontSize: 18, color: colors.accent }} />
                {studio.location}
              </Box>
            )}

            {/* Artists count */}
            {artists && artists.length > 0 && (
              <Typography sx={{ color: colors.textSecondary, mb: 1 }}>
                {artists.length} {artists.length === 1 ? 'Artist' : 'Artists'}
              </Typography>
            )}

            {/* About */}
            {studio.about && (
              <Typography sx={{
                color: colors.textSecondary,
                fontSize: '0.95rem',
                lineHeight: 1.7,
                maxWidth: 500,
                mb: 1
              }}>
                {studio.about}
              </Typography>
            )}

            {/* Style Tags */}
            {studioStyles.length > 0 && (
              <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: studio.seeking_guest_artists ? 1 : 0 }}>
                {studioStyles.slice(0, 5).map((styleName: string, index: number) => (
                  <Box key={index} sx={{
                    px: 1.25,
                    py: 0.5,
                    bgcolor: `${colors.accent}1A`,
                    borderRadius: '100px',
                    fontSize: '0.8rem',
                    color: colors.accent,
                    fontWeight: 500
                  }}>
                    {styleName}
                  </Box>
                ))}
              </Box>
            )}

            {/* Seeking Guest Artists Badge */}
            {studio.seeking_guest_artists && (
              <Box>
                <Box sx={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 0.75,
                  px: 1.5,
                  py: 0.5,
                  bgcolor: `${colors.success}1A`,
                  border: `1px solid ${colors.success}4D`,
                  borderRadius: '100px',
                  fontSize: '0.85rem',
                  color: colors.success,
                  fontWeight: 500
                }}>
                  <FlightTakeoffIcon sx={{ fontSize: 16 }} />
                  Seeking Guest Artists
                </Box>
                {studio.guest_spot_details && (
                  <Typography sx={{
                    fontSize: '0.85rem',
                    color: colors.textSecondary,
                    mt: 0.75,
                    fontStyle: 'italic'
                  }}>
                    {studio.guest_spot_details}
                  </Typography>
                )}
              </Box>
            )}
          </Box>

          {/* Studio Actions */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            alignItems: { xs: 'stretch', md: 'flex-end' },
            justifyContent: 'center',
            width: { xs: '100%', md: 'auto' }
          }}>
            <Tooltip
              title={canContact ? '' : 'This studio hasn\'t been claimed yet'}
              arrow
            >
              <span>
                <Button
                  onClick={handleContactStudio}
                  disabled={!canContact}
                  sx={{
                    minWidth: 180,
                    py: 1,
                    bgcolor: canContact ? colors.accent : colors.backgroundLight,
                    color: canContact ? colors.background : colors.textMuted,
                    textTransform: 'none',
                    fontWeight: 500,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.75,
                    '&:hover': { bgcolor: canContact ? colors.accentHover : colors.backgroundLight },
                    '&.Mui-disabled': {
                      bgcolor: colors.backgroundLight,
                      color: colors.textMuted,
                    }
                  }}
                >
                  <ChatBubbleOutlineIcon sx={{ fontSize: 18 }} />
                  Contact Studio
                </Button>
              </span>
            </Tooltip>
            <Button
              onClick={handleSaveStudio}
              sx={{
                minWidth: 180,
                py: 1,
                color: isSaved ? colors.accent : colors.textPrimary,
                border: `1px solid ${isSaved ? colors.accent : colors.border}`,
                textTransform: 'none',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 0.75,
                '&:hover': { borderColor: colors.accent, color: colors.accent }
              }}
            >
              <BookmarkBorderIcon sx={{ fontSize: 18 }} />
              {isSaved ? 'Saved' : 'Save'}
            </Button>
          </Box>
        </Box>
  </>
);

export default StudioHeader;
