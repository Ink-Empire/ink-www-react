import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Stack,
  Box,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import { colors } from '@/styles/colors';
import { api } from '@/utils/api';

const PASSWORD_REQUIREMENTS = {
  minLength: { label: 'At least 8 characters', test: (p: string) => p.length >= 8 },
  hasUppercase: { label: 'One uppercase letter', test: (p: string) => /[A-Z]/.test(p) },
  hasLowercase: { label: 'One lowercase letter', test: (p: string) => /[a-z]/.test(p) },
  hasNumber: { label: 'One number', test: (p: string) => /[0-9]/.test(p) },
  hasSymbol: { label: 'One symbol (!@#$%^&*...)', test: (p: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(p) },
};

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ isOpen, onClose }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const checkRequirement = (key: keyof typeof PASSWORD_REQUIREMENTS) => {
    return PASSWORD_REQUIREMENTS[key].test(newPassword);
  };

  const allRequirementsMet = Object.keys(PASSWORD_REQUIREMENTS).every((key) =>
    checkRequirement(key as keyof typeof PASSWORD_REQUIREMENTS)
  );

  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0;

  const canSubmit = currentPassword.length > 0 && allRequirementsMet && passwordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!canSubmit) {
      return;
    }

    setIsLoading(true);

    try {
      await api.put('/users/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: confirmPassword,
      }, { requiresAuth: true });
      setSuccess(true);
    } catch (err: any) {
      if (err.status === 422) {
        const message = err.message || 'Please check your password and try again.';
        if (message.toLowerCase().includes('current password') || message.toLowerCase().includes('incorrect')) {
          setError('Current password is incorrect.');
        } else if (message.toLowerCase().includes('previously used') || message.toLowerCase().includes('password history')) {
          setError('You cannot reuse one of your last 5 passwords. Please choose a different password.');
        } else {
          setError(message);
        }
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrentPassword(false);
    setShowNewPassword(false);
    setShowConfirmPassword(false);
    setError(null);
    setSuccess(false);
    onClose();
  };

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      '& fieldset': {
        borderColor: colors.border,
      },
      '&:hover fieldset': {
        borderColor: colors.textSecondary,
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.accent,
      },
      '& input': {
        color: colors.textPrimary,
      },
    },
    '& .MuiInputLabel-root': {
      color: colors.textSecondary,
      '&.Mui-focused': {
        color: colors.accent,
      },
    },
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          bgcolor: colors.surface,
          color: colors.textPrimary,
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5, pb: 1 }}>
        <LockIcon sx={{ color: colors.accent }} />
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          Change Password
        </Typography>
      </DialogTitle>

      <DialogContent>
        {success ? (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
            <Typography variant="h6" sx={{ mb: 1, color: colors.textPrimary }}>
              Password Changed Successfully
            </Typography>
            <Typography sx={{ color: colors.textSecondary }}>
              Your password has been updated. Use your new password the next time you log in.
            </Typography>
          </Box>
        ) : (
          <form onSubmit={handleSubmit}>
            <Stack spacing={2.5} sx={{ pt: 1 }}>
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
                label="Current Password"
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                autoComplete="current-password"
                fullWidth
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showCurrentPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        edge="end"
                        sx={{ color: colors.textSecondary }}
                      >
                        {showCurrentPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />

              <TextField
                label="New Password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                autoComplete="new-password"
                fullWidth
                required
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        edge="end"
                        sx={{ color: colors.textSecondary }}
                      >
                        {showNewPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={textFieldSx}
              />

              {/* Password Requirements Checklist */}
              {newPassword.length > 0 && (
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
                label="Confirm New Password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                fullWidth
                required
                error={confirmPassword.length > 0 && !passwordsMatch}
                helperText={
                  confirmPassword.length > 0 && !passwordsMatch
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
                  ...textFieldSx,
                  '& .MuiFormHelperText-root': {
                    color: colors.error,
                  },
                }}
              />
            </Stack>
          </form>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 2 }}>
        {success ? (
          <Button
            onClick={handleClose}
            sx={{
              px: 3,
              py: 1,
              bgcolor: colors.accent,
              color: colors.background,
              borderRadius: '6px',
              textTransform: 'none',
              fontWeight: 500,
              '&:hover': { bgcolor: colors.accentHover },
            }}
          >
            Done
          </Button>
        ) : (
          <>
            <Button
              onClick={handleClose}
              sx={{
                px: 3,
                py: 1,
                color: colors.textSecondary,
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { bgcolor: colors.background },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isLoading || !canSubmit}
              startIcon={isLoading ? <CircularProgress size={20} sx={{ color: colors.textMuted }} /> : null}
              sx={{
                px: 3,
                py: 1,
                bgcolor: colors.accent,
                color: colors.background,
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': { bgcolor: colors.accentHover },
                '&:disabled': { bgcolor: colors.border, color: colors.textMuted },
              }}
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </Button>
          </>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default ChangePasswordModal;
