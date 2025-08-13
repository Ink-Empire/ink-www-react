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
          router.push('/');
        }
      });
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: '#1a0e11',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, md: 4 },
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: { xs: 3, sm: 4, md: 5 },
          backgroundColor: '#2a1a1e',
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
              color: '#e8dbc5',
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
            <Link href="/register" style={{ color: '#339989', textDecoration: 'none' }}>
              create a new account
            </Link>
          </Typography>
        </Box>

        <form onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={3}>
            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}

            {/* Email Field */}
            <TextField
              label="Email Address"
              type="email"
              autoComplete="email"
              error={!!errors.email}
              helperText={errors.email?.message}
              fullWidth
              required
              {...register('email', { 
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
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

            {/* Remember Me and Forgot Password */}
            <Stack 
              direction="row" 
              justifyContent="space-between" 
              alignItems="center"
              sx={{ mt: 2 }}
            >
              <Typography variant="body2" sx={{ color: '#e8dbc5' }}>
                <input
                  type="checkbox"
                  id="remember-me"
                  style={{ marginRight: '8px' }}
                />
                <label htmlFor="remember-me">Remember me</label>
              </Typography>

              <Link href="/forgot-password" style={{ color: '#339989', textDecoration: 'none', fontSize: '0.875rem' }}>
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
                backgroundColor: '#339989',
                color: '#000',
                fontWeight: 'bold',
                px: 4,
                py: 2,
                '&:hover': {
                  backgroundColor: '#2a7f7a',
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

        <Typography
          variant="body2"
          sx={{
            mt: 3,
            textAlign: 'center',
            color: 'text.secondary',
            fontStyle: 'italic',
          }}
        >
          Welcome back to InkedIn! Ready to connect with the tattoo community?
        </Typography>
      </Paper>
    </Box>
  );
};

export default LoginPage;