import React, { useMemo } from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import { colors } from '@/styles/colors';
import { ApiConversation } from '@/hooks/useConversations';
import { TypeBadge } from './TypeBadge';
import { formatTimestamp } from './utils';

interface ConversationItemProps {
  conversation: ApiConversation;
  isActive: boolean;
  onClick: () => void;
  currentUserId?: number;
}

export function ConversationItem({
  conversation,
  isActive,
  onClick,
  currentUserId,
}: ConversationItemProps) {
  const isUnread = conversation.unread_count > 0;
  const participant = conversation.participant;

  // Format last message preview
  const lastMessagePreview = useMemo(() => {
    if (!conversation.last_message) return 'No messages yet';
    const isOwnMessage = conversation.last_message.sender_id === currentUserId;
    const prefix = isOwnMessage ? 'You: ' : '';
    return prefix + (conversation.last_message.content || 'Attachment');
  }, [conversation.last_message, currentUserId]);

  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex',
        gap: 1.5,
        p: 2,
        borderBottom: `1px solid ${colors.borderSubtle}`,
        cursor: 'pointer',
        transition: 'background 0.15s ease',
        bgcolor: isActive
          ? colors.accentDim
          : isUnread
          ? 'rgba(201, 169, 98, 0.05)'
          : 'transparent',
        borderLeft: isActive ? `3px solid ${colors.accent}` : '3px solid transparent',
        '&:hover': {
          bgcolor: isActive ? colors.accentDim : colors.surfaceElevated,
        },
      }}
    >
      <Box sx={{ position: 'relative', flexShrink: 0 }}>
        <Avatar
          src={participant?.image?.uri}
          sx={{
            width: 48,
            height: 48,
            bgcolor: colors.surfaceElevated,
            color: colors.accent,
            fontSize: '1rem',
            fontWeight: 600,
          }}
        >
          {participant?.initials || '??'}
        </Avatar>
        {participant?.is_online && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 2,
              right: 2,
              width: 12,
              height: 12,
              bgcolor: colors.success,
              border: `2px solid ${colors.surface}`,
              borderRadius: '50%',
            }}
          />
        )}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
          <Typography
            sx={{
              fontWeight: 600,
              fontSize: '0.95rem',
              color: colors.textPrimary,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {participant?.name || participant?.username || 'Unknown User'}
          </Typography>
          <Typography
            sx={{
              fontSize: '0.75rem',
              color: isUnread ? colors.accent : colors.textMuted,
              flexShrink: 0,
              ml: 1,
            }}
          >
            {conversation.last_message?.created_at
              ? formatTimestamp(conversation.last_message.created_at)
              : formatTimestamp(conversation.created_at)}
          </Typography>
        </Box>

        <Typography
          sx={{
            fontSize: '0.85rem',
            color: isUnread ? colors.textSecondary : colors.textMuted,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            mb: 0.75,
          }}
        >
          {lastMessagePreview}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <TypeBadge type={conversation.type} />
          {isUnread && (
            <Box
              sx={{
                width: 20,
                height: 20,
                bgcolor: colors.accent,
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.7rem',
                fontWeight: 600,
                color: colors.background,
              }}
            >
              {conversation.unread_count}
            </Box>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default ConversationItem;
