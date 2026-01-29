import React from 'react';
import { Box, Typography } from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { colors } from '@/styles/colors';
import { ActivityItem as ActivityItemType } from './types';

interface ActivityItemProps {
  activity: ActivityItemType;
  isLast: boolean;
}

const activityIcons: Record<string, { icon: React.ReactNode; color: string }> = {
  save: { icon: <BookmarkIcon sx={{ fontSize: 16 }} />, color: colors.accent },
  like: { icon: <FavoriteIcon sx={{ fontSize: 16 }} />, color: colors.error },
  message: { icon: <ChatBubbleOutlineIcon sx={{ fontSize: 16 }} />, color: colors.success }
};

export function ActivityItem({ activity, isLast }: ActivityItemProps) {
  const { icon, color } = activityIcons[activity.type] || activityIcons.like;

  return (
    <Box sx={{
      display: 'flex',
      gap: 1.5,
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`
    }}>
      <Box sx={{
        width: 32,
        height: 32,
        bgcolor: colors.background,
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        flexShrink: 0
      }}>
        {icon}
      </Box>
      <Box sx={{ flex: 1 }}>
        <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary, mb: 0.15 }}>
          <Box component="span" sx={{ fontWeight: 600 }}>{activity.user}</Box>
          {' '}{activity.action}{activity.target ? ` "${activity.target}"` : ''}
        </Typography>
        <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
          {activity.time}
        </Typography>
      </Box>
    </Box>
  );
}

export default ActivityItem;
