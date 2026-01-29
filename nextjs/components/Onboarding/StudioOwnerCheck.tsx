import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Stack,
  Card,
  CardContent,
  Avatar,
  TextField,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import {
  Person as PersonIcon,
  Brush as BrushIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
  Visibility,
  VisibilityOff,
  Lock as LockIcon,
} from '@mui/icons-material';
import { colors } from '@/styles/colors';
import { api, fetchCsrfToken, getCsrfToken } from '@/utils/api';
import { setToken } from '@/utils/auth';
import { useAuth } from '@/contexts/AuthContext';

interface StudioOwnerCheckProps {
  onStepComplete: (ownerData: {
    hasExistingAccount: boolean;
    existingAccountEmail?: string;
    existingAccountId?: number;
    ownerType: 'artist' | 'user';
    isAuthenticated?: boolean;
  }) => void;
  onBack: () => void;
  // Simplified mode: skip the "are you an artist" question
  simplified?: boolean;
}

const StudioOwnerCheck: React.FC<StudioOwnerCheckProps> = ({ onStepComplete, onBack, simplified = false }) => {
  const { refreshUser } = useAuth();
  const [step, setStep] = useState<'initial' | 'login' | 'select-type'>('initial');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [existingUser, setExistingUser] = useState<{ id: number; name: string; email: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleHasAccount = () => {
    setStep('login');
  };

  const handleNoAccount = () => {
    if (simplified) {
      // Skip the artist question, go directly to studio details
      onStepComplete({
        hasExistingAccount: false,
        ownerType: 'user', // Default to user for simplified flow
      });
    } else {
      setStep('select-type');
    }
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setIsLoggingIn(true);
    setError(null);

    try {
      // Get CSRF token first
      await fetchCsrfToken();
      const csrfToken = getCsrfToken();

      // Attempt to login
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-XSRF-TOKEN': csrfToken || '',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Invalid email or password');
      }

      const result = await response.json();
      console.log('Login successful:', result);

      // Set the authentication token
      if (result.token) {
        setToken(result.token);
        api.clearUserCache();
        await new Promise(resolve => setTimeout(resolve, 200));

        // Refresh auth context to load user data
        try {
          await refreshUser();
        } catch (authError) {
          console.error('Failed to refresh user after login:', authError);
        }
      }

      const user = result.user;
      setExistingUser(user);

      // Proceed with the logged-in user's info
      // The user is now authenticated, so we can skip profile/account steps
      onStepComplete({
        hasExistingAccount: true,
        existingAccountEmail: user.email,
        existingAccountId: user.id,
        ownerType: user.type === 'artist' ? 'artist' : 'user',
        isAuthenticated: true,
      });

    } catch (err: any) {
      console.error('Error logging in:', err);
      setError(err.message || 'Failed to log in. Please check your credentials.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSelectType = (type: 'artist' | 'user') => {
    onStepComplete({
      hasExistingAccount: !!existingUser,
      existingAccountEmail: existingUser?.email || email.trim() || undefined,
      existingAccountId: existingUser?.id,
      ownerType: type,
    });
  };

  // Initial step - ask if they have an existing account
  if (step === 'initial') {
    return (
      <Box sx={{ width: '100%', textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 2,
            fontWeight: 'bold',
            color: colors.textSecondary,
            fontSize: { xs: '1.5rem', md: '2rem' },
          }}
        >
          Studio Owner Account
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: 'text.secondary',
            fontSize: { xs: '0.95rem', md: '1rem' },
            lineHeight: 1.5,
            maxWidth: 500,
            mx: 'auto',
          }}
        >
          To manage your studio, you'll need a personal account. Do you already have an InkedIn account?
        </Typography>

        <Stack spacing={2} sx={{ maxWidth: 400, mx: 'auto' }}>
          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: colors.surface,
              border: '2px solid transparent',
              '&:hover': {
                border: `2px solid ${colors.accent}`,
                transform: 'translateY(-2px)',
              },
            }}
            onClick={handleHasAccount}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: colors.accent,
                    color: colors.textOnLight,
                  }}
                >
                  <CheckCircleIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: colors.accent,
                      mb: 0.5,
                    }}
                  >
                    Yes, I have an account
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Link your studio to your existing profile
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>

          <Card
            sx={{
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              backgroundColor: colors.surface,
              border: '2px solid transparent',
              '&:hover': {
                border: `2px solid ${colors.textSecondary}`,
                transform: 'translateY(-2px)',
              },
            }}
            onClick={handleNoAccount}
          >
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" spacing={2} alignItems="center">
                <Avatar
                  sx={{
                    width: 48,
                    height: 48,
                    backgroundColor: colors.textSecondary,
                    color: colors.textOnLight,
                  }}
                >
                  <PersonIcon sx={{ fontSize: 24 }} />
                </Avatar>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 'bold',
                      color: colors.textSecondary,
                      mb: 0.5,
                    }}
                  >
                    No, I'm new here
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Create a new account to manage your studio
                  </Typography>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Stack>

        <Box sx={{ mt: 4 }}>
          <Button
            variant="outlined"
            onClick={onBack}
            sx={{
              color: colors.textSecondary,
              borderColor: colors.textSecondary,
              '&:hover': {
                backgroundColor: 'rgba(232, 219, 197, 0.1)',
                borderColor: colors.textSecondary,
              },
            }}
          >
            Back
          </Button>
        </Box>
      </Box>
    );
  }

  // Login step
  if (step === 'login') {
    return (
      <Box sx={{ width: '100%', textAlign: 'center' }}>
        <Typography
          variant="h4"
          component="h1"
          sx={{
            mb: 2,
            fontWeight: 'bold',
            color: colors.textSecondary,
            fontSize: { xs: '1.5rem', md: '2rem' },
          }}
        >
          Log In to Your Account
        </Typography>

        <Typography
          variant="body1"
          sx={{
            mb: 4,
            color: 'text.secondary',
            maxWidth: 450,
            mx: 'auto',
          }}
        >
          Sign in with your existing InkedIn account to link it to your new studio.
        </Typography>

        <Stack spacing={3} sx={{ maxWidth: 400, mx: 'auto' }}>
          <TextField
            label="Email Address"
            name="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com"
            fullWidth
            disabled={isLoggingIn}
            autoComplete="email"
            InputProps={{
              startAdornment: <EmailIcon sx={{ color: colors.textMuted, mr: 1 }} />,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(232, 219, 197, 0.5)' },
                '&:hover fieldset': { borderColor: colors.textSecondary },
                '&.Mui-focused fieldset': { borderColor: colors.accent },
              },
              '& .MuiInputLabel-root': {
                color: colors.textSecondary,
                '&.Mui-focused': { color: colors.accent },
              },
            }}
          />

          <TextField
            label="Password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            fullWidth
            disabled={isLoggingIn}
            autoComplete="current-password"
            InputProps={{
              startAdornment: <LockIcon sx={{ color: colors.textMuted, mr: 1 }} />,
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    sx={{ color: colors.textMuted }}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                '& fieldset': { borderColor: 'rgba(232, 219, 197, 0.5)' },
                '&:hover fieldset': { borderColor: colors.textSecondary },
                '&.Mui-focused fieldset': { borderColor: colors.accent },
              },
              '& .MuiInputLabel-root': {
                color: colors.textSecondary,
                '&.Mui-focused': { color: colors.accent },
              },
            }}
          />

          {error && (
            <Alert severity="error" sx={{ textAlign: 'left' }}>
              {error}
            </Alert>
          )}

          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              variant="outlined"
              onClick={() => {
                setStep('initial');
                setError(null);
                setPassword('');
              }}
              disabled={isLoggingIn}
              sx={{
                color: colors.textSecondary,
                borderColor: colors.textSecondary,
                '&:hover': {
                  backgroundColor: 'rgba(232, 219, 197, 0.1)',
                  borderColor: colors.textSecondary,
                },
              }}
            >
              Back
            </Button>

            <Button
              variant="contained"
              onClick={handleLogin}
              disabled={isLoggingIn || !email.trim() || !password}
              startIcon={isLoggingIn ? <CircularProgress size={20} color="inherit" /> : null}
              sx={{
                backgroundColor: colors.accent,
                color: colors.textOnLight,
                fontWeight: 'bold',
                '&:hover': { backgroundColor: colors.accentDark },
                '&:disabled': {
                  backgroundColor: colors.border,
                  color: colors.textMuted,
                },
              }}
            >
              {isLoggingIn ? 'Logging in...' : 'Log In & Continue'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    );
  }

  // Select type step - are you an artist or a client/user?
  return (
    <Box sx={{ width: '100%', textAlign: 'center' }}>
      <Typography
        variant="h4"
        component="h1"
        sx={{
          mb: 2,
          fontWeight: 'bold',
          color: colors.textSecondary,
          fontSize: { xs: '1.5rem', md: '2rem' },
        }}
      >
        Your Personal Profile
      </Typography>

      <Typography
        variant="body1"
        sx={{
          mb: 4,
          color: 'text.secondary',
          maxWidth: 500,
          mx: 'auto',
        }}
      >
        {existingUser
          ? `Welcome back, ${existingUser.name}! Are you also a tattoo artist?`
          : 'We\'ll create your personal account to manage the studio. Are you a tattoo artist yourself?'
        }
      </Typography>

      <Stack spacing={2} sx={{ maxWidth: 450, mx: 'auto' }}>
        <Card
          sx={{
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: colors.surface,
            border: '2px solid transparent',
            '&:hover': {
              border: `2px solid ${colors.accent}`,
              transform: 'translateY(-2px)',
            },
          }}
          onClick={() => handleSelectType('artist')}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: colors.accent,
                  color: colors.textOnLight,
                }}
              >
                <BrushIcon sx={{ fontSize: 24 }} />
              </Avatar>
              <Box sx={{ textAlign: 'left' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: colors.accent,
                    mb: 0.5,
                  }}
                >
                  Yes, I'm a Tattoo Artist
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  I'll get my own artist profile to showcase my work
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        <Card
          sx={{
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            backgroundColor: colors.surface,
            border: '2px solid transparent',
            '&:hover': {
              border: `2px solid ${colors.textSecondary}`,
              transform: 'translateY(-2px)',
            },
          }}
          onClick={() => handleSelectType('user')}
        >
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar
                sx={{
                  width: 48,
                  height: 48,
                  backgroundColor: colors.textSecondary,
                  color: colors.textOnLight,
                }}
              >
                <PersonIcon sx={{ fontSize: 24 }} />
              </Avatar>
              <Box sx={{ textAlign: 'left' }}>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 'bold',
                    color: colors.textSecondary,
                    mb: 0.5,
                  }}
                >
                  No, I'm Not an Artist
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  I'll manage the studio with a standard account
                </Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
      </Stack>

      <Box sx={{ mt: 4 }}>
        <Button
          variant="outlined"
          onClick={() => existingUser ? setStep('login') : setStep('initial')}
          sx={{
            color: colors.textSecondary,
            borderColor: colors.textSecondary,
            '&:hover': {
              backgroundColor: 'rgba(232, 219, 197, 0.1)',
              borderColor: colors.textSecondary,
            },
          }}
        >
          Back
        </Button>
      </Box>
    </Box>
  );
};

export default StudioOwnerCheck;
