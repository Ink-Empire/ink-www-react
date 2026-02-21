import React, { useState } from 'react';
import Link from 'next/link';
import { Box, Typography, Avatar, Button, CircularProgress } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import UpdateIcon from '@mui/icons-material/Update';
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
  onRespondToReschedule?: (messageId: number, action: 'accept' | 'decline') => Promise<any>;
}

export function MessageBubble({
  message,
  isSent,
  senderInitials,
  senderImage,
  showAvatar = true,
  isLastInGroup = true,
  onRespondToReschedule,
}: MessageBubbleProps) {
  const hasBookingCard = message.type === 'booking_card' && message.metadata;
  const hasDepositRequest = message.type === 'deposit_request' && message.metadata;
  const hasCancellation = message.type === 'cancellation' && message.metadata;
  const hasReschedule = message.type === 'reschedule' && message.metadata;

  const [respondingAction, setRespondingAction] = useState<'accept' | 'decline' | null>(null);

  const handleRescheduleRespond = async (action: 'accept' | 'decline') => {
    if (!onRespondToReschedule) return;
    setRespondingAction(action);
    try {
      await onRespondToReschedule(message.id, action);
    } finally {
      setRespondingAction(null);
    }
  };

  const formatProposedDateTime = (date?: string, startTime?: string, endTime?: string) => {
    if (!date) return '';
    try {
      const dateObj = new Date(`${date}T${startTime || '00:00'}`);
      const formatted = dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      if (startTime) {
        const start = dateObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
        if (endTime) {
          const endObj = new Date(`${date}T${endTime}`);
          const end = endObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
          return `${formatted}, ${start} - ${end}`;
        }
        return `${formatted} at ${start}`;
      }
      return formatted;
    } catch {
      return date;
    }
  };

  const rescheduleStatus = message.metadata?.status;

  // System messages render centered
  if (message.type === 'system') {
    const calendarLink = message.metadata?.calendar_link;
    const isArtist = isSent;
    const displayContent = isArtist && message.metadata?.artist_content
      ? message.metadata.artist_content
      : message.content;
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, px: 2 }}>
        <Typography component="span" sx={{
          fontSize: '0.8rem',
          color: colors.textSecondary,
          fontStyle: 'italic',
          textAlign: 'center',
        }}>
          {displayContent}
          {isArtist && calendarLink && (
            <>
              {' '}
              <Link href={calendarLink} style={{ color: colors.accent, textDecoration: 'none' }}>
                View calendar
              </Link>
            </>
          )}
        </Typography>
      </Box>
    );
  }

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
        {message.content && !hasCancellation && !hasReschedule && !hasBookingCard && (
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
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, fontWeight: 600, fontSize: '0.95rem' }}>
                <CalendarMonthIcon sx={{ fontSize: 20, color: isSent ? colors.textSecondary : colors.success }} />
                Booking Request
              </Box>
              {message.metadata.status === 'pending' && (
                <Box sx={{ display: 'inline-flex', px: 1.5, py: 0.5, bgcolor: `${colors.accent}18`, color: colors.accent, borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Pending
                </Box>
              )}
              {message.metadata.status === 'accepted' && (
                <Box sx={{ display: 'inline-flex', px: 1.5, py: 0.5, bgcolor: `${colors.success}18`, color: colors.success, borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Confirmed
                </Box>
              )}
              {message.metadata.status === 'declined' && (
                <Box sx={{ display: 'inline-flex', px: 1.5, py: 0.5, bgcolor: 'rgba(239, 68, 68, 0.12)', color: colors.error, borderRadius: '6px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>
                  Declined
                </Box>
              )}
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
            {message.content && (
              <Typography sx={{
                fontSize: '0.85rem',
                color: colors.textSecondary,
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${isSent ? 'rgba(255,255,255,0.1)' : colors.border}`,
                fontStyle: 'italic',
                lineHeight: 1.5,
              }}>
                {message.content}
              </Typography>
            )}
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

        {/* Cancellation card */}
        {hasCancellation && message.metadata && (
          <Box
            sx={{
              bgcolor: 'rgba(239, 68, 68, 0.08)',
              border: `1px solid rgba(239, 68, 68, 0.25)`,
              borderRadius: '12px',
              p: 3,
              mt: 1.5,
              minWidth: 280,
              maxWidth: 320,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, fontWeight: 600, fontSize: '0.95rem', color: colors.error }}>
              <EventBusyIcon sx={{ fontSize: 20 }} />
              Appointment Cancelled
            </Box>
            {message.metadata.reason && (
              <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary, mb: 1.5 }}>
                {message.metadata.reason}
              </Typography>
            )}
            <Box
              sx={{
                display: 'inline-flex',
                px: 1.5,
                py: 0.5,
                bgcolor: 'rgba(239, 68, 68, 0.12)',
                color: colors.error,
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              Cancelled
            </Box>
          </Box>
        )}

        {/* Reschedule card */}
        {hasReschedule && message.metadata && (
          <Box
            sx={{
              bgcolor: isSent ? 'rgba(0,0,0,0.15)' : colors.surfaceElevated,
              border: `1px solid ${
                rescheduleStatus === 'accepted' ? `rgba(74, 155, 127, 0.3)` :
                rescheduleStatus === 'declined' ? `rgba(239, 68, 68, 0.25)` :
                isSent ? 'rgba(0,0,0,0.2)' : colors.borderLight
              }`,
              borderRadius: '12px',
              p: 3,
              mt: 1.5,
              minWidth: 280,
              maxWidth: 320,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2, fontWeight: 600, fontSize: '0.95rem' }}>
              <UpdateIcon sx={{ fontSize: 20, color: colors.accent }} />
              Reschedule Request
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, fontSize: '0.9rem' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 3 }}>
                <Typography sx={{ color: colors.textSecondary, fontSize: 'inherit', flexShrink: 0 }}>
                  Proposed
                </Typography>
                <Typography sx={{ fontWeight: 500, fontSize: 'inherit', color: colors.textPrimary, textAlign: 'right' }}>
                  {formatProposedDateTime(
                    message.metadata.proposed_date,
                    message.metadata.proposed_start_time,
                    message.metadata.proposed_end_time
                  )}
                </Typography>
              </Box>
              {message.metadata.reason && (
                <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary, fontStyle: 'italic' }}>
                  {message.metadata.reason}
                </Typography>
              )}
            </Box>

            {/* Status badge */}
            <Box sx={{ mt: 2 }}>
              {rescheduleStatus === 'accepted' && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    px: 1.5,
                    py: 0.5,
                    bgcolor: `${colors.success}18`,
                    color: colors.success,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Accepted
                </Box>
              )}
              {rescheduleStatus === 'declined' && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    px: 1.5,
                    py: 0.5,
                    bgcolor: 'rgba(239, 68, 68, 0.12)',
                    color: colors.error,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Declined
                </Box>
              )}
              {rescheduleStatus === 'pending' && !isSent && onRespondToReschedule && (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    size="small"
                    onClick={() => handleRescheduleRespond('decline')}
                    disabled={respondingAction !== null}
                    sx={{
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      color: colors.textPrimary,
                      border: `1px solid ${colors.borderLight}`,
                      borderRadius: '6px',
                      px: 2,
                      '&:hover': { borderColor: colors.error, color: colors.error },
                      '&.Mui-disabled': { opacity: 0.7 },
                    }}
                  >
                    {respondingAction === 'decline' ? (
                      <CircularProgress size={16} sx={{ color: colors.textPrimary }} />
                    ) : (
                      'Decline'
                    )}
                  </Button>
                  <Button
                    size="small"
                    onClick={() => handleRescheduleRespond('accept')}
                    disabled={respondingAction !== null}
                    sx={{
                      fontSize: '0.8rem',
                      textTransform: 'none',
                      bgcolor: colors.success,
                      color: 'white',
                      borderRadius: '6px',
                      px: 2,
                      '&:hover': { bgcolor: '#3d8a6d' },
                      '&.Mui-disabled': { bgcolor: colors.success, opacity: 0.7 },
                    }}
                  >
                    {respondingAction === 'accept' ? (
                      <CircularProgress size={16} sx={{ color: 'white' }} />
                    ) : (
                      'Accept'
                    )}
                  </Button>
                </Box>
              )}
              {rescheduleStatus === 'pending' && isSent && (
                <Box
                  sx={{
                    display: 'inline-flex',
                    px: 1.5,
                    py: 0.5,
                    bgcolor: `${colors.accent}18`,
                    color: colors.accent,
                    borderRadius: '6px',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Pending
                </Box>
              )}
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
