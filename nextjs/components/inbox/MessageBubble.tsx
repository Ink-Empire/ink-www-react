import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import { colors } from '@/styles/colors';
import { ApiMessage } from '@/hooks/useConversations';
import { formatMessageTime } from './utils';

interface MessageBubbleProps {
  message: ApiMessage;
  isSent: boolean;
  senderInitials: string;
  senderImage?: string;
  showAvatar?: boolean;
  isLastInGroup?: boolean;
}

export function MessageBubble({
  message,
  isSent,
  senderInitials,
  senderImage,
  showAvatar = true,
  isLastInGroup = true,
}: MessageBubbleProps) {
  const hasBookingCard = message.type === 'booking_card' && message.metadata;
  const hasDepositRequest = message.type === 'deposit_request' && message.metadata;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        mb: isLastInGroup ? 2 : 0.5,
        maxWidth: '70%',
        flexDirection: isSent ? 'row-reverse' : 'row',
        ml: isSent ? 'auto' : 0,
      }}
    >
      {showAvatar ? (
        <Avatar
          src={senderImage}
          sx={{
            width: 32,
            height: 32,
            bgcolor: isSent ? colors.accentDim : colors.surface,
            color: colors.accent,
            fontSize: '0.75rem',
            fontWeight: 600,
            flexShrink: 0,
            alignSelf: 'flex-start',
          }}
        >
          {senderInitials}
        </Avatar>
      ) : (
        <Box sx={{ width: 32, flexShrink: 0 }} />
      )}

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          alignItems: isSent ? 'flex-end' : 'flex-start',
        }}
      >
        {message.content && (
          <Box
            sx={{
              px: 2,
              py: 1.5,
              bgcolor: isSent ? colors.accent : colors.accentDim,
              color: isSent ? colors.background : colors.textPrimary,
              borderRadius: '12px',
              borderBottomLeftRadius: isSent ? '12px' : '4px',
              borderBottomRightRadius: isSent ? '4px' : '12px',
              fontSize: '0.9rem',
              lineHeight: 1.5,
            }}
          >
            {message.content}
          </Box>
        )}

        {/* Image attachments */}
        {message.attachments && message.attachments.length > 0 && (
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 0.5 }}>
            {message.attachments.map((attachment) =>
              attachment.image ? (
                <Box
                  key={attachment.id}
                  sx={{
                    maxWidth: 280,
                    borderRadius: '8px',
                    overflow: 'hidden',
                  }}
                >
                  <Box
                    component="img"
                    src={attachment.image.uri}
                    alt="Attachment"
                    sx={{ width: '100%', display: 'block' }}
                  />
                </Box>
              ) : null
            )}
          </Box>
        )}

        {/* Booking card */}
        {hasBookingCard && message.metadata && (
          <Box
            sx={{
              bgcolor: isSent ? 'rgba(0,0,0,0.15)' : colors.surfaceElevated,
              border: `1px solid ${isSent ? 'rgba(0,0,0,0.2)' : colors.borderLight}`,
              borderRadius: '12px',
              p: 3,
              mt: 1.5,
              minWidth: 280,
              maxWidth: 320,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, fontWeight: 600, fontSize: '0.95rem' }}>
              <CalendarMonthIcon sx={{ fontSize: 20, color: isSent ? colors.textSecondary : colors.success }} />
              Booking Details
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: '0.9rem' }}>
              {[
                { label: 'Date', value: message.metadata.date },
                { label: 'Time', value: message.metadata.time },
                { label: 'Duration', value: message.metadata.duration },
                { label: 'Deposit', value: message.metadata.deposit },
              ].map(({ label, value }) =>
                value ? (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3 }}>
                    <Typography sx={{ color: colors.textSecondary, fontSize: 'inherit', flexShrink: 0 }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontWeight: 500, fontSize: 'inherit', color: colors.textPrimary, textAlign: 'right' }}>{value}</Typography>
                  </Box>
                ) : null
              )}
            </Box>
          </Box>
        )}

        {/* Deposit request */}
        {hasDepositRequest && message.metadata && (
          <Box
            sx={{
              bgcolor: isSent ? 'rgba(0,0,0,0.15)' : colors.surfaceElevated,
              border: `1px solid ${isSent ? 'rgba(0,0,0,0.2)' : colors.borderLight}`,
              borderRadius: '12px',
              p: 3,
              mt: 1.5,
              minWidth: 280,
              maxWidth: 320,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2.5, fontWeight: 600, fontSize: '0.95rem' }}>
              <AttachMoneyIcon sx={{ fontSize: 20, color: isSent ? colors.textSecondary : colors.accent }} />
              Deposit Request
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3, fontSize: '0.9rem' }}>
              <Typography sx={{ color: colors.textSecondary, fontSize: 'inherit', flexShrink: 0 }}>
                Amount
              </Typography>
              <Typography sx={{ fontWeight: 500, fontSize: 'inherit', color: colors.textPrimary, textAlign: 'right' }}>{message.metadata.amount}</Typography>
            </Box>
          </Box>
        )}

        {isLastInGroup && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, px: 0.5 }}>
            <Typography sx={{ fontSize: '0.7rem', color: colors.textMuted }}>
              {formatMessageTime(message.created_at)}
            </Typography>
            {isSent && (
              <Typography
                sx={{
                  fontSize: '0.65rem',
                  color: message.read_at ? colors.accent : colors.textMuted,
                  fontWeight: message.read_at ? 500 : 400,
                }}
              >
                {message.read_at ? '· Seen' : '· Sent'}
              </Typography>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default MessageBubble;
