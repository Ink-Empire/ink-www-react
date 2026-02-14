import React, { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import Link from 'next/link';
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
import { useAuth } from '../contexts/AuthContext';
import { colors } from '@/styles/colors';

type FormValues = {
  email: string;
  password: string;
};

const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>();
  
  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);
  
  const onSubmit = async (data: FormValues) => {
    setError(null);

    // Clear any pending error timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
    }

    try {
      await login({
        ...data,
        setErrors: (errors: any) => {
          // Small delay to allow authentication to complete first
          errorTimeoutRef.current = setTimeout(() => {
            if (errors.email) {
              setError(errors.email.join(' '));
            } else if (errors.password) {
              setError(errors.password.join(' '));
            }
          }, 100);
        },
        setIsLoading,
        onSuccess: () => {
          router.push('/dashboard');
        }
      });
    } catch (err: any) {
      // Check if this is an email verification required error
      if (err.requires_verification) {
        // Redirect to verify email page with the email
        const email = encodeURIComponent(err.email || data.email);
        router.push(`/verify-email?email=${email}`);
        return;
      }
      // Never show technical errors to users
      const message = err.message || '';
      const isTechnicalError = message.includes('SQLSTATE') ||
        message.includes('Connection') ||
        message.includes('Exception') ||
        message.includes('Error:');
      setError(isTechnicalError ? 'Something went wrong. Please try again later.' : (message || 'Login failed. Please try again.'));
    }
  };

  return (
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
            Sign in to your account
          </Typography>

          <Typography
            variant="body1"
            sx={{
              mb: 3,
              color: 'text.secondary',
              fontSize: '1.1rem',
              lineHeight: 1.6,
            }}
          >
            Or{' '}
            <Link href="/register" style={{ color: colors.accent, textDecoration: 'none' }}>
              create a new account
            </Link>
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
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

            {/* Email Field */}
            <TextField
              label="Email or Username"
              type="text"
              autoComplete="username"
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
              required
              {...register('email', {
                required: 'Email or username is required',
              })}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: 'rgba(232, 219, 197, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#e8dbc5',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#339989',
                  },
                  '& input': {
                    color: '#e8dbc5',
                  },
                },
                '& .MuiInputLabel-root': {
                  color: '#e8dbc5',
                  '&.Mui-focused': {
                    color: '#339989',
                  },
                },
              }}
            />

            {/* Password Field */}
            <TextField
              label="Password"
              type="password"
              autoComplete="current-password"
              error={!!errors.password}
              helperText={errors.password?.message}
              fullWidth
              required
              {...register('password', { required: 'Password is required' })}
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

            {/* Remember Me and Forgot Password */}
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <Typography variant="body2" sx={{ color: colors.textSecondary }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="remember-me">Remember me</label>
              </Typography>

              <Link href="/forgot-password" style={{ color: colors.accent, textDecoration: 'none', fontSize: '0.875rem' }}>
                Forgot your password?
              </Link>
            </Stack>

            {/* Sign In Button */}
            <Button
              type="submit"
              variant="contained"
              disabled={isLoading}
              startIcon={isLoading ? <CircularProgress size={20} /> : null}
              sx={{
                backgroundColor: colors.accent,
                color: '#000',
                fontWeight: 'bold',
                px: 4,
                py: 2,
                '&:hover': {
                  backgroundColor: colors.accentDark,
                },
                '&:disabled': {
                  backgroundColor: 'rgba(232, 219, 197, 0.3)',
                  color: 'rgba(0, 0, 0, 0.5)',
                },
              }}
            >
              {isLoading ? 'Signing in...' : 'Sign in'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

export default LoginPage;