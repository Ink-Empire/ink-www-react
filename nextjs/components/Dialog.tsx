import React from 'react';
import {
  Dialog as MuiDialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { colors } from '@/styles/colors';

export type DialogType = 'success' | 'error' | 'warning' | 'info' | 'confirm';

interface DialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: DialogType;
  confirmText?: string;
  cancelText?: string;
  showCancel?: boolean;
}

const typeConfig: Record<DialogType, { icon: React.ReactNode; color: string }> = {
  success: {
    icon: <CheckCircleOutlineIcon sx={{ fontSize: 28 }} />,
    color: colors.success,
  },
  error: {
    icon: <ErrorOutlineIcon sx={{ fontSize: 28 }} />,
    color: colors.error,
  },
  warning: {
    icon: <WarningAmberIcon sx={{ fontSize: 28 }} />,
    color: colors.warning,
  },
  info: {
    icon: <InfoOutlinedIcon sx={{ fontSize: 28 }} />,
    color: colors.accent,
  },
  confirm: {
    icon: <HelpOutlineIcon sx={{ fontSize: 28 }} />,
    color: colors.accent,
  },
};

const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false,
}) => {
  const config = typeConfig[type];
  const shouldShowCancel = type === 'confirm' || showCancel;

  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  return (
    <MuiDialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{
        sx: {
          bgcolor: colors.surface,
          m: { xs: 2, sm: 3 },
          width: { xs: 'calc(100% - 32px)', sm: 'auto' },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ color: config.color, display: 'flex' }}>
            {config.icon}
          </Box>
          <Typography
            component="span"
            sx={{
              color: colors.textPrimary,
              fontWeight: 600,
              fontSize: '1.1rem',
            }}
          >
            {title}
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 1 }}>
        <Typography sx={{ color: colors.textSecondary, fontSize: '0.95rem', lineHeight: 1.6 }}>
          {message}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, pt: 1, gap: 1 }}>
        {shouldShowCancel && (
          <Button
            onClick={onClose}
            sx={{
              color: colors.textSecondary,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            {cancelText}
          </Button>
        )}
        <Button
          onClick={handleConfirm}
          sx={{
            bgcolor: config.color,
            color: type === 'warning' ? colors.background : colors.textPrimary,
            px: 3,
            '&:hover': {
              bgcolor: config.color,
              opacity: 0.9,
            },
          }}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </MuiDialog>
  );
};

export default Dialog;