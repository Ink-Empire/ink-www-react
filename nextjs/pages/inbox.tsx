import React, { useState, useRef, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { useAuth } from '../contexts/AuthContext';
import {
  Box,
  Typography,
  Avatar,
  IconButton,
  TextField,
  Button,
  InputAdornment,
  CircularProgress,
  Snackbar,
  Alert,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BrushIcon from '@mui/icons-material/Brush';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ImageIcon from '@mui/icons-material/Image';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import { colors } from '@/styles/colors';
import {
  useConversations,
  useConversation,
  ApiConversation,
  ApiMessage,
  ConversationType,
} from '../hooks/useConversations';
import { api } from '../utils/api';

type FilterType = 'all' | 'unread' | 'bookings' | 'consultations' | 'guest-spots';

// Filter chip component
function FilterChip({
  label,
  count,
  active,
  onClick,
}: {
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1.5,
        py: 0.75,
        borderRadius: '100px',
        fontSize: '0.8rem',
        fontWeight: 500,
        cursor: 'pointer',
        whiteSpace: 'nowrap',
        transition: 'all 0.15s ease',
        bgcolor: active ? colors.accent : 'transparent',
        color: active ? colors.background : colors.textSecondary,
        border: `1px solid ${active ? colors.accent : colors.borderLight}`,
        '&:hover': {
          borderColor: active ? colors.accent : colors.textSecondary,
        },
      }}
    >
      {label}
      {count !== undefined && (
        <Box
          component="span"
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            minWidth: 18,
            height: 18,
            px: 0.5,
            borderRadius: '100px',
            fontSize: '0.7rem',
            bgcolor: 'rgba(0,0,0,0.2)',
          }}
        >
          {count}
        </Box>
      )}
    </Box>
  );
}

// Conversation type badge
function TypeBadge({ type }: { type: ConversationType }) {
  const config = {
    booking: {
      icon: <CalendarMonthIcon sx={{ fontSize: 10 }} />,
      label: 'Booking',
      bgcolor: colors.successDim,
      color: colors.success,
    },
    consultation: {
      icon: <HelpOutlineIcon sx={{ fontSize: 10 }} />,
      label: 'Consultation',
      bgcolor: colors.infoDim,
      color: colors.info,
    },
    'guest-spot': {
      icon: <LocationOnIcon sx={{ fontSize: 10 }} />,
      label: 'Guest Spot',
      bgcolor: colors.warningDim,
      color: colors.warning,
    },
    design: {
      icon: <BrushIcon sx={{ fontSize: 10 }} />,
      label: 'Design',
      bgcolor: colors.accentDim,
      color: colors.accent,
    },
  };

  const { icon, label, bgcolor, color } = config[type] || config.booking;

  return (
    <Box
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.5,
        px: 1,
        py: 0.5,
        borderRadius: '100px',
        fontSize: '0.7rem',
        fontWeight: 500,
        bgcolor,
        color,
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

// Format timestamp for display
function formatTimestamp(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString();
}

// Format time for message display
function formatMessageTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

// Conversation list item
function ConversationItem({
  conversation,
  isActive,
  onClick,
  currentUserId,
}: {
  conversation: ApiConversation;
  isActive: boolean;
  onClick: () => void;
  currentUserId?: number;
}) {
  const isUnread = conversation.unread_count > 0;
  const participant = conversation.participant;

  // Format last message preview
  const lastMessagePreview = useMemo(() => {
    if (!conversation.last_message) return 'No messages yet';
    const isOwnMessage = conversation.last_message.sender_id === currentUserId;
    const prefix = isOwnMessage ? 'You: ' : '';
    return prefix + conversation.last_message.content;
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

// Message bubble component
function MessageBubble({
  message,
  isSent,
  senderInitials,
  senderImage,
}: {
  message: ApiMessage;
  isSent: boolean;
  senderInitials: string;
  senderImage?: string;
}) {
  const hasBookingCard = message.type === 'booking_card' && message.metadata;
  const hasDepositRequest = message.type === 'deposit_request' && message.metadata;

  return (
    <Box
      sx={{
        display: 'flex',
        gap: 1.5,
        mb: 2,
        maxWidth: '70%',
        flexDirection: isSent ? 'row-reverse' : 'row',
        ml: isSent ? 'auto' : 0,
      }}
    >
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
          alignSelf: 'flex-end',
        }}
      >
        {senderInitials}
      </Avatar>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5,
          alignItems: isSent ? 'flex-end' : 'flex-start',
        }}
      >
        <Box
          sx={{
            px: 2,
            py: 1.5,
            bgcolor: isSent ? colors.accent : colors.surface,
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
              borderRadius: '8px',
              p: 2,
              mt: 0.5,
              maxWidth: 280,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, fontWeight: 600, fontSize: '0.85rem' }}>
              <CalendarMonthIcon sx={{ fontSize: 16, color: isSent ? colors.background : colors.success }} />
              Booking Details
            </Box>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, fontSize: '0.85rem' }}>
              {[
                { label: 'Date', value: message.metadata.date },
                { label: 'Time', value: message.metadata.time },
                { label: 'Est. Duration', value: message.metadata.duration },
                { label: 'Deposit', value: message.metadata.deposit },
              ].map(({ label, value }) =>
                value ? (
                  <Box key={label} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ color: isSent ? 'rgba(0,0,0,0.6)' : colors.textMuted, fontSize: 'inherit' }}>
                      {label}
                    </Typography>
                    <Typography sx={{ fontWeight: 500, fontSize: 'inherit' }}>{value}</Typography>
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
              borderRadius: '8px',
              p: 2,
              mt: 0.5,
              maxWidth: 280,
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, fontWeight: 600, fontSize: '0.85rem' }}>
              <AttachMoneyIcon sx={{ fontSize: 16, color: isSent ? colors.background : colors.accent }} />
              Deposit Request
            </Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
              <Typography sx={{ color: isSent ? 'rgba(0,0,0,0.6)' : colors.textMuted, fontSize: 'inherit' }}>
                Amount
              </Typography>
              <Typography sx={{ fontWeight: 500, fontSize: 'inherit' }}>{message.metadata.amount}</Typography>
            </Box>
          </Box>
        )}

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
      </Box>
    </Box>
  );
}

