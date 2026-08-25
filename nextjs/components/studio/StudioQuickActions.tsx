import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import ShareIcon from '@mui/icons-material/Share';
import { colors } from '@/styles/colors';

interface StudioQuickActionsProps {
  canContact?: any;
  copied?: any;
  handleContactStudio: (...args: any[]) => void;
  handleSaveStudio: (...args: any[]) => void;
  handleShare: (...args: any[]) => void;
  isSaved?: any;
  studio?: any;
}

/**
 * Section of the public studio page, extracted so the page and the studio
 * editor render the same markup.
 */
const StudioQuickActions: React.FC<StudioQuickActionsProps> = ({
  canContact,
  copied,
  handleContactStudio,
  handleSaveStudio,
  handleShare,
  isSaved,
  studio,
}) => (
  <>
              {/* Quick Actions */}
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
                  Quick Actions
                </Typography>
                {[
                  { icon: <ChatBubbleOutlineIcon sx={{ fontSize: '1.25rem' }} />, label: 'Contact Studio', onClick: handleContactStudio, disabled: !canContact, tooltip: canContact ? '' : 'This studio hasn\'t been claimed yet' },
                  { icon: <BookmarkBorderIcon sx={{ fontSize: '1.25rem' }} />, label: isSaved ? 'Saved' : 'Save Studio', onClick: handleSaveStudio, disabled: false, tooltip: '' },
                  { icon: <ShareIcon sx={{ fontSize: '1.25rem' }} />, label: copied ? 'Copied!' : 'Share Profile', onClick: handleShare, disabled: false, tooltip: '' }
                ].map((action, idx) => (
                  <Tooltip key={idx} title={action.tooltip} arrow>
                    <Box
                      onClick={action.disabled ? undefined : action.onClick}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        p: 1.25,
                        bgcolor: colors.background,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: action.disabled ? colors.textMuted : colors.textPrimary,
                        fontSize: '0.9rem',
                        fontWeight: 500,
                        cursor: action.disabled ? 'not-allowed' : 'pointer',
                        mb: idx < 2 ? 1 : 0,
                        transition: 'all 0.2s',
                        opacity: action.disabled ? 0.6 : 1,
                        '&:hover': action.disabled ? {} : { borderColor: colors.accent, color: colors.accent }
                      }}
                    >
                      <Box sx={{ opacity: 0.7, display: 'flex', alignItems: 'center' }}>{action.icon}</Box>
                      {action.label}
                    </Box>
                  </Tooltip>
                ))}
              </Box>
  </>
);

export default StudioQuickActions;
