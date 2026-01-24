import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  IconButton,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { colors } from '@/styles/colors';
import { api } from '@/utils/api';
import { useAuth } from '@/contexts/AuthContext';

const DISMISSED_KEY = 'feedback_fab_dismissed';

export default function FeedbackFAB() {
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [feedback, setFeedback] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    // Check if FAB was dismissed
    const dismissed = localStorage.getItem(DISMISSED_KEY);
    if (!dismissed) {
      setIsVisible(true);
    }

    // Pre-fill email if user is logged in
    if (user?.email) {
      setEmail(user.email);
    }
  }, [user]);

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    localStorage.setItem(DISMISSED_KEY, 'true');
    setIsVisible(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
    setMessage(null);
  };

  const handleClose = () => {
    setIsOpen(false);
    setMessage(null);
  };

  const handleSubmit = async () => {
    if (!email.trim() || !feedback.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (feedback.trim().length < 10) {
      setMessage({ type: 'error', text: 'Please provide more detail (at least 10 characters)' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      await api.post('/feedback', { email, feedback });
      setMessage({ type: 'success', text: 'Thank you for your feedback!' });
      setFeedback('');

      // Close dialog after success
      setTimeout(() => {
        handleClose();
        handleDismiss({ stopPropagation: () => {} } as React.MouseEvent);
      }, 2000);
    } catch (error: any) {
      setMessage({ type: 'error', text: error?.message || 'Failed to send feedback. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Ideas Button */}
      <Slide direction="up" in={isVisible} mountOnEnter unmountOnExit>
        <Box
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            gap: 0.5,
          }}
        >
          <Box
            component="button"
            onClick={handleOpen}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              px: 2,
              py: 1.25,
              borderRadius: '9999px',
              backgroundColor: 'rgba(201, 169, 98, 0.15)',
              border: '1px solid rgba(201, 169, 98, 0.4)',
              cursor: 'pointer',
              transition: 'all 0.2s',
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
              '&:hover': {
                filter: 'brightness(1.25)',
              },
            }}
          >
            <LightbulbOutlinedIcon sx={{ fontSize: 16, color: colors.accent }} />
            <Typography
              sx={{
                fontSize: '0.875rem',
                fontWeight: 500,
                color: colors.accent,
              }}
            >
              Ideas?
            </Typography>
          </Box>

          <Box
            component="button"
            onClick={handleDismiss}
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '9999px',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: colors.textMuted,
              transition: 'all 0.2s',
              '&:hover': {
                backgroundColor: 'rgba(113, 113, 122, 0.3)',
              },
            }}
          >
            <CloseIcon sx={{ fontSize: 14 }} />
          </Box>
        </Box>
      </Slide>

      {/* Feedback Dialog */}
      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            color: colors.textPrimary,
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" sx={{ color: colors.textPrimary }}>
            Share Your Ideas
          </Typography>
          <IconButton onClick={handleClose} sx={{ color: colors.textMuted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 3 }}>
            We'd love to hear your thoughts! Let us know what's working, what's not, or what you'd like to see.
          </Typography>

          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }}>
              {message.text}
            </Alert>
          )}

          <TextField
            fullWidth
            label="Your Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
            InputProps={{
              sx: { color: colors.textPrimary },
            }}
            InputLabelProps={{
              sx: { color: colors.textSecondary },
            }}
          />

          <TextField
            fullWidth
            label="Your Ideas"
            multiline
            rows={4}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Tell us what you think..."
            InputProps={{
              sx: { color: colors.textPrimary },
            }}
            InputLabelProps={{
              sx: { color: colors.textSecondary },
            }}
          />
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={handleClose}
            sx={{ color: colors.textSecondary }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSubmit}
            disabled={loading}
            sx={{
              bgcolor: colors.accent,
              '&:hover': { bgcolor: colors.accentDark },
            }}
          >
            {loading ? <CircularProgress size={24} /> : 'Send Ideas'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
