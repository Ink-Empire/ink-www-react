import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  Alert,
  CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { colors } from '@/styles/colors';
import { api } from '@/utils/api';

interface AccountSetupProps {
  onStepComplete: (credentials: {
    email: string;
    password: string;
    password_confirmation: string;
  }) => void;
  onBack: () => void;
  userType: 'client' | 'artist' | 'studio';
}

// Password requirements matching backend rules
const PASSWORD_REQUIREMENTS = {
  minLength: { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  hasUppercase: { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  hasLowercase: { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  hasNumber: { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  hasSymbol: { label: 'One symbol (!@#$%^&*...)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p) },
};

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

  // Email availability state
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [emailCheckDebounce, setEmailCheckDebounce] = useState<NodeJS.Timeout | null>(null);

  // Check password requirements
  const getPasswordRequirementStatus = useCallback(() => {
    return Object.entries(PASSWORD_REQUIREMENTS).map(([key, req]) => ({
      key,
      label: req.label,
      met: req.test(password),
    }));
  }, [password]);

  const allPasswordRequirementsMet = useCallback(() => {
    return Object.values(PASSWORD_REQUIREMENTS).every(req => req.test(password));
  }, [password]);

  // Check email availability
  const checkEmailAvailability = useCallback(async (emailToCheck: string) => {
    if (!emailToCheck || !/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(emailToCheck)) {
      setEmailAvailable(null);
      return;
    }

    setIsCheckingEmail(true);
    try {
      const response = await api.post<{ available: boolean }>('/check-availability', {
        email: emailToCheck,
      });
      setEmailAvailable(response.available);
      if (!response.available) {
        setErrors(prev => ({ ...prev, email: 'This email is already registered' }));
      } else {
        setErrors(prev => {
          const { email, ...rest } = prev;
          return rest;
        });
      }
    } catch (error) {
      console.error('Error checking email availability:', error);
      // Don't block registration if check fails
      setEmailAvailable(null);
    } finally {
      setIsCheckingEmail(false);
    }
  }, []);

  // Debounce email availability check
  useEffect(() => {
    if (emailCheckDebounce) {
      clearTimeout(emailCheckDebounce);
    }

    if (email && /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      const timeout = setTimeout(() => {
        checkEmailAvailability(email);
      }, 500);
      setEmailCheckDebounce(timeout);
    } else {
      setEmailAvailable(null);
    }

    return () => {
      if (emailCheckDebounce) {
        clearTimeout(emailCheckDebounce);
      }
    };
  }, [email]); // eslint-disable-line react-hooks/exhaustive-deps

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    } else if (emailAvailable === false) {
      newErrors.email = 'This email is already registered';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!allPasswordRequirementsMet()) {
      newErrors.password = 'Password does not meet all requirements';
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

  const passwordRequirements = getPasswordRequirementStatus();
  const passwordsMatch = password && passwordConfirmation && password === passwordConfirmation;

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
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
          <Box>
            <TextField
              label="Email Address"
              name="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@example.com"
              error={!!errors.email}
              helperText={errors.email}
              fullWidth
              required
              autoComplete="email"
              InputProps={{
                endAdornment: (
                  <>
                    {isCheckingEmail && (
                      <CircularProgress size={20} sx={{ color: colors.accent }} />
                    )}
                    {!isCheckingEmail && emailAvailable === true && (
                      <CheckCircleIcon sx={{ color: '#4caf50' }} />
                    )}
                    {!isCheckingEmail && emailAvailable === false && (
                      <CancelIcon sx={{ color: '#f44336' }} />
                    )}
                  </>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: emailAvailable === false ? '#f44336' :
                                 emailAvailable === true ? '#4caf50' :
                                 'rgba(232, 219, 197, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: emailAvailable === false ? '#f44336' :
                                 emailAvailable === true ? '#4caf50' :
                                 colors.textSecondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: emailAvailable === false ? '#f44336' :
                                 emailAvailable === true ? '#4caf50' :
                                 colors.accent,
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
            {!errors.email && email && !isCheckingEmail && (
              <Typography variant="caption" sx={{ color: 'text.secondary', mt: 0.5, display: 'block' }}>
                {emailAvailable === true ? '✓ Email is available' : 'This will be used to log in to your account'}
              </Typography>
            )}
          </Box>

          {/* Password Field */}
          <Box>
            <TextField
              label="Password"
              name="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              error={!!errors.password}
              fullWidth
              required
              autoComplete="new-password"
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: password && allPasswordRequirementsMet() ? '#4caf50' : 'rgba(232, 219, 197, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: password && allPasswordRequirementsMet() ? '#4caf50' : colors.textSecondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: password && allPasswordRequirementsMet() ? '#4caf50' : colors.accent,
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
            <Box sx={{ mt: 1.5, p: 2, bgcolor: 'rgba(0,0,0,0.2)', borderRadius: 1 }}>
              <Typography variant="caption" sx={{ color: colors.textSecondary, fontWeight: 600, display: 'block', mb: 1 }}>
                Password must contain:
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0.5 }}>
                {passwordRequirements.map((req) => (
                  <Box key={req.key} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {req.met ? (
                      <CheckCircleIcon sx={{ fontSize: 16, color: '#4caf50' }} />
                    ) : (
                      <CancelIcon sx={{ fontSize: 16, color: password ? '#f44336' : 'rgba(255,255,255,0.3)' }} />
                    )}
                    <Typography
                      variant="caption"
                      sx={{
                        color: req.met ? '#4caf50' : password ? '#f44336' : 'rgba(255,255,255,0.5)',
                        fontSize: '0.7rem',
                      }}
                    >
                      {req.label}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Box>
            {errors.password && (
              <Typography variant="caption" sx={{ color: '#f44336', mt: 0.5, display: 'block' }}>
                {errors.password}
              </Typography>
            )}
          </Box>

          {/* Password Confirmation Field */}
          <Box>
            <TextField
              label="Confirm Password"
              name="password_confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              placeholder="Confirm your password"
              error={!!errors.passwordConfirmation || (passwordConfirmation && !passwordsMatch)}
              fullWidth
              required
              autoComplete="new-password"
              InputProps={{
                endAdornment: passwordConfirmation && (
                  passwordsMatch ? (
                    <CheckCircleIcon sx={{ color: '#4caf50' }} />
                  ) : (
                    <CancelIcon sx={{ color: '#f44336' }} />
                  )
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  '& fieldset': {
                    borderColor: passwordConfirmation
                      ? (passwordsMatch ? '#4caf50' : '#f44336')
                      : 'rgba(232, 219, 197, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: passwordConfirmation
                      ? (passwordsMatch ? '#4caf50' : '#f44336')
                      : colors.textSecondary,
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: passwordConfirmation
                      ? (passwordsMatch ? '#4caf50' : '#f44336')
                      : colors.accent,
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
            {passwordConfirmation && !passwordsMatch && (
              <Typography variant="caption" sx={{ color: '#f44336', mt: 0.5, display: 'block' }}>
                Passwords do not match
              </Typography>
            )}
            {passwordsMatch && (
              <Typography variant="caption" sx={{ color: '#4caf50', mt: 0.5, display: 'block' }}>
                ✓ Passwords match
              </Typography>
            )}
          </Box>

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
                color: colors.textSecondary,
                borderColor: colors.textSecondary,
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  backgroundColor: 'rgba(232, 219, 197, 0.1)',
                  borderColor: colors.textSecondary,
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
              disabled={isSubmitting || isCheckingEmail || emailAvailable === false || !allPasswordRequirementsMet()}
              startIcon={isSubmitting ? <CircularProgress size={20} /> : null}
              sx={{
                backgroundColor: colors.accent,
                color: '#000',
                fontWeight: 'bold',
                px: 4,
                width: { xs: '100%', sm: 'auto' },
                '&:hover': {
                  backgroundColor: colors.accentDark,
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
