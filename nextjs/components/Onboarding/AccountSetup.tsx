import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';

interface AccountSetupProps {
  onStepComplete: (credentials: {
    email: string;
    password: string;
    password_confirmation: string;
  }) => void;
  onBack: () => void;
  userType: 'client' | 'artist' | 'studio';
}

const AccountSetup: React.FC<AccountSetupProps> = ({ 
  onStepComplete, 
  onBack, 
  userType 
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    if (!passwordConfirmation.trim()) {
      newErrors.passwordConfirmation = 'Please confirm your password';
    } else if (password !== passwordConfirmation) {
      newErrors.passwordConfirmation = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await onStepComplete({
        email: email.trim(),
        password: password.trim(),
        password_confirmation: passwordConfirmation.trim(),
      });
    } catch (error) {
      console.error('Error submitting account setup:', error);
      setErrors({ submit: 'Failed to create account. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTitle = () => {
    switch (userType) {
      case 'artist':
        return 'Almost there! Set up your artist account';
      case 'studio':
        return 'Almost there! Set up your studio account';
      default:
        return 'Almost there! Set up your account';
    }
  };

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
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
          {getTitle()}
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
          Create your login credentials to join the InkedIn community.
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Stack spacing={3}>
          {/* Email Field */}
          <TextField
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            error={!!errors.email}
            helperText={errors.email || 'This will be used to log in to your account'}
            fullWidth
            required
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
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a strong password"
            error={!!errors.password}
            helperText={errors.password || 'Must be at least 8 characters'}
            fullWidth
            required
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
              },
              '& .MuiInputLabel-root': {
                color: '#e8dbc5',
                '&.Mui-focused': {
                  color: '#339989',
                },
              },
            }}
          />

          {/* Password Confirmation Field */}
          <TextField
            label="Confirm Password"
            type="password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
            placeholder="Confirm your password"
            error={!!errors.passwordConfirmation}
            helperText={errors.passwordConfirmation}
            fullWidth
            required
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
              },
              '& .MuiInputLabel-root': {
                color: '#e8dbc5',
                '&.Mui-focused': {
                  color: '#339989',
                },
              },
            }}
          />

          {errors.submit && (
            <Alert severity="error">
              {errors.submit}
            </Alert>
          )}

          <Stack 
            direction={{ xs: 'column-reverse', sm: 'row' }} 
            justifyContent="space-between" 
            alignItems="center"
            spacing={{ xs: 2, sm: 0 }}
            sx={{ width: '100%' }}
          >
            <Button
              variant="outlined"
              onClick={onBack}
              disabled={isSubmitting}
              sx={{
                color: '#e8dbc5',
                borderColor: '#e8dbc5',
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  backgroundColor: 'rgba(232, 219, 197, 0.1)',
                  borderColor: '#e8dbc5',
                },
                '&:disabled': {
                  borderColor: 'rgba(232, 219, 197, 0.3)',
                  color: 'rgba(232, 219, 197, 0.5)',
                },
              }}
            >
              Back
            </Button>

            <Button
              type="submit"
              variant="contained"
              disabled={isSubmitting}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              sx={{
                backgroundColor: '#339989',
                color: '#000',
                fontWeight: 'bold',
                px: 4,
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  backgroundColor: '#2a7f7a',
                },
                '&:disabled': {
                  backgroundColor: 'rgba(232, 219, 197, 0.3)',
                  color: 'rgba(0, 0, 0, 0.5)',
                },
              }}
            >
              {isSubmitting ? 'Creating Account...' : 'Create Account'}
            </Button>
          </Stack>
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
        By creating an account, you agree to our Terms of Service and Privacy Policy.
      </Typography>
    </Box>
  );
};

export default AccountSetup;