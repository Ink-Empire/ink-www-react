import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { colors } from '@/styles/colors';
import { ScheduleItem as ScheduleItemType } from './types';

interface ScheduleItemProps {
  item: ScheduleItemType;
  isLast: boolean;
}

export function ScheduleItem({ item, isLast }: ScheduleItemProps) {
  return (
    <Box sx={{
      display: 'flex',
      gap: 2,
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
      transition: 'background 0.15s',
      '&:hover': { bgcolor: colors.background }
    }}>
      <Box sx={{ width: 50, textAlign: 'center', flexShrink: 0 }}>
        <Typography sx={{ fontSize: '1.5rem', fontWeight: 600, color: colors.textPrimary, lineHeight: 1.2 }}>
          {item.day}
        </Typography>
        <Typography sx={{
          fontSize: '0.75rem',
          color: colors.textMuted,
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          {item.month}
        </Typography>
      </Box>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: '0.8rem', color: colors.accent, fontWeight: 500, mb: 0.25 }}>
          {item.time}
        </Typography>
        <Typography sx={{
          fontWeight: 500,
          color: colors.textPrimary,
          mb: 0.25,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        }}>
          {item.title}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
          <Avatar sx={{
            width: 20,
            height: 20,
            bgcolor: colors.background,
            fontSize: '0.6rem',
            color: colors.textMuted
          }}>
            {item.clientInitials}
          </Avatar>
          <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
            {item.clientName}
          </Typography>
        </Box>
      </Box>
      <Box sx={{
        px: 1,
        py: 0.5,
        borderRadius: '100px',
        fontSize: '0.7rem',
        fontWeight: 500,
        flexShrink: 0,
        alignSelf: 'flex-start',
        bgcolor: item.type === 'appointment' ? `${colors.accent}26` : `${colors.success}26`,
        color: item.type === 'appointment' ? colors.accent : colors.success
      }}>
        {item.type === 'appointment' ? 'Appointment' : 'Consultation'}
      </Box>
    </Box>
  );
}

export default ScheduleItem;