// Quick action button
function QuickAction({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick?: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.5,
        py: 0.75,
        bgcolor: colors.background,
        border: `1px solid ${colors.borderSubtle}`,
        borderRadius: '100px',
        fontSize: '0.8rem',
        color: colors.textSecondary,
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        '&:hover': {
          borderColor: colors.accent,
          color: colors.accent,
        },
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

export default function InboxPage() {
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [mobileShowConversation, setMobileShowConversation] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [acceptingBooking, setAcceptingBooking] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { conversations, loading: conversationsLoading, fetchConversations } = useConversations();

  // Fetch selected conversation details
  const {
    conversation: selectedConversation,
    messages,
    loading: messagesLoading,
    sendMessage,
    sendBookingCard,
    sendDepositRequest,
    markAsRead,
    updateAppointmentStatus,
  } = useConversation(selectedConversationId || undefined);

  const userInitials = user?.name
    ? user.name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.username?.slice(0, 2).toUpperCase() || 'ME';

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark conversation as read when selected
  useEffect(() => {
    if (selectedConversationId && selectedConversation?.unread_count && selectedConversation.unread_count > 0) {
      markAsRead();
    }
  }, [selectedConversationId, selectedConversation?.unread_count, markAsRead]);

  // Refetch conversations when filter changes
  useEffect(() => {
    const filterParams: any = {};
    if (activeFilter === 'unread') filterParams.unread = true;
    if (activeFilter === 'bookings') filterParams.type = 'booking';
    if (activeFilter === 'consultations') filterParams.type = 'consultation';
    if (activeFilter === 'guest-spots') filterParams.type = 'guest-spot';
    if (searchQuery) filterParams.search = searchQuery;

    fetchConversations(filterParams);
  }, [activeFilter, searchQuery, fetchConversations]);

  // Select first conversation by default
  useEffect(() => {
    if (conversations.length > 0 && !selectedConversationId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  const unreadCount = useMemo(() => conversations.filter((c) => c.unread_count > 0).length, [conversations]);

  const handleSelectConversation = (conv: ApiConversation) => {
    setSelectedConversationId(conv.id);
    setMobileShowConversation(true);
  };

  const handleSendMessage = async () => {
    if (!messageInput.trim() || sendingMessage) return;

    setSendingMessage(true);
    try {
      await sendMessage(messageInput.trim());
      setMessageInput('');
    } finally {
      setSendingMessage(false);
    }
  };

  const handleSendBookingCard = async () => {
    // TODO: Open a modal to collect booking details
    await sendBookingCard('Dec 28, 2025', '2:00 PM', '3-4 hours', '$150 NZD');
  };

  const handleSendDepositRequest = async () => {
    // TODO: Open a modal to collect deposit amount
    await sendDepositRequest('$150 NZD');
  };

  const [decliningBooking, setDecliningBooking] = useState(false);

  const handleRespondToBooking = async (action: 'accept' | 'decline', reason?: string) => {
    if (!selectedConversation?.appointment?.id) return;

    const previousStatus = selectedConversation.appointment.status;
    const newStatus = action === 'accept' ? 'booked' : 'cancelled';

    // Optimistically update the UI immediately
    updateAppointmentStatus(newStatus);

    if (action === 'accept') {
      setAcceptingBooking(true);
    } else {
      setDecliningBooking(true);
    }

    try {
      await api.post(`/appointments/${selectedConversation.appointment.id}/respond`, {
        action,
        reason,
      }, {
        requiresAuth: true,
      });

      setSnackbar({
        open: true,
        message: action === 'accept'
          ? 'Booking accepted! The client has been notified and it\'s been added to your calendar.'
          : 'Booking declined. The client has been notified.',
        severity: 'success',
      });

      // Refresh conversations in background to sync full state
      fetchConversations();
    } catch (error: any) {
      console.error(`Failed to ${action} booking:`, error);

      // Revert optimistic update on error
      updateAppointmentStatus(previousStatus);

      setSnackbar({
        open: true,
        message: error?.message || `Failed to ${action} booking. Please try again.`,
        severity: 'error',
      });
    } finally {
      setAcceptingBooking(false);
      setDecliningBooking(false);
    }
  };

  if (authLoading) {
    return (
      <Layout>
        <Head>
          <title>Messages | InkedIn</title>
        </Head>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 'calc(100vh - 64px)' }}>
          <CircularProgress sx={{ color: colors.accent }} />
        </Box>
      </Layout>
    );
  }

  if (!isAuthenticated) {
    return (
      <Layout>
        <Head>
          <title>Messages | InkedIn</title>
        </Head>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: 'calc(100vh - 64px)',
            p: 3,
          }}
        >
          <Box
            sx={{
              width: 80,
              height: 80,
              bgcolor: colors.surface,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mb: 3,
            }}
          >
            <SendIcon sx={{ fontSize: 40, color: colors.textMuted }} />
          </Box>
          <Typography sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.25rem', mb: 1 }}>
            Sign in to view messages
          </Typography>
          <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>
            Please log in to access your inbox.
          </Typography>
        </Box>
      </Layout>
    );
  }

  return (
    <Layout>
      <Head>
        <title>Messages | InkedIn</title>
        <meta name="description" content="Your messages and conversations" />
      </Head>

      <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
        {/* Inbox Sidebar */}
        <Box
          sx={{
            width: { xs: '100%', md: 380 },
            bgcolor: colors.surface,
            borderRight: `1px solid ${colors.borderSubtle}`,
            display: { xs: mobileShowConversation ? 'none' : 'flex', md: 'flex' },
            flexDirection: 'column',
            flexShrink: 0,
          }}
        >
          {/* Header */}
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${colors.borderSubtle}` }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography
                sx={{
                  fontFamily: '"Cormorant Garamond", serif',
                  fontSize: '1.5rem',
                  fontWeight: 600,
                  color: colors.textPrimary,
                }}
              >
                Messages
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <IconButton
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: colors.background,
                    border: `1px solid ${colors.borderSubtle}`,
                    color: colors.textSecondary,
                    '&:hover': { borderColor: colors.accent, color: colors.accent },
                  }}
                >
                  <TuneIcon sx={{ fontSize: 18 }} />
                </IconButton>
                <IconButton
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: colors.background,
                    border: `1px solid ${colors.borderSubtle}`,
                    color: colors.textSecondary,
                    '&:hover': { borderColor: colors.accent, color: colors.accent },
                  }}
                >
                  <AddIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Box>
            </Box>

            <TextField
              fullWidth
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ fontSize: 16, color: colors.textMuted }} />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colors.background,
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  '& fieldset': { borderColor: colors.borderSubtle },
                  '&:hover fieldset': { borderColor: colors.borderLight },
                  '&.Mui-focused fieldset': { borderColor: colors.accent },
                },
                '& .MuiInputBase-input': { color: colors.textPrimary },
                '& .MuiInputBase-input::placeholder': { color: colors.textMuted, opacity: 1 },
              }}
            />
          </Box>

          {/* Filters */}
          <Box
            sx={{
              display: 'flex',
              gap: 0.75,
              px: 2.5,
              py: 1.5,
              borderBottom: `1px solid ${colors.borderSubtle}`,
              overflowX: 'auto',
              '&::-webkit-scrollbar': { display: 'none' },
            }}
          >
            <FilterChip
              label="All"
              count={conversations.length}
              active={activeFilter === 'all'}
              onClick={() => setActiveFilter('all')}
            />
            <FilterChip
              label="Unread"
              count={unreadCount}
              active={activeFilter === 'unread'}
              onClick={() => setActiveFilter('unread')}
            />
            <FilterChip label="Bookings" active={activeFilter === 'bookings'} onClick={() => setActiveFilter('bookings')} />
            <FilterChip
              label="Consultations"
              active={activeFilter === 'consultations'}
              onClick={() => setActiveFilter('consultations')}
            />
            <FilterChip
              label="Guest Spots"
              active={activeFilter === 'guest-spots'}
              onClick={() => setActiveFilter('guest-spots')}
            />
          </Box>

          {/* Conversation List */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {conversationsLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={24} sx={{ color: colors.accent }} />
              </Box>
            ) : conversations.length > 0 ? (
              conversations.map((conv) => (
                <ConversationItem
                  key={conv.id}
                  conversation={conv}
                  isActive={selectedConversationId === conv.id}
                  onClick={() => handleSelectConversation(conv)}
                  currentUserId={user?.id}
                />
              ))
            ) : (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>No conversations found</Typography>
              </Box>
            )}
          </Box>
        </Box>

        {/* Conversation View */}
        <Box
          sx={{
            flex: 1,
            display: { xs: mobileShowConversation ? 'flex' : 'none', md: 'flex' },
            flexDirection: 'column',
            bgcolor: colors.background,
          }}
        >
          {selectedConversation ? (
            <>
              {/* Conversation Header */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  px: 3,
                  py: 2,
                  bgcolor: colors.surface,
                  borderBottom: `1px solid ${colors.borderSubtle}`,
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <IconButton
                    onClick={() => setMobileShowConversation(false)}
                    sx={{ display: { xs: 'flex', md: 'none' }, color: colors.textSecondary }}
                  >
                    <ArrowBackIcon />
                  </IconButton>
                  <Avatar
                    src={selectedConversation.participant?.image?.uri}
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: colors.surfaceElevated,
                      color: colors.accent,
                      fontSize: '1rem',
                      fontWeight: 600,
                    }}
                  >
                    {selectedConversation.participant?.initials || '??'}
                  </Avatar>
                  <Box>
                    <Typography sx={{ fontWeight: 600, fontSize: '1rem', color: colors.textPrimary }}>
                      {selectedConversation.participant?.name ||
                        selectedConversation.participant?.username ||
                        'Unknown User'}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, fontSize: '0.8rem', color: colors.textMuted }}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: selectedConversation.participant?.is_online ? colors.success : colors.textMuted,
                        }}
                      />
                      {selectedConversation.participant?.is_online ? 'Online now' : 'Offline'}
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: colors.background,
                      border: `1px solid ${colors.borderSubtle}`,
                      color: colors.textSecondary,
                      '&:hover': { borderColor: colors.accent, color: colors.accent },
                    }}
                  >
                    <CalendarMonthIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton
                    sx={{
                      width: 36,
                      height: 36,
                      bgcolor: colors.background,
                      border: `1px solid ${colors.borderSubtle}`,
                      color: colors.textSecondary,
                      '&:hover': { borderColor: colors.accent, color: colors.accent },
                    }}
                  >
                    <MoreHorizIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              </Box>

              {/* Request Banner for pending appointments */}
              {selectedConversation.appointment?.status === 'pending' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 2,
                    px: 3,
                    py: 2,
                    bgcolor: colors.successDim,
                    borderBottom: `1px solid rgba(74, 155, 127, 0.2)`,
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        bgcolor: colors.success,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                      }}
                    >
                      <CalendarMonthIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box>
                      <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: colors.textPrimary }}>
                        Booking Request
                      </Typography>
                      <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                        {(() => {
                          // Combine date and time for proper formatting
                          const dateStr = selectedConversation.appointment.date?.split('T')[0] || '';
                          const timeStr = selectedConversation.appointment.start_time || '00:00:00';
                          const tz = selectedConversation.appointment.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

                          // Create datetime string and format it
                          const datetime = new Date(`${dateStr}T${timeStr}`);
                          const formattedDate = datetime.toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            timeZone: tz
                          });
                          const formattedTime = datetime.toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true,
                            timeZone: tz
                          });

                          return `${formattedDate} at ${formattedTime}`;
                        })()}
                        {selectedConversation.appointment.title && ` · ${selectedConversation.appointment.title}`}
                        {selectedConversation.appointment.placement && ` · ${selectedConversation.appointment.placement}`}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      onClick={() => handleRespondToBooking('decline')}
                      disabled={decliningBooking || acceptingBooking}
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        color: colors.textPrimary,
                        border: `1px solid ${colors.borderLight}`,
                        '&:hover': { borderColor: colors.error, color: colors.error },
                        '&.Mui-disabled': { opacity: 0.7 },
                      }}
                    >
                      {decliningBooking ? (
                        <CircularProgress size={20} sx={{ color: colors.textPrimary }} />
                      ) : (
                        'Decline'
                      )}
                    </Button>
                    <Button
                      onClick={() => handleRespondToBooking('accept')}
                      disabled={acceptingBooking || decliningBooking}
                      sx={{
                        px: 2,
                        py: 1,
                        borderRadius: '6px',
                        fontSize: '0.85rem',
                        fontWeight: 500,
                        textTransform: 'none',
                        bgcolor: colors.success,
                        color: 'white',
                        '&:hover': { bgcolor: '#3d8a6d' },
                        '&.Mui-disabled': { bgcolor: colors.success, opacity: 0.7 },
                      }}
                    >
                      {acceptingBooking ? (
                        <CircularProgress size={20} sx={{ color: 'white' }} />
                      ) : (
                        selectedConversation.type === 'consultation' ? 'Accept' : 'Accept & Request Deposit'
                      )}
                    </Button>
                  </Box>
                </Box>
              )}

              {/* Accepted Banner for booked appointments */}
              {selectedConversation.appointment?.status === 'booked' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 3,
                    py: 2,
                    bgcolor: colors.accentDim,
                    borderBottom: `1px solid rgba(51, 153, 137, 0.2)`,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: colors.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <CalendarMonthIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: colors.accent }}>
                      Accepted
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                      {(() => {
                        const dateStr = selectedConversation.appointment.date?.split('T')[0] || '';
                        const timeStr = selectedConversation.appointment.start_time || '00:00:00';
                        const tz = selectedConversation.appointment.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
                        const datetime = new Date(`${dateStr}T${timeStr}`);
                        const formattedDate = datetime.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          timeZone: tz
                        });
                        const formattedTime = datetime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: tz
                        });
                        return `${formattedDate} at ${formattedTime}`;
                      })()}
                      {selectedConversation.appointment.title && ` · ${selectedConversation.appointment.title}`}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Declined Banner for cancelled appointments */}
              {selectedConversation.appointment?.status === 'cancelled' && (
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    px: 3,
                    py: 2,
                    bgcolor: 'rgba(239, 68, 68, 0.1)',
                    borderBottom: `1px solid rgba(239, 68, 68, 0.2)`,
                  }}
                >
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: '50%',
                      bgcolor: colors.error,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                    }}
                  >
                    <CalendarMonthIcon sx={{ fontSize: 18 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: colors.error }}>
                      Declined
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                      {(() => {
                        const dateStr = selectedConversation.appointment.date?.split('T')[0] || '';
                        const timeStr = selectedConversation.appointment.start_time || '00:00:00';
                        const tz = selectedConversation.appointment.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
                        const datetime = new Date(`${dateStr}T${timeStr}`);
                        const formattedDate = datetime.toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          timeZone: tz
                        });
                        const formattedTime = datetime.toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                          hour12: true,
                          timeZone: tz
                        });
                        return `${formattedDate} at ${formattedTime}`;
                      })()}
                      {selectedConversation.appointment.title && ` · ${selectedConversation.appointment.title}`}
                    </Typography>
                  </Box>
                </Box>
              )}

              {/* Messages */}
              <Box sx={{ flex: 1, overflowY: 'auto', p: 3 }}>
                {messagesLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                    <CircularProgress size={24} sx={{ color: colors.accent }} />
                  </Box>
                ) : messages.length > 0 ? (
                  <>
                    {messages.map((msg) => (
                      <MessageBubble
                        key={msg.id}
                        message={msg}
                        isSent={msg.sender_id === user?.id}
                        senderInitials={msg.sender_id === user?.id ? userInitials : msg.sender?.initials || '??'}
                        senderImage={msg.sender_id === user?.id ? user?.image?.uri : msg.sender?.image?.uri}
                      />
                    ))}
                    <div ref={messagesEndRef} />
                  </>
                ) : (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '100%',
                    }}
                  >
                    <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem' }}>
                      No messages yet. Start the conversation!
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Compose Area */}
              <Box sx={{ px: 3, py: 2, bgcolor: colors.surface, borderTop: `1px solid ${colors.borderSubtle}` }}>
                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      sx={{
                        width: 36,
                        height: 36,
                        color: colors.textMuted,
                        '&:hover': { bgcolor: colors.surfaceElevated, color: colors.accent },
                      }}
                    >
                      <ImageIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                    <IconButton
                      sx={{
                        width: 36,
                        height: 36,
                        color: colors.textMuted,
                        '&:hover': { bgcolor: colors.surfaceElevated, color: colors.accent },
                      }}
                    >
                      <AttachFileIcon sx={{ fontSize: 20 }} />
                    </IconButton>
                  </Box>

                  <TextField
                    fullWidth
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    multiline
                    maxRows={4}
                    size="small"
                    disabled={sendingMessage}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: colors.background,
                        borderRadius: '12px',
                        fontSize: '0.9rem',
                        '& fieldset': { borderColor: colors.borderSubtle },
                        '&:hover fieldset': { borderColor: colors.borderLight },
                        '&.Mui-focused fieldset': { borderColor: colors.accent },
                      },
                      '& .MuiInputBase-input': { color: colors.textPrimary },
                      '& .MuiInputBase-input::placeholder': { color: colors.textMuted, opacity: 1 },
                    }}
                  />

                  <IconButton
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim() || sendingMessage}
                    sx={{
                      width: 44,
                      height: 44,
                      bgcolor: colors.accent,
                      color: colors.background,
                      flexShrink: 0,
                      '&:hover': { bgcolor: colors.accentHover },
                      '&.Mui-disabled': { bgcolor: colors.surfaceElevated, color: colors.textMuted },
                    }}
                  >
                    {sendingMessage ? <CircularProgress size={20} sx={{ color: colors.background }} /> : <SendIcon sx={{ fontSize: 20 }} />}
                  </IconButton>
                </Box>

                {/* Quick Actions */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                  <QuickAction
                    icon={<CalendarMonthIcon sx={{ fontSize: 14 }} />}
                    label="Send Booking"
                    onClick={handleSendBookingCard}
                  />
                  <QuickAction
                    icon={<AttachMoneyIcon sx={{ fontSize: 14 }} />}
                    label="Request Deposit"
                    onClick={handleSendDepositRequest}
                  />
                  <QuickAction icon={<DescriptionIcon sx={{ fontSize: 14 }} />} label="Share Design" />
                </Box>
              </Box>
            </>
          ) : (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
              <Box
                sx={{
                  width: 80,
                  height: 80,
                  bgcolor: colors.surface,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 3,
                }}
              >
                <SendIcon sx={{ fontSize: 40, color: colors.textMuted }} />
              </Box>
              <Typography sx={{ fontFamily: '"Cormorant Garamond", serif', fontSize: '1.25rem', mb: 1 }}>
                Select a conversation
              </Typography>
              <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem', textAlign: 'center', maxWidth: 300 }}>
                Choose a conversation from the list to view messages
              </Typography>
            </Box>
          )}
        </Box>
      </Box>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            bgcolor: snackbar.severity === 'success' ? colors.accent : colors.error,
            color: snackbar.severity === 'success' ? colors.background : 'white',
            fontWeight: 500,
            '& .MuiAlert-icon': { color: snackbar.severity === 'success' ? colors.background : 'white' },
            '& .MuiAlert-action': { color: snackbar.severity === 'success' ? colors.background : 'white' },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
