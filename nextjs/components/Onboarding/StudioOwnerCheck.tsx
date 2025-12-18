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
} from '@mui/material';
import {
  Person as PersonIcon,
  Brush as BrushIcon,
  Email as EmailIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { colors } from '@/styles/colors';
import { api } from '@/utils/api';

interface StudioOwnerCheckProps {
  onStepComplete: (ownerData: {
    hasExistingAccount: boolean;
    existingAccountEmail?: string;
    existingAccountId?: number;
    ownerType: 'artist' | 'user';
  }) => void;
  onBack: () => void;
}

const StudioOwnerCheck: React.FC<StudioOwnerCheckProps> = ({ onStepComplete, onBack }) => {
  const [step, setStep] = useState<'initial' | 'email-check' | 'select-type'>('initial');
  const [email, setEmail] = useState('');
  const [isChecking, setIsChecking] = useState(false);
  const [existingUser, setExistingUser] = useState<{ id: number; name: string; email: string; type: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleHasAccount = () => {
    setStep('email-check');
  };

  const handleNoAccount = () => {
    setStep('select-type');
  };

  const handleCheckEmail = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsChecking(true);
    setError(null);

    try {
      const response = await api.post<{ exists: boolean; user?: { id: number; name: string; email: string; type: string } }>('/users/check-email', { email: email.trim() });

      if (response.exists && response.user) {
        setExistingUser(response.user);
        // If they already have an account, they'll use that as the owner
        // Ask what type they want to be (if not already set)
        if (response.user.type === 'artist') {
          // Already an artist, proceed directly
          onStepComplete({
            hasExistingAccount: true,
            existingAccountEmail: email.trim(),
            existingAccountId: response.user.id,
            ownerType: 'artist',
          });
        } else {
          // Show option to become artist or stay as user
          setStep('select-type');
        }
      } else {
        setError('No account found with this email. Please create a new account.');
        setStep('select-type');
      }
    } catch (err: any) {
      console.error('Error checking email:', err);
      // If endpoint doesn't exist yet, just proceed to type selection
      setStep('select-type');
    } finally {
      setIsChecking(false);
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
                    color: '#000',
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
                    color: '#000',
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

  // Email check step
  if (step === 'email-check') {
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
          Find Your Account
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
          Enter the email address associated with your InkedIn account.
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
            disabled={isChecking}
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

          {error && (
            <Alert severity="info" sx={{ textAlign: 'left' }}>
              {error}
            </Alert>
          )}

          <Stack direction="row" spacing={2} justifyContent="space-between">
            <Button
              variant="outlined"
              onClick={() => setStep('initial')}
              disabled={isChecking}
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
              onClick={handleCheckEmail}
              disabled={isChecking || !email.trim()}
              startIcon={isChecking ? <CircularProgress size={20} /> : null}
              sx={{
                backgroundColor: colors.accent,
                color: '#000',
                fontWeight: 'bold',
                '&:hover': { backgroundColor: colors.accentDark },
                '&:disabled': {
                  backgroundColor: 'rgba(232, 219, 197, 0.3)',
                  color: 'rgba(0, 0, 0, 0.5)',
                },
              }}
            >
              {isChecking ? 'Checking...' : 'Continue'}
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
                  color: '#000',
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
                  color: '#000',
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
          onClick={() => existingUser ? setStep('email-check') : setStep('initial')}
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
