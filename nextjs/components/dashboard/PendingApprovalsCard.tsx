import React, { useState } from 'react';
import {
  Box, Typography, Button, Avatar, CircularProgress,
  Snackbar, Alert, Dialog, DialogContent, IconButton, useMediaQuery, useTheme,
} from '@mui/material';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import { colors } from '@/styles/colors';
import { tattooService } from '@/services/tattooService';
import { usePendingApprovals } from '@/hooks/usePendingApprovals';
import { clearCache } from '@/utils/apiCache';

interface PendingApprovalsDialogProps {
  open: boolean;
  onClose: () => void;
}

export function usePendingApprovalsCount() {
  const { pendingTattoos, loading } = usePendingApprovals();
  return { count: pendingTattoos.length, loading };
}

export function PendingApprovalsDialog({ open, onClose }: PendingApprovalsDialogProps) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { pendingTattoos, loading, removeTattoo } = usePendingApprovals();
  const [respondingId, setRespondingId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false, message: '', severity: 'success',
  });

  const handleRespond = async (tattooId: number, action: 'approve' | 'reject') => {
    setRespondingId(tattooId);
    try {
      await tattooService.respondToTag(tattooId, action);
      removeTattoo(tattooId);
      clearCache('tattoo');
      clearCache('artist');
      setSnackbar({
        open: true,
        severity: 'success',
        message: action === 'approve'
          ? 'Tattoo approved and added to your profile.'
          : "Tag declined. The tattoo remains on the user's profile.",
      });
      // Auto-close dialog if no more pending
      if (pendingTattoos.length <= 1) {
        setTimeout(onClose, 600);
      }
    } catch (err: any) {
      setSnackbar({
        open: true,
        severity: 'error',
        message: err.message || 'Something went wrong',
      });
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullScreen={isMobile}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            backgroundImage: 'none',
            borderRadius: isMobile ? 0 : '16px',
            maxHeight: isMobile ? '100%' : '85vh',
            border: `1px solid ${colors.accent}50`,
            boxShadow: `0 8px 32px rgba(0, 0, 0, 0.5), 0 0 80px ${colors.accent}30`,
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: `1px solid ${colors.border}`,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <HowToRegIcon sx={{ color: colors.accent }} />
            <Box>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.textPrimary }}>
                Pending Approvals
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                Clients tagged you in these tattoos
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{ color: colors.textMuted, '&:hover': { color: colors.textPrimary } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 0 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
              <CircularProgress sx={{ color: colors.accent }} />
            </Box>
          ) : pendingTattoos.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6, px: 3 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 48, color: colors.textMuted, mb: 1.5 }} />
              <Typography sx={{ fontSize: '1rem', fontWeight: 600, color: colors.textPrimary, mb: 0.5 }}>
                All caught up
              </Typography>
              <Typography sx={{ fontSize: '0.85rem', color: colors.textMuted }}>
                No pending approvals right now.
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              {pendingTattoos.map((tattoo, index) => {
                const imageUri = tattoo.primary_image?.uri || tattoo.images?.[0]?.uri;
                const isResponding = respondingId === tattoo.id;
                const uploaderName = tattoo.uploader?.name || 'Unknown user';

                return (
                  <Box
                    key={tattoo.id}
                    sx={{
                      p: { xs: 2, sm: 2.5 },
                      borderBottom: index < pendingTattoos.length - 1
                        ? `1px solid ${colors.border}`
                        : 'none',
                    }}
                  >
                    {/* Action buttons at top of card */}
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1.5 }}>
                      <Button
                        onClick={() => handleRespond(tattoo.id, 'reject')}
                        disabled={isResponding}
                        size="small"
                        startIcon={isResponding ? null : <CloseIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          color: colors.error,
                          border: `1px solid ${colors.error}40`,
                          fontSize: '0.75rem',
                          fontWeight: 500,
                          textTransform: 'none',
                          borderRadius: '6px',
                          '&:hover': { bgcolor: `${colors.error}15` },
                          '&:disabled': { borderColor: colors.border, color: colors.textMuted },
                        }}
                      >
                        Decline
                      </Button>
                      <Button
                        onClick={() => handleRespond(tattoo.id, 'approve')}
                        disabled={isResponding}
                        size="small"
                        startIcon={isResponding ? <CircularProgress size={14} /> : <CheckIcon sx={{ fontSize: 14 }} />}
                        sx={{
                          px: 1.5,
                          py: 0.5,
                          bgcolor: colors.accent,
                          color: colors.background,
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          textTransform: 'none',
                          borderRadius: '6px',
                          '&:hover': { bgcolor: colors.accentHover },
                          '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
                        }}
                      >
                        Accept tag
                      </Button>
                    </Box>

                    {/* Tattoo image */}
                    {imageUri ? (
                      <Box
                        component="img"
                        src={imageUri}
                        alt="Pending tattoo"
                        sx={{
                          width: '100%',
                          maxHeight: 320,
                          objectFit: 'cover',
                          borderRadius: '10px',
                          border: `1px solid ${colors.border}`,
                          mb: 1.5,
                        }}
                      />
                    ) : (
                      <Box sx={{
                        width: '100%',
                        height: 200,
                        bgcolor: colors.background,
                        borderRadius: '10px',
                        border: `1px solid ${colors.border}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mb: 1.5,
                      }}>
                        <Typography sx={{ color: colors.textMuted, fontSize: '2rem' }}>?</Typography>
                      </Box>
                    )}

                    {/* Footer: uploader info + description */}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <Avatar
                            src={tattoo.uploader?.image?.uri}
                            sx={{
                              width: 24, height: 24,
                              bgcolor: colors.accent,
                              color: colors.background,
                              fontSize: '0.6rem',
                              fontWeight: 600,
                            }}
                          >
                            {uploaderName.slice(0, 2).toUpperCase()}
                          </Avatar>
                          <Typography sx={{ fontSize: '0.85rem', fontWeight: 500, color: colors.textPrimary }}>
                            {uploaderName}
                          </Typography>
                        </Box>
                        {tattoo.description && (
                          <Typography sx={{
                            fontSize: '0.8rem',
                            color: colors.textSecondary,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {tattoo.description}
                          </Typography>
                        )}
                      </Box>
                      {tattoo.created_at && (
                        <Typography sx={{ fontSize: '0.7rem', color: colors.textMuted, flexShrink: 0, ml: 2 }}>
                          {new Date(tattoo.created_at).toLocaleDateString()}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          severity={snackbar.severity}
          sx={{
            bgcolor: snackbar.severity === 'success' ? colors.success : colors.error,
            color: '#fff',
            '& .MuiAlert-action': { color: '#fff' },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}

export default PendingApprovalsDialog;
