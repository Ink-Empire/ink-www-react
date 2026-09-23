import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Alert,
  CircularProgress,
  Stack,
  Collapse,
  InputAdornment,
  IconButton,
} from '@mui/material';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { colors } from '@/styles/colors';
import { authService } from '@/services/authService';

interface CorrectEmailFormProps {
  currentEmail: string;
  onCorrected: (newEmail: string) => void;
}

const fieldStyles = {
  '& .MuiOutlinedInput-root': {
    '& fieldset': { borderColor: 'rgba(232, 219, 197, 0.5)' },
    '&:hover fieldset': { borderColor: '#e8dbc5' },
    '&.Mui-focused fieldset': { borderColor: colors.accent },
    '& input': { color: colors.textPrimary },
  },
  '& .MuiInputLabel-root': { color: colors.textSecondary },
};

/**
 * Lets someone who mistyped their address at registration point the account at
 * the right one. The account is unverified, so there is no session to use; the
 * old address and password are the credential.
 */
const CorrectEmailForm: React.FC<CorrectEmailFormProps> = ({ currentEmail, onCorrected }) => {
  const [open, setOpen] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = newEmail.trim().length > 0 && password.length > 0 && !isLoading;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!currentEmail) {
      setError('We do not know which account to update. Please register again or contact support.');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authService.correctEmail({
        email: currentEmail,
        password,
        new_email: newEmail.trim(),
      });

      setPassword('');
      setNewEmail('');
      setOpen(false);
      onCorrected(response.verification.email);
    } catch (err: any) {
      if (err.status === 422) {
        setError(err.message || 'Please check the details and try again.');
      } else if (err.status === 429) {
        setError('Too many attempts. Please wait a few minutes and try again.');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Button
        variant="text"
        onClick={() => setOpen(!open)}
        sx={{ color: colors.textMuted, textTransform: 'none', textDecoration: 'underline' }}
      >
        {open ? 'Nevermind, my email is correct' : 'Used the wrong email address?'}
      </Button>

      <Collapse in={open}>
        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ mt: 2, textAlign: 'left', maxWidth: 420, mx: 'auto' }}
        >
          <Typography variant="body2" sx={{ color: colors.textSecondary, mb: 2 }}>
            We will move this account to the new address and send the verification link there.
            The link already sent to {currentEmail || 'the old address'} stops working.
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Stack spacing={2}>
            <TextField
              label="Correct email address"
              type="email"
              autoComplete="email"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              fullWidth
              required
              sx={fieldStyles}
            />

            <TextField
              label="Password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              fullWidth
              required
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                      sx={{ color: colors.textSecondary }}
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={fieldStyles}
            />

            <Button
              type="submit"
              variant="contained"
              disabled={!canSubmit}
              sx={{
                bgcolor: colors.accent,
                color: colors.textOnLight,
                py: 1.5,
                '&:hover': { bgcolor: colors.accentDark },
              }}
            >
              {isLoading ? <CircularProgress size={24} /> : 'Update and resend'}
            </Button>
          </Stack>
        </Box>
      </Collapse>
    </Box>
  );
};

export default CorrectEmailForm;
