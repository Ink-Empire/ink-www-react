import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Typography,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { colors } from '@/styles/colors';

interface ContactFormProps {
  onSuccess?: () => void;
}

export default function ContactForm({ onSuccess }: ContactFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    message: '',
    // Honeypot field for spam protection
    website: '',
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const validateEmail = (email: string): boolean => {
    if (!email) {
      setEmailError(null);
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Clear email error when user starts typing again
    if (name === 'email' && emailError) {
      setEmailError(null);
    }
  };

  const handleEmailBlur = () => {
    if (formData.email) {
      validateEmail(formData.email);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Honeypot check - if this field is filled, it's likely a bot
    if (formData.website) {
      // Silently "succeed" to not tip off bots
      setSuccess(true);
      return;
    }

    // Validation
    if (!formData.email) {
      setEmailError('Please enter your email address');
      return;
    }
    if (!validateEmail(formData.email)) {
      return;
    }
    if (!formData.message) {
      setError('Please enter your message');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          message: formData.message,
          timestamp: Date.now(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send message');
      }

      setSuccess(true);
      setFormData({ email: '', message: '', website: '' });
      setEmailError(null);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <Box
        sx={{
          textAlign: 'center',
          py: 4,
        }}
      >
        <CheckCircleIcon sx={{ fontSize: 48, color: colors.success, mb: 2 }} />
        <Typography variant="h6" sx={{ color: colors.textPrimary, mb: 1 }}>
          Message Sent!
        </Typography>
        <Typography sx={{ color: colors.textSecondary }}>
          Thanks for reaching out. We'll get back to you soon.
        </Typography>
        <Button
          onClick={() => setSuccess(false)}
          sx={{
            mt: 2,
            color: colors.accent,
            textTransform: 'none',
          }}
        >
          Send another message
        </Button>
      </Box>
    );
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="Your Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        onBlur={handleEmailBlur}
        required
        error={!!emailError}
        helperText={emailError}
        sx={{
          mb: 2,
          '& .MuiOutlinedInput-root': {
            bgcolor: colors.surface,
            '& fieldset': {
              borderColor: emailError ? colors.error : colors.border,
            },
            '&:hover fieldset': {
              borderColor: emailError ? colors.error : colors.accent,
            },
            '&.Mui-focused fieldset': {
              borderColor: emailError ? colors.error : colors.accent,
            },
          },
          '& .MuiInputLabel-root': {
            color: emailError ? colors.error : colors.textSecondary,
          },
          '& .MuiInputBase-input': {
            color: colors.textPrimary,
          },
          '& .MuiFormHelperText-root': {
            color: colors.error,
          },
        }}
      />

      <TextField
        fullWidth
        label="Your Message"
        name="message"
        multiline
        rows={4}
        value={formData.message}
        onChange={handleChange}
        required
        sx={{
          mb: 3,
          '& .MuiOutlinedInput-root': {
            bgcolor: colors.surface,
            '& fieldset': {
              borderColor: colors.border,
            },
            '&:hover fieldset': {
              borderColor: colors.accent,
            },
            '&.Mui-focused fieldset': {
              borderColor: colors.accent,
            },
          },
          '& .MuiInputLabel-root': {
            color: colors.textSecondary,
          },
          '& .MuiInputBase-input': {
            color: colors.textPrimary,
          },
        }}
      />

      {/* Honeypot field - hidden from users, visible to bots */}
      <TextField
        name="website"
        value={formData.website}
        onChange={handleChange}
        sx={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          height: 0,
          width: 0,
        }}
        tabIndex={-1}
        autoComplete="off"
      />

      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          variant="contained"
          disabled={loading}
          endIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SendIcon />}
          sx={{
            bgcolor: colors.accent,
            color: colors.textOnLight,
            textTransform: 'none',
            px: 4,
            py: 1.25,
            fontWeight: 500,
            '&:hover': {
              bgcolor: colors.accentHover,
            },
            '&.Mui-disabled': {
              bgcolor: `${colors.accent}80`,
              color: colors.textOnLight,
            },
          }}
        >
          {loading ? 'Sending...' : 'Send Message'}
        </Button>
      </Box>
    </Box>
  );
}
