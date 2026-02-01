import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Box,
  Typography,
  Button,
  Avatar,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import { colors } from '@/styles/colors';
import { artistService } from '@/services/artistService';

interface StudioInvitation {
  id: number;
  name: string;
  slug: string;
  location?: string;
  image?: {
    id: number;
    uri: string;
  } | null;
  owner?: {
    id: number;
    name: string;
  } | null;
  invited_at: string;
}

interface StudioInvitationsProps {
  onInvitationAccepted?: () => void;
}

const StudioInvitations: React.FC<StudioInvitationsProps> = ({ onInvitationAccepted }) => {
  const [invitations, setInvitations] = useState<StudioInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const data = await artistService.getStudioInvitations();
      setInvitations(data);
    } catch (error) {
      console.error('Failed to fetch studio invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (studioId: number) => {
    try {
      setProcessingId(studioId);
      await artistService.acceptStudioInvitation(studioId);
      setInvitations(prev => prev.filter(inv => inv.id !== studioId));
      setSnackbar({
        open: true,
        message: 'Studio invitation accepted! You are now affiliated with this studio.',
        severity: 'success',
      });
      onInvitationAccepted?.();
    } catch (error) {
      console.error('Failed to accept invitation:', error);
      setSnackbar({
        open: true,
        message: 'Failed to accept invitation. Please try again.',
        severity: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (studioId: number) => {
    try {
      setProcessingId(studioId);
      await artistService.declineStudioInvitation(studioId);
      setInvitations(prev => prev.filter(inv => inv.id !== studioId));
      setSnackbar({
        open: true,
        message: 'Invitation declined.',
        severity: 'success',
      });
    } catch (error) {
      console.error('Failed to decline invitation:', error);
      setSnackbar({
        open: true,
        message: 'Failed to decline invitation. Please try again.',
        severity: 'error',
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return null; // Don't show anything while loading
  }

  if (invitations.length === 0) {
    return null; // Don't render if no invitations
  }

  return (
    <>
      <Box
        sx={{
          mb: 3,
          p: 2,
          bgcolor: colors.surface,
          borderRadius: '12px',
          border: `1px solid ${colors.accent}40`,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <BusinessIcon sx={{ color: colors.accent, fontSize: 20 }} />
          <Typography
            sx={{
              fontWeight: 600,
              color: colors.textPrimary,
              fontSize: '1rem',
            }}
          >
            Studio Invitations
          </Typography>
          <Box
            sx={{
              ml: 'auto',
              bgcolor: colors.accent,
              color: colors.background,
              px: 1.5,
              py: 0.25,
              borderRadius: '12px',
              fontSize: '0.75rem',
              fontWeight: 600,
            }}
          >
            {invitations.length} pending
          </Box>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {invitations.map((invitation) => (
            <Box
              key={invitation.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                p: 2,
                bgcolor: colors.background,
                borderRadius: '8px',
                border: `1px solid ${colors.border}`,
              }}
            >
              <Link
                href={`/studios/${invitation.slug}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  flex: 1,
                  minWidth: 0,
                  textDecoration: 'none',
                  color: 'inherit',
                }}
              >
                <Avatar
                  src={invitation.image?.uri}
                  sx={{
                    width: 48,
                    height: 48,
                    bgcolor: colors.accent,
                    transition: 'transform 0.2s ease',
                    '&:hover': { transform: 'scale(1.05)' },
                  }}
                >
                  {invitation.name?.charAt(0) || 'S'}
                </Avatar>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: colors.textPrimary,
                      fontSize: '0.95rem',
                      '&:hover': { color: colors.accent },
                      transition: 'color 0.2s ease',
                    }}
                  >
                    {invitation.name}
                  </Typography>
                  {invitation.location && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOnIcon sx={{ fontSize: 14, color: colors.textMuted }} />
                      <Typography
                        sx={{
                          color: colors.textMuted,
                          fontSize: '0.8rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {invitation.location}
                      </Typography>
                    </Box>
                  )}
                  <Typography
                    sx={{
                      color: colors.textSecondary,
                      fontSize: '0.75rem',
                      mt: 0.5,
                    }}
                  >
                    Accept to confirm you work here
                  </Typography>
                </Box>
              </Link>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleDecline(invitation.id)}
                  disabled={processingId === invitation.id}
                  sx={{
                    minWidth: 'auto',
                    px: 1.5,
                    py: 0.5,
                    color: colors.textMuted,
                    borderColor: colors.border,
                    '&:hover': {
                      borderColor: colors.error,
                      color: colors.error,
                    },
                  }}
                  startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
                >
                  Decline
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => handleAccept(invitation.id)}
                  disabled={processingId === invitation.id}
                  sx={{
                    minWidth: 'auto',
                    px: 1.5,
                    py: 0.5,
                    bgcolor: colors.accent,
                    '&:hover': { bgcolor: colors.accentHover },
                  }}
                  startIcon={
                    processingId === invitation.id ? (
                      <CircularProgress size={14} sx={{ color: 'inherit' }} />
                    ) : (
                      <CheckCircleIcon sx={{ fontSize: 16 }} />
                    )
                  }
                >
                  Accept
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default StudioInvitations;
