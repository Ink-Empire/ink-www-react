import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
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
import { api } from '../utils/api';

type FormValues = {
  current_password: string;
  password: string;
  password_confirmation: string;
};

const ChangePasswordPage: React.FC = () => {
  const { user, setUserDirectly } = useAuth();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormValues>();

  // If user is not logged in, send to login. If logged in but no reset required, send to dashboard.
  useEffect(() => {
    if (!user) {
      router.replace('/login');
    } else if (!user.force_password_reset) {
      router.replace('/dashboard');
    }
  }, [user, router]);

  const onSubmit = async (data: FormValues) => {
    setError(null);
    setIsLoading(true);

    try {
      await api.put('/password', data);
      // Update local user state so the redirect guard doesn't loop
      setUserDirectly({ ...user!, force_password_reset: false });
      router.push('/dashboard');
    } catch (err: any) {
      const errorData = err.response?.data || err.data || err;
      const fieldErrors = errorData?.errors;
      if (fieldErrors?.current_password) {
        setError(fieldErrors.current_password[0]);
      } else if (fieldErrors?.password) {
        setError(fieldErrors.password[0]);
      } else {
        setError(errorData?.message || 'Failed to update password. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!user?.force_password_reset) return null;

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
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 2, fontWeight: 'bold', color: colors.textSecondary }}>
            Set your password
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
            Your account was created with a temporary password. Enter it below along with your new password to get started.
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
                  '& .MuiAlert-icon': { color: colors.error },
                }}
              >
                {error}
              </Alert>
            )}

            <TextField
              label="Temporary password (from your email)"
              type="password"
              autoComplete="current-password"
              fullWidth
              required
              error={!!errors.current_password}
              helperText={errors.current_password?.message}
              {...register('current_password', { required: 'Please enter the temporary password from your email' })}
              sx={fieldSx}
            />

            <TextField
              label="New password"
              type="password"
              autoComplete="new-password"
              fullWidth
              required
              error={!!errors.password}
              helperText={errors.password?.message}
              {...register('password', {
                required: 'Please choose a new password',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
              })}
              sx={fieldSx}
            />

            <TextField
              label="Confirm new password"
              type="password"
              autoComplete="new-password"
              fullWidth
              required
              error={!!errors.password_confirmation}
              helperText={errors.password_confirmation?.message}
              {...register('password_confirmation', {
                required: 'Please confirm your new password',
                validate: value => value === watch('password') || 'Passwords do not match',
              })}
              sx={fieldSx}
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
                px: 4,
                py: 2,
                '&:hover': { backgroundColor: colors.accentDark },
                '&:disabled': { backgroundColor: 'rgba(232, 219, 197, 0.3)', color: 'rgba(0, 0, 0, 0.5)' },
              }}
            >
              {isLoading ? 'Saving...' : 'Set password & go to dashboard'}
            </Button>
          </Stack>
        </form>
      </Paper>
    </Box>
  );
};

const fieldSx = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: 'rgba(232, 219, 197, 0.5)' },
    '&:hover fieldset': { borderColor: '#e8dbc5' },
    '&.Mui-focused fieldset': { borderColor: '#339989' },
    '& input': { color: '#e8dbc5' },
  },
  '& .MuiInputLabel-root': {
    color: '#e8dbc5',
    '&.Mui-focused': { color: '#339989' },
  },
};

export default ChangePasswordPage;
