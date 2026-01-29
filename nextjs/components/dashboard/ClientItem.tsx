import React from 'react';
import { Box, Typography, Avatar, Button } from '@mui/material';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import FavoriteIcon from '@mui/icons-material/Favorite';
import { colors } from '@/styles/colors';
import { ClientItem as ClientItemType } from './types';

interface ClientItemProps {
  client: ClientItemType;
  isLast: boolean;
}

const hintIcons: Record<string, React.ReactNode> = {
  save: <BookmarkIcon sx={{ fontSize: 14, color: colors.accent }} />,
  message: <ChatBubbleOutlineIcon sx={{ fontSize: 14, color: colors.accent }} />,
  view: <AccessTimeIcon sx={{ fontSize: 14, color: colors.accent }} />,
  like: <FavoriteIcon sx={{ fontSize: 14, color: colors.accent }} />
};

export function ClientItem({ client, isLast }: ClientItemProps) {
  return (
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      gap: 1.5,
      p: 2,
      borderBottom: isLast ? 'none' : `1px solid ${colors.border}`,
      transition: 'background 0.15s',
      '&:hover': { bgcolor: colors.background }
    }}>
      <Avatar sx={{
        width: 44,
        height: 44,
        bgcolor: colors.background,
        color: colors.textSecondary,
        fontSize: '0.9rem',
        fontWeight: 600
      }}>
        {client.initials}
      </Avatar>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontWeight: 500, color: colors.textPrimary, mb: 0.15 }}>
          {client.name}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {hintIcons[client.hintType]}
          <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
            {client.hint}
          </Typography>
        </Box>
      </Box>
      <Button sx={{
        px: 1.5,
        py: 0.5,
        bgcolor: `${colors.accent}26`,
        border: `1px solid ${colors.accent}4D`,
        borderRadius: '6px',
        color: colors.accent,
        fontSize: '0.8rem',
        fontWeight: 500,
        textTransform: 'none',
        '&:hover': { bgcolor: colors.accent, color: colors.background }
      }}>
        Message
      </Button>
    </Box>
  );
}

export default ClientItem;
