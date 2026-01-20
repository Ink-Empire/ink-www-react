import React, { useState } from 'react';
import {
  Button,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  CircularProgress,
  Tooltip,
  Box,
  Typography,
  Divider,
} from '@mui/material';
import {
  Google as GoogleIcon,
  Check as CheckIcon,
  KeyboardArrowDown as ArrowDownIcon,
  Sync as SyncIcon,
  LinkOff as DisconnectIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { colors } from '@/styles/colors';
import { useGoogleCalendar } from '@/hooks/useGoogleCalendar';

interface GoogleCalendarButtonProps {
  onSyncComplete?: () => void;
}

export const GoogleCalendarButton: React.FC<GoogleCalendarButtonProps> = ({
  onSyncComplete
}) => {
  const {
    status,
    isLoading,
    isSyncing,
    connect,
    disconnect,
    sync,
  } = useGoogleCalendar();

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const menuOpen = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (status?.connected) {
      setAnchorEl(event.currentTarget);
    } else {
      connect();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleSync = async () => {
    handleClose();
    await sync();
    onSyncComplete?.();
  };

  const handleDisconnect = async () => {
    handleClose();
    await disconnect();
  };

  // Format last synced time
  const formatLastSynced = (dateStr?: string) => {
    if (!dateStr) return 'Never';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Button
        disabled
        sx={{
          px: 2,
          py: 1,
          borderRadius: '6px',
          textTransform: 'none',
        }}
      >
        <CircularProgress size={18} sx={{ mr: 1 }} />
        Loading...
      </Button>
    );
  }

  // Not connected state
  if (!status?.connected) {
    return (
      <Tooltip
        title="Sync your Google Calendar to see all appointments in one place and avoid double-bookings"
        arrow
        placement="bottom"
      >
        <Button
          onClick={handleClick}
          sx={{
            px: 2,
            py: 1,
            bgcolor: colors.accent,
            color: colors.background,
            borderRadius: '6px',
            textTransform: 'none',
            fontWeight: 500,
            fontSize: '0.9rem',
            '&:hover': {
              bgcolor: colors.accentHover,
            },
          }}
          startIcon={<GoogleIcon sx={{ fontSize: 18 }} />}
        >
          Connect Google Calendar
        </Button>
      </Tooltip>
    );
  }

  // Connected state (may need reauth)
  const needsReauth = status?.requires_reauth;

  return (
    <>
      <Button
        onClick={handleClick}
        sx={{
          px: 2,
          py: 1,
          bgcolor: 'transparent',
          color: colors.textPrimary,
          border: `1px solid ${needsReauth ? '#f59e0b' : colors.border}`,
          borderRadius: '6px',
          textTransform: 'none',
          fontWeight: 500,
          fontSize: '0.9rem',
          '&:hover': {
            borderColor: needsReauth ? '#f59e0b' : colors.accent,
            bgcolor: 'rgba(255,255,255,0.02)',
          },
        }}
        startIcon={
          isSyncing ? (
            <CircularProgress size={16} sx={{ color: colors.accent }} />
          ) : needsReauth ? (
            <WarningIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
          ) : (
            <CheckIcon sx={{ fontSize: 16, color: colors.accent }} />
          )
        }
        endIcon={<ArrowDownIcon sx={{ fontSize: 18 }} />}
      >
        {needsReauth ? 'Calendar Issue' : 'Google Calendar'}
      </Button>

      <Menu
        anchorEl={anchorEl}
        open={menuOpen}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            minWidth: 220,
            mt: 1,
          },
        }}
      >
        {/* Warning if reauth needed */}
        {needsReauth && (
          <>
            <Box sx={{ px: 2, py: 1.5, bgcolor: 'rgba(245, 158, 11, 0.1)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <WarningIcon sx={{ fontSize: 16, color: '#f59e0b' }} />
                <Typography sx={{ fontSize: '0.875rem', color: '#f59e0b', fontWeight: 500 }}>
                  Re-authentication Required
                </Typography>
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
                Your calendar connection has expired. Please disconnect and reconnect to restore sync.
              </Typography>
            </Box>
            <Divider sx={{ borderColor: colors.border }} />
          </>
        )}

        {/* Connected account info */}
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mb: 0.5 }}>
            Connected Account
          </Typography>
          <Typography sx={{ fontSize: '0.875rem', color: colors.textPrimary, fontWeight: 500 }}>
            {status.email}
          </Typography>
          <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted, mt: 0.5 }}>
            Last synced: {formatLastSynced(status.last_synced_at)}
          </Typography>
        </Box>

        <Divider sx={{ borderColor: colors.border }} />

        {!needsReauth && (
          <MenuItem
            onClick={handleSync}
            disabled={isSyncing}
            sx={{
              py: 1.5,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            <ListItemIcon>
              {isSyncing ? (
                <CircularProgress size={18} sx={{ color: colors.accent }} />
              ) : (
                <SyncIcon sx={{ color: colors.textSecondary, fontSize: 20 }} />
              )}
            </ListItemIcon>
            <ListItemText
              primary={isSyncing ? 'Syncing...' : 'Sync Now'}
              primaryTypographyProps={{
                sx: { fontSize: '0.875rem', color: colors.textPrimary }
              }}
            />
          </MenuItem>
        )}

        {needsReauth && (
          <MenuItem
            onClick={async () => {
              handleClose();
              await disconnect();
              connect();
            }}
            sx={{
              py: 1.5,
              '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
            }}
          >
            <ListItemIcon>
              <GoogleIcon sx={{ color: '#f59e0b', fontSize: 20 }} />
            </ListItemIcon>
            <ListItemText
              primary="Reconnect Calendar"
              primaryTypographyProps={{
                sx: { fontSize: '0.875rem', color: '#f59e0b', fontWeight: 500 }
              }}
            />
          </MenuItem>
        )}

        <MenuItem
          onClick={handleDisconnect}
          sx={{
            py: 1.5,
            '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' },
          }}
        >
          <ListItemIcon>
            <DisconnectIcon sx={{ color: colors.textSecondary, fontSize: 20 }} />
          </ListItemIcon>
          <ListItemText
            primary="Disconnect"
            primaryTypographyProps={{
              sx: { fontSize: '0.875rem', color: colors.textPrimary }
            }}
          />
        </MenuItem>
      </Menu>
    </>
  );
};

export default GoogleCalendarButton;
