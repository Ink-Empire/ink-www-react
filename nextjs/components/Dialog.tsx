import React from 'react';
import { Modal, Paper, Typography, Button } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import WarningIcon from '@mui/icons-material/Warning';
import InfoIcon from '@mui/icons-material/Info';
import HelpIcon from '@mui/icons-material/Help';
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

const Dialog: React.FC<DialogProps> = ({
  open,
  onClose,
  onConfirm,
  title,
  message,
  type = 'info',
  confirmText = 'OK',
  cancelText = 'Cancel',
  showCancel = false
}) => {
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm();
    }
    onClose();
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircleIcon sx={{ fontSize: 48, color: colors.success }} />;
      case 'error':
        return <ErrorIcon sx={{ fontSize: 48, color: colors.error }} />;
      case 'warning':
        return <WarningIcon sx={{ fontSize: 48, color: colors.warning }} />;
      case 'confirm':
        return <HelpIcon sx={{ fontSize: 48, color: colors.accent }} />;
      case 'info':
      default:
        return <InfoIcon sx={{ fontSize: 48, color: colors.info }} />;
    }
  };

  const getIconColor = () => {
    switch (type) {
      case 'success':
        return colors.success;
      case 'error':
        return colors.error;
      case 'warning':
        return colors.warning;
      case 'confirm':
        return colors.accent;
      case 'info':
      default:
        return colors.info;
    }
  };

  // For confirm dialogs, always show cancel button
  const shouldShowCancel = type === 'confirm' || showCancel;

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="dialog-title"
      aria-describedby="dialog-message"
    >
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          maxWidth: '90%',
          bgcolor: colors.surface,
          boxShadow: 24,
          borderRadius: 2,
          p: 4,
          color: colors.textPrimary,
          textAlign: 'center'
        }}
      >
        {/* Icon */}
        <div style={{ marginBottom: '16px' }}>
          {getIcon()}
        </div>

        {/* Title */}
        <Typography 
          id="dialog-title"
          variant="h5" 
          component="h2" 
          sx={{ 
            mb: 2, 
            color: getIconColor(),
            fontWeight: 'bold'
          }}
        >
          {title}
        </Typography>
        
        {/* Message */}
        <Typography 
          id="dialog-message"
          variant="body1" 
          sx={{ 
            mb: 3,
            color: 'white',
            lineHeight: 1.6
          }}
        >
          {message}
        </Typography>
        
        {/* Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: shouldShowCancel ? 'space-between' : 'center',
          gap: '12px'
        }}>
          {shouldShowCancel && (
            <Button
              onClick={onClose}
              sx={{ 
                color: '#888',
                '&:hover': { color: 'white' },
                minWidth: '80px'
              }}
            >
              {cancelText}
            </Button>
          )}
          
          <Button
            variant="contained"
            onClick={handleConfirm}
            sx={{
              bgcolor: getIconColor(),
              '&:hover': {
                bgcolor: type === 'success' ? colors.success
                       : type === 'error' ? colors.error
                       : type === 'warning' ? colors.warning
                       : type === 'confirm' ? colors.accentDark
                       : colors.info
              },
              minWidth: '80px'
            }}
          >
            {confirmText}
          </Button>
        </div>
      </Paper>
    </Modal>
  );
};

export default Dialog;