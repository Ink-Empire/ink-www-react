import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Head from 'next/head';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Paper,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { colors } from '@/styles/colors';
import { api } from '@/utils/api';

const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const validateEmail = (email: string) => {
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/forgot-password', { email: email.trim() });
      setSuccess(true);
    } catch (err: any) {
      // Even if the email doesn't exist, we show success for security
      // The backend should handle this the same way
      if (err.status === 422) {
        setError(err.message || 'Please check your email address');
      } else {
        // Show success even on error to prevent email enumeration
        setSuccess(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Check Your Email | InkedIn</title>
        </Head>
        <Box
          sx={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: colors.background,
            alignItems: 'center',
            justifyContent: 'center',
            p: { xs: 2, md: 4 },
          }}
        >
          <Paper
            elevation={2}
            sx={{
              p: { xs: 3, sm: 4, md: 5 },
              backgroundColor: colors.surface,
              color: 'white',
              borderRadius: { xs: 2, md: 3 },
              maxWidth: 500,
              width: '100%',
              mx: 'auto',
              textAlign: 'center',
            }}
          >
            <CheckCircleIcon
              sx={{
                fontSize: 64,
                color: '#4caf50',
                mb: 2,
              }}
            />
            <Typography
              variant="h4"
              component="h1"
              sx={{
                mb: 2,
                fontWeight: 'bold',
                color: colors.textSecondary,
              }}
            >
              Check Your Email
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 3,
                color: 'text.secondary',
                fontSize: '1rem',
                lineHeight: 1.6,
              }}
            >
              If an account exists for <strong>{email}</strong>, we've sent a password reset link.
              Please check your inbox and spam folder.
            </Typography>
            <Typography
              variant="body2"
              sx={{
                mb: 4,
                color: 'text.secondary',
                fontSize: '0.875rem',
              }}
            >
              The link will expire in 60 minutes.
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="contained"
                onClick={() => router.push('/login')}
                sx={{
                  backgroundColor: colors.accent,
                  color: '#000',
                  fontWeight: 'bold',
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: colors.accentDark,
                  },
                }}
              >
                Return to Login
              </Button>
              <Button
                variant="text"
                onClick={() => {
                  setSuccess(false);
                  setEmail('');
                }}
                sx={{
                  color: colors.textSecondary,
                  textTransform: 'none',
                }}
              >
                Try a different email
              </Button>
            </Stack>
          </Paper>
        </Box>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Forgot Password | InkedIn</title>
      </Head>
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: colors.background,
          alignItems: 'center',
          justifyContent: 'center',
          p: { xs: 2, md: 4 },
        }}
      >
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, sm: 4, md: 5 },
            backgroundColor: colors.surface,
            color: 'white',
            borderRadius: { xs: 2, md: 3 },
            maxWidth: 500,
            width: '100%',
            mx: 'auto',
          }}
        >
          <Box sx={{ mb: 3 }}>
            <Link
              href="/login"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: colors.textSecondary,
                textDecoration: 'none',
                fontSize: '0.875rem',
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 18, mr: 0.5 }} />
              Back to login
            </Link>
          </Box>

          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                mb: 2,
                fontWeight: 'bold',
                color: colors.textSecondary,
              }}
            >
              Forgot your password?
            </Typography>

            <Typography
              variant="body1"
              sx={{
                mb: 3,
                color: 'text.secondary',
                fontSize: '1rem',
                lineHeight: 1.6,
              }}
            >
              Enter your email address and we'll send you a link to reset your password.
            </Typography>
          </Box>

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              {error && (
                <Alert
                  severity="error"
                  sx={{
                    bgcolor: `${colors.error}1A`,
                    color: colors.error,
                    border: `1px solid ${colors.error}40`,
                    '& .MuiAlert-icon': {
                      color: colors.error,
                    },
                  }}
                >
                  {error}
                </Alert>
              )}

              <TextField
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                fullWidth
                required
                autoFocus
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: 'rgba(232, 219, 197, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: colors.textSecondary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: colors.accent,
                    },
                    '& input': {
                      color: colors.textSecondary,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: colors.textSecondary,
                    '&.Mui-focused': {
                      color: colors.accent,
                    },
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} /> : null}
                sx={{
                  backgroundColor: colors.accent,
                  color: '#000',
                  fontWeight: 'bold',
                  py: 1.5,
                  '&:hover': {
                    backgroundColor: colors.accentDark,
                  },
                  '&:disabled': {
                    backgroundColor: 'rgba(232, 219, 197, 0.3)',
                    color: 'rgba(0, 0, 0, 0.5)',
                  },
                }}
              >
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default ForgotPasswordPage;
