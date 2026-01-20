import React, { useState } from 'react';
import { Box, Tooltip, IconButton, ClickAwayListener } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { colors } from '@/styles/colors';

interface InfoTooltipProps {
  text: string;
  size?: 'small' | 'medium';
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'top-start' | 'top-end' | 'bottom-start' | 'bottom-end';
}

export default function InfoTooltip({ text, size = 'small', placement = 'top' }: InfoTooltipProps) {
  const [open, setOpen] = useState(false);

  const handleTooltipClose = () => {
    setOpen(false);
  };

  const handleTooltipOpen = () => {
    setOpen(true);
  };

  const iconSize = size === 'small' ? 16 : 20;

  return (
    <ClickAwayListener onClickAway={handleTooltipClose}>
      <Tooltip
        title={text}
        placement={placement}
        open={open}
        onClose={handleTooltipClose}
        disableFocusListener
        disableHoverListener
        disableTouchListener
        arrow
        componentsProps={{
          tooltip: {
            sx: {
              bgcolor: colors.surface,
              color: colors.textPrimary,
              fontSize: '0.8rem',
              lineHeight: 1.5,
              padding: '10px 14px',
              maxWidth: 280,
              border: `1px solid ${colors.border}`,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
              '& .MuiTooltip-arrow': {
                color: colors.surface,
                '&::before': {
                  border: `1px solid ${colors.border}`,
                },
              },
            },
          },
        }}
      >
        <IconButton
          onClick={handleTooltipOpen}
          onMouseEnter={handleTooltipOpen}
          onMouseLeave={handleTooltipClose}
          sx={{
            p: 0.25,
            color: colors.textMuted,
            '&:hover': {
              color: colors.accent,
              bgcolor: 'transparent',
            },
          }}
        >
          <InfoOutlinedIcon sx={{ fontSize: iconSize }} />
        </IconButton>
      </Tooltip>
    </ClickAwayListener>
  );
}
