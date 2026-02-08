import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogActions, Button, Typography, Box } from '@mui/material';
import { colors, modalStyles } from '@/styles/colors';
import { useAuth } from '@/contexts/AuthContext';

const WELCOME_SHOWN_KEY = 'inkedin_welcome_shown';

export default function WelcomeModal() {
  const { isAuthenticated, isLoading } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isLoading || !isAuthenticated) return;

    const alreadyShown = localStorage.getItem(WELCOME_SHOWN_KEY);
    if (!alreadyShown) {
      setOpen(true);
    }
  }, [isAuthenticated, isLoading]);

  const handleDismiss = () => {
    setOpen(false);
    localStorage.setItem(WELCOME_SHOWN_KEY, 'true');
  };

  if (!isAuthenticated) return null;

  return (
    <Dialog
      open={open}
      onClose={handleDismiss}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: modalStyles.paper }}
      slotProps={{ backdrop: { sx: modalStyles.backdrop } }}
    >
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: colors.textPrimary, mb: 2 }}>
          Welcome!
        </Typography>
        <Typography sx={{ color: colors.textSecondary, lineHeight: 1.7 }}>
          We’re building a growing community of tattoo artists, shops, and collectors.
          New artists are being onboarded every week - explore what’s here now, save your favorites, and help us grow by referring artists you love.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={handleDismiss}
          variant="contained"
          sx={{
            bgcolor: colors.accent,
            color: colors.textOnLight,
            textTransform: 'none',
            fontWeight: 600,
            px: 4,
            borderRadius: '30px',
            '&:hover': { bgcolor: colors.accentHover },
          }}
        >
          Start Exploring
        </Button>
      </DialogActions>
    </Dialog>
  );
}
