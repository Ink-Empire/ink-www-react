import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
  IconButton,
  InputAdornment,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useUser } from '../contexts/AuthContext';
import { colors, modalStyles } from '@/styles/colors';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  fieldName: string;
}

const AccountModal: React.FC<AccountModalProps> = ({ isOpen, onClose, onConfirm, fieldName }) => {
  const { userData } = useUser();
  const [inputValue, setInputValue] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setShowPassword(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    const data: Record<string, string> = {};
    data[fieldName] = inputValue;
    onConfirm(data);
    setInputValue('');
  };

  const handleClose = () => {
    setInputValue('');
    onClose();
  };

  const getTitle = () => {
    switch (fieldName) {
      case 'name':
        return 'Update Name';
      case 'email':
        return 'Update Email';
      case 'password':
        return 'Update Password';
      default:
        return `Update ${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`;
    }
  };

  const getPlaceholder = () => {
    switch (fieldName) {
      case 'name':
        return userData?.name || 'Enter new name';
      case 'email':
        return userData?.email || 'Enter new email';
      case 'password':
        return 'Enter new password';
      default:
        return '';
    }
  };

  const getInputType = () => {
    if (fieldName === 'password') {
      return showPassword ? 'text' : 'password';
    }
    if (fieldName === 'email') {
      return 'email';
    }
    return 'text';
  };

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: modalStyles.paper }}
      slotProps={{ backdrop: { sx: modalStyles.backdrop } }}
    >
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 1 }}>
        <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>
          {getTitle()}
        </Typography>
        <IconButton
          onClick={handleClose}
          sx={{ color: colors.textSecondary, '&:hover': { color: colors.textPrimary } }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        <TextField
          autoFocus
          fullWidth
          type={getInputType()}
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={getPlaceholder()}
          variant="outlined"
          InputProps={{
            endAdornment: fieldName === 'password' ? (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                  sx={{ color: colors.textSecondary }}
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ) : undefined,
          }}
          sx={{
            mt: 1,
            '& .MuiOutlinedInput-root': {
              color: colors.textPrimary,
              '& fieldset': {
                borderColor: colors.inputBorder,
              },
              '&:hover fieldset': {
                borderColor: colors.inputBorderHover,
              },
              '&.Mui-focused fieldset': {
                borderColor: colors.accent,
              },
              '& input::placeholder': {
                color: colors.textMuted,
                opacity: 1,
              },
            },
          }}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3, pt: 1 }}>
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
          onClick={handleConfirm}
          disabled={!inputValue.trim()}
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
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccountModal;
