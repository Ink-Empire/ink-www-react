import React from 'react';
import { Box, Modal, IconButton, Typography, Slide } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { colors } from '@/styles/colors';
import { useMobile } from '@/hooks/useMobile';

interface ResponsiveModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  maxWidth?: number;
  showCloseButton?: boolean;
  headerRight?: React.ReactNode;
}

/**
 * ResponsiveModal - Modal on desktop, bottom sheet on mobile
 *
 * This component provides a consistent modal experience across devices:
 * - Desktop: Centered modal with max-width
 * - Mobile: Bottom sheet that slides up from bottom
 *
 * Designed to be easily adapted for React Native where it would
 * use a native bottom sheet library (e.g., @gorhom/bottom-sheet)
 */
export function ResponsiveModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 480,
  showCloseButton = true,
  headerRight,
}: ResponsiveModalProps) {
  const isMobile = useMobile();

  if (isMobile) {
    return (
      <Modal
        open={open}
        onClose={onClose}
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
        slotProps={{
          backdrop: {
            sx: {
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
            },
          },
        }}
      >
        <Slide direction="up" in={open} mountOnEnter unmountOnExit>
          <Box
            sx={{
              bgcolor: colors.surface,
              borderRadius: '20px 20px 0 0',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              pb: 'env(safe-area-inset-bottom, 16px)',
            }}
          >
            {/* Drag handle indicator */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                pt: 1.5,
                pb: 1,
              }}
            >
              <Box
                sx={{
                  width: 40,
                  height: 4,
                  bgcolor: colors.border,
                  borderRadius: 2,
                }}
              />
            </Box>

            {/* Header */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                px: 2.5,
                pb: 2,
              }}
            >
              <Box sx={{ flex: 1 }}>
                {title && (
                  <Typography
                    sx={{
                      fontFamily: '"Cormorant Garamond", Georgia, serif',
                      fontSize: '1.375rem',
                      fontWeight: 500,
                      color: colors.textPrimary,
                    }}
                  >
                    {title}
                  </Typography>
                )}
                {subtitle}
              </Box>
              {(showCloseButton || headerRight) && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {headerRight}
                  {showCloseButton && (
                    <IconButton
                      onClick={onClose}
                      sx={{
                        bgcolor: colors.background,
                        border: `1px solid ${colors.border}`,
                        borderRadius: '8px',
                        color: colors.textSecondary,
                        p: 1,
                        minWidth: 44,
                        minHeight: 44,
                        '&:hover': {
                          bgcolor: colors.surface,
                          color: colors.textPrimary,
                        },
                      }}
                    >
                      <CloseIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>

            {/* Content */}
            <Box sx={{ px: 2.5, pb: 2 }}>{children}</Box>
          </Box>
        </Slide>
      </Modal>
    );
  }

  // Desktop modal
  return (
    <Modal
      open={open}
      onClose={onClose}
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Box
        sx={{
          bgcolor: colors.surface,
          borderRadius: '16px',
          p: 3,
          width: '100%',
          maxWidth,
          border: `1px solid ${colors.accent}33`,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          mx: 2,
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 2,
          }}
        >
          <Box>
            {title && (
              <Typography
                sx={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: '1.5rem',
                  fontWeight: 500,
                  color: colors.textPrimary,
                }}
              >
                {title}
              </Typography>
            )}
            {subtitle}
          </Box>
          {(showCloseButton || headerRight) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {headerRight}
              {showCloseButton && (
                <IconButton
                  onClick={onClose}
                  sx={{
                    bgcolor: colors.background,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '8px',
                    color: colors.textSecondary,
                    '&:hover': {
                      bgcolor: colors.surface,
                      color: colors.textPrimary,
                    },
                  }}
                >
                  <CloseIcon />
                </IconButton>
              )}
            </Box>
          )}
        </Box>

        {/* Content */}
        {children}
      </Box>
    </Modal>
  );
}

export default ResponsiveModal;
