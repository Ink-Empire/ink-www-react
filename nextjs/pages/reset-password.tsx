import React, { useState, useEffect } from 'react';
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
  InputAdornment,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { colors } from '@/styles/colors';
import { authService } from '@/services/authService';

const PASSWORD_REQUIREMENTS = {
  minLength: { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  hasUppercase: { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  hasLowercase: { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  hasNumber: { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  hasSymbol: { label: 'One symbol (!@#$%^&*...)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p) },
};

const ResetPasswordPage: React.FC = () => {
  const router = useRouter();
  const { token, email } = router.query;

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Check for required URL parameters
  const hasRequiredParams = token && email;

  const checkRequirement = (key: keyof typeof PASSWORD_REQUIREMENTS) => {
    return PASSWORD_REQUIREMENTS[key].test(password);
  };

  const allRequirementsMet = Object.keys(PASSWORD_REQUIREMENTS).every((key) =>
    checkRequirement(key as keyof typeof PASSWORD_REQUIREMENTS)
  );

  const passwordsMatch = password === passwordConfirmation && passwordConfirmation.length > 0;

  const canSubmit = allRequirementsMet && passwordsMatch && hasRequiredParams;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({
        token: token as string,
        email: email as string,
        password,
        password_confirmation: passwordConfirmation,
      });
      setSuccess(true);
    } catch (err: any) {
      if (err.status === 422) {
        // Validation error
        const message = err.message || 'Please check your password and try again.';
        // Check for password history error
        if (message.toLowerCase().includes('previously used') || message.toLowerCase().includes('password history')) {
          setError('You cannot reuse one of your last 5 passwords. Please choose a different password.');
        } else {
          setError(message);
        }
      } else if (err.status === 400) {
        setError('This password reset link is invalid or has expired. Please request a new one.');
      } else {
        setError('An error occurred. Please try again or request a new reset link.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <>
        <Head>
          <title>Password Reset Successful | InkedIn</title>
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
              Password Reset Successful
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 4,
                color: 'text.secondary',
                fontSize: '1rem',
                lineHeight: 1.6,
              }}
            >
              Your password has been successfully reset. You can now log in with your new password.
            </Typography>
            <Button
              variant="contained"
              onClick={() => router.push('/login')}
              sx={{
                backgroundColor: colors.accent,
                color: '#000',
                fontWeight: 'bold',
                py: 1.5,
                px: 4,
                '&:hover': {
                  backgroundColor: colors.accentDark,
                },
              }}
            >
              Go to Login
            </Button>
          </Paper>
        </Box>
      </>
    );
  }

  // Show error if missing required parameters
  if (router.isReady && !hasRequiredParams) {
    return (
      <>
        <Head>
          <title>Invalid Reset Link | InkedIn</title>
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
            <CancelIcon
              sx={{
                fontSize: 64,
                color: colors.error,
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
              Invalid Reset Link
            </Typography>
            <Typography
              variant="body1"
              sx={{
                mb: 4,
                color: 'text.secondary',
                fontSize: '1rem',
                lineHeight: 1.6,
              }}
            >
              This password reset link is invalid or incomplete. Please request a new password reset link.
            </Typography>
            <Stack spacing={2}>
              <Button
                variant="contained"
                onClick={() => router.push('/forgot-password')}
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
                Request New Reset Link
              </Button>
              <Button
                variant="text"
                onClick={() => router.push('/login')}
                sx={{
                  color: colors.textSecondary,
                  textTransform: 'none',
                }}
              >
                Return to Login
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
        <title>Reset Password | InkedIn</title>
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
              Create New Password
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
              Enter your new password below. Make sure it meets all the requirements.
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
                label="New Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                fullWidth
                required
                autoFocus
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                        sx={{ color: colors.textSecondary }}
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
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

              {/* Password Requirements Checklist */}
              {password.length > 0 && (
                <Box sx={{ pl: 1 }}>
                  <Typography variant="caption" sx={{ color: colors.textSecondary, mb: 1, display: 'block' }}>
                    Password requirements:
                  </Typography>
                  <Stack spacing={0.5}>
                    {Object.entries(PASSWORD_REQUIREMENTS).map(([key, { label }]) => {
                      const met = checkRequirement(key as keyof typeof PASSWORD_REQUIREMENTS);
                      return (
                        <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {met ? (
                            <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                          ) : (
                            <CancelIcon sx={{ fontSize: 16, color: colors.error }} />
                          )}
                          <Typography
                            variant="caption"
                            sx={{
                              color: met ? '#4caf50' : colors.textSecondary,
                            }}
                          >
                            {label}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Stack>
                </Box>
              )}

              <TextField
                label="Confirm Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                autoComplete="new-password"
                fullWidth
                required
                error={passwordConfirmation.length > 0 && !passwordsMatch}
                helperText={
                  passwordConfirmation.length > 0 && !passwordsMatch
                    ? 'Passwords do not match'
                    : ''
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        edge="end"
                        sx={{ color: colors.textSecondary }}
                      >
                        {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': {
                      borderColor: passwordConfirmation.length > 0 && !passwordsMatch
                        ? colors.error
                        : 'rgba(232, 219, 197, 0.5)',
                    },
                    '&:hover fieldset': {
                      borderColor: passwordConfirmation.length > 0 && !passwordsMatch
                        ? colors.error
                        : colors.textSecondary,
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: passwordConfirmation.length > 0 && !passwordsMatch
                        ? colors.error
                        : colors.accent,
                    },
                    '& input': {
                      color: colors.textSecondary,
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: colors.textSecondary,
                    '&.Mui-focused': {
                      color: passwordConfirmation.length > 0 && !passwordsMatch
                        ? colors.error
                        : colors.accent,
                    },
                  },
                  '& .MuiFormHelperText-root': {
                    color: colors.error,
                  },
                }}
              />

              <Button
                type="submit"
                variant="contained"
                disabled={isLoading || !canSubmit}
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
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </Stack>
          </form>
        </Paper>
      </Box>
    </>
  );
};

export default ResetPasswordPage;
