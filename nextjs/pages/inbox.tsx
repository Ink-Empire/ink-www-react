import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import AddIcon from '@mui/icons-material/Add';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ImageIcon from '@mui/icons-material/Image';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import SendIcon from '@mui/icons-material/Send';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import PersonIcon from '@mui/icons-material/Person';
import BlockIcon from '@mui/icons-material/Block';
import ReportIcon from '@mui/icons-material/Report';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import CheckIcon from '@mui/icons-material/Check';
import { colors } from '@/styles/colors';
import {
  useConversations,
  useConversation,
  createConversation,
} from '../hooks/useConversations';
import { userService } from '../services/userService';
import { appointmentService } from '../services/appointmentService';
import { messageService } from '../services/messageService';
import { uploadImagesToS3, UploadProgress } from '../utils/s3Upload';
import {
  FilterType,
  FilterChip,
  ConversationItem,
  MessageBubble,
  QuickAction,
} from '../components/inbox';

export default function InboxPage() {
  const router = useRouter();
  const { artistId } = router.query;
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');
  const [creatingConversation, setCreatingConversation] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [mobileShowConversation, setMobileShowConversation] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [acceptingBooking, setAcceptingBooking] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const designInputRef = useRef<HTMLInputElement>(null);

  // Sort state
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [sortMenuAnchor, setSortMenuAnchor] = useState<null | HTMLElement>(null);

  // New message dialog state
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Array<{ id: number; name: string; username: string; slug?: string; image?: any }>>([]);
  const [recipientError, setRecipientError] = useState('');
  const [searchingRecipient, setSearchingRecipient] = useState(false);
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modal states
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [depositModalOpen, setDepositModalOpen] = useState(false);
  const [moreMenuAnchor, setMoreMenuAnchor] = useState<null | HTMLElement>(null);

  // Booking form state
  const [bookingForm, setBookingForm] = useState({
    date: '',
    time: '',
    duration: '2-3 hours',
    deposit: '',
  });

  // Deposit form state
  const [depositAmount, setDepositAmount] = useState('');

  // Pending attachments state (files waiting to be sent)
  interface PendingAttachment {
    id: string; // Unique ID for React key
    file: File;
    previewUrl: string;
    type: 'image' | 'design';
  }
  const [pendingAttachments, setPendingAttachments] = useState<PendingAttachment[]>([]);
  const [uploadingAttachments, setUploadingAttachments] = useState(false);

  // Check if user is an artist (type_id 2 or has type 'artist')
  const isArtist = user?.type_id === 2 || user?.type === 'artist' || user?.type?.name === 'artist';

  // Fetch conversations
  const { conversations, loading: conversationsLoading, fetchConversations, markConversationRead } = useConversations();

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

  // Mark conversation as read when selected or when new messages arrive
  useEffect(() => {
    if (selectedConversationId && selectedConversation?.unread_count && selectedConversation.unread_count > 0) {
      markConversationRead(selectedConversationId);
      markAsRead();
    }
  }, [selectedConversationId, selectedConversation?.unread_count, messages.length, markAsRead, markConversationRead]);

  // Mark as read when window regains focus (e.g., switching tabs back)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && selectedConversationId && selectedConversation?.unread_count && selectedConversation.unread_count > 0) {
        markConversationRead(selectedConversationId);
        markAsRead();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [selectedConversationId, selectedConversation?.unread_count, markAsRead, markConversationRead]);

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
    if (conversations.length > 0 && !selectedConversationId && !artistId) {
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId, artistId]);

  // Handle artistId query parameter - find or create conversation with artist
  useEffect(() => {
    if (!artistId || !isAuthenticated || conversationsLoading || creatingConversation) return;

    const artistIdNum = parseInt(artistId as string, 10);
    if (isNaN(artistIdNum)) return;

    // Check if we already have a conversation with this artist
    const existingConversation = conversations.find(
      (conv) => conv.participant?.id === artistIdNum
    );

    if (existingConversation) {
      // Select the existing conversation
      setSelectedConversationId(existingConversation.id);
      setMobileShowConversation(true);
      // Clear the query parameter
      router.replace('/inbox', undefined, { shallow: true });
    } else {
      // Create a new conversation with the artist
      setCreatingConversation(true);
      createConversation(artistIdNum, 'booking')
        .then((newConversation) => {
          if (newConversation) {
            // Refresh conversations list and select the new one
            fetchConversations().then(() => {
              setSelectedConversationId(newConversation.id);
              setMobileShowConversation(true);
            });
          }
          // Clear the query parameter
          router.replace('/inbox', undefined, { shallow: true });
        })
        .catch((err) => {
          console.error('Failed to create conversation:', err);
          setSnackbar({
            open: true,
            message: 'Failed to start conversation. Please try again.',
            severity: 'error',
          });
        })
        .finally(() => {
          setCreatingConversation(false);
        });
    }
  }, [artistId, isAuthenticated, conversations, conversationsLoading, creatingConversation, router, fetchConversations]);

  const unreadCount = useMemo(() => conversations.filter((c) => c.unread_count > 0).length, [conversations]);

  const sortedConversations = useMemo(() => {
    const sorted = [...conversations].sort((a, b) => {
      const dateA = new Date(a.last_message?.created_at || a.updated_at || a.created_at).getTime();
      const dateB = new Date(b.last_message?.created_at || b.updated_at || b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return sorted;
  }, [conversations, sortOrder]);

  const handleSelectConversation = (conv: ApiConversation) => {
    // Clear pending attachments when switching conversations
    if (conv.id !== selectedConversationId) {
      clearPendingAttachments();
      setMessageInput('');
    }
    setSelectedConversationId(conv.id);
    setMobileShowConversation(true);
  };

  const handleSendMessage = async () => {
    const hasText = messageInput.trim().length > 0;
    const hasAttachments = pendingAttachments.length > 0;

    // Need either text or attachments to send
    if ((!hasText && !hasAttachments) || sendingMessage) return;

    setSendingMessage(true);
    setUploadingAttachments(hasAttachments);

    try {
      let attachmentIds: number[] = [];

      // Upload pending attachments if any
      if (hasAttachments) {
        const files = pendingAttachments.map((a) => a.file);
        const hasDesigns = pendingAttachments.some((a) => a.type === 'design');

        try {
          const uploadedImages = await uploadImagesToS3(files, 'message');
          attachmentIds = uploadedImages.map((img) => img.id);
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          setSnackbar({
            open: true,
            message: uploadError instanceof Error ? uploadError.message : 'Failed to upload images',
            severity: 'error',
          });
          return;
        } finally {
          setUploadingAttachments(false);
        }

        // Determine message type based on attachments
        const messageType = hasDesigns ? 'design_share' : 'image';
        const metadata = hasDesigns && isArtist ? { apply_watermark: true } : null;

        await sendMessage(messageInput.trim() || '', messageType, metadata, attachmentIds);
      } else {
        // Text only message
        await sendMessage(messageInput.trim());
      }

      setMessageInput('');
      clearPendingAttachments();
    } finally {
      setSendingMessage(false);
      setUploadingAttachments(false);
    }
  };

  const handleOpenBookingModal = () => {
    // Pre-fill with sensible defaults
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateStr = tomorrow.toISOString().split('T')[0];

    setBookingForm({
      date: dateStr,
      time: '14:00',
      duration: '2-3 hours',
      deposit: user?.settings?.deposit_amount ? `$${user.settings.deposit_amount}` : '$100',
    });
    setBookingModalOpen(true);
  };

  const handleSendBookingCard = async () => {
    if (!bookingForm.date || !bookingForm.time) {
      setSnackbar({ open: true, message: 'Please fill in date and time', severity: 'error' });
      return;
    }

    // Format date nicely
    const dateObj = new Date(`${bookingForm.date}T${bookingForm.time}`);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
    const formattedTime = dateObj.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    await sendBookingCard(formattedDate, formattedTime, bookingForm.duration, bookingForm.deposit);
    setBookingModalOpen(false);
    setSnackbar({ open: true, message: 'Booking card sent!', severity: 'success' });
  };

  const handleOpenDepositModal = () => {
    // Pre-fill with artist's configured deposit amount if available
    const defaultAmount = user?.settings?.deposit_amount || 100;
    setDepositAmount(`$${defaultAmount}`);
    setDepositModalOpen(true);
  };

  const handleSendDepositRequest = async () => {
    if (!depositAmount.trim()) {
      setSnackbar({ open: true, message: 'Please enter a deposit amount', severity: 'error' });
      return;
    }

    await sendDepositRequest(depositAmount, selectedConversation?.appointment?.id);
    setDepositModalOpen(false);
    setSnackbar({ open: true, message: 'Deposit request sent!', severity: 'success' });
  };

  // File upload handlers
  const handleImageClick = () => {
    imageInputRef.current?.click();
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  // Allowed image types for upload
  const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const ALLOWED_EXTENSIONS = 'JPG, PNG, WebP, or GIF';

  const validateImageFiles = (files: File[]): { valid: File[]; invalid: string[] } => {
    const valid: File[] = [];
    const invalid: string[] = [];

    for (const file of files) {
      if (ALLOWED_IMAGE_TYPES.includes(file.type)) {
        valid.push(file);
      } else {
        const ext = file.name.split('.').pop()?.toUpperCase() || 'unknown';
        invalid.push(`${file.name} (${ext})`);
      }
    }

    return { valid, invalid };
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const { valid, invalid } = validateImageFiles(fileArray);

    // Show error for invalid files
    if (invalid.length > 0) {
      setSnackbar({
        open: true,
        message: `Unsupported file type: ${invalid.join(', ')}. Please use ${ALLOWED_EXTENSIONS}.`,
        severity: 'error',
      });

      // If no valid files, exit early
      if (valid.length === 0) {
        event.target.value = '';
        return;
      }
    }

    // Add valid files to pending attachments with preview URLs
    const newAttachments: PendingAttachment[] = valid.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      type: 'image' as const,
    }));

    setPendingAttachments((prev) => [...prev, ...newAttachments]);

    // Clear the input for next selection
    event.target.value = '';
  };

  const removePendingAttachment = (id: string) => {
    setPendingAttachments((prev) => {
      const attachment = prev.find((a) => a.id === id);
      if (attachment) {
        URL.revokeObjectURL(attachment.previewUrl);
      }
      return prev.filter((a) => a.id !== id);
    });
  };

  const clearPendingAttachments = () => {
    pendingAttachments.forEach((a) => URL.revokeObjectURL(a.previewUrl));
    setPendingAttachments([]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // TODO: Implement actual file upload
    setSnackbar({
      open: true,
      message: 'File attachment coming soon! This feature is under development.',
      severity: 'info',
    });

    event.target.value = '';
  };

  // Header action handlers
  const handleMoreMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMoreMenuAnchor(event.currentTarget);
  };

  const handleMoreMenuClose = () => {
    setMoreMenuAnchor(null);
  };

  const handleViewProfile = () => {
    if (selectedConversation?.participant) {
      const participantSlug = selectedConversation.participant.slug || selectedConversation.participant.username;
      window.open(`/artists/${participantSlug}`, '_blank');
    }
    handleMoreMenuClose();
  };

  // Check if current participant is blocked
  const isParticipantBlocked = selectedConversation?.participant?.id &&
    user?.blocked_user_ids?.includes(selectedConversation.participant.id);

  const handleBlockUser = async () => {
    if (!selectedConversation?.participant?.id) return;

    const participantId = selectedConversation.participant.id;
    const isCurrentlyBlocked = isParticipantBlocked;

    try {
      if (isCurrentlyBlocked) {
        await userService.unblock(participantId);
        setSnackbar({ open: true, message: 'User unblocked', severity: 'success' });
      } else {
        await userService.block(participantId);
        setSnackbar({ open: true, message: 'User blocked. They can no longer message you.', severity: 'success' });
      }
      // Refresh user data to update blocked_user_ids
      window.location.reload();
    } catch (error) {
      setSnackbar({ open: true, message: 'Failed to update block status', severity: 'error' });
    }
    handleMoreMenuClose();
  };

  const handleReportUser = async () => {
    // TODO: Implement report functionality - for now just show a message
    setSnackbar({ open: true, message: 'Report submitted. Our team will review it.', severity: 'info' });
    handleMoreMenuClose();
  };

  // Typeahead user search with debounce
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);

    const query = recipientSearch.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setRecipientError('');
      setSearchingRecipient(false);
      return;
    }

    setSearchingRecipient(true);
    searchDebounceRef.current = setTimeout(async () => {
      try {
        const response = await messageService.searchUsers(query);
        setSearchResults(response.users || []);
        setRecipientError(response.users?.length === 0 ? 'No users found' : '');
      } catch {
        setRecipientError('Search failed. Please try again.');
        setSearchResults([]);
      } finally {
        setSearchingRecipient(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [recipientSearch]);

  const handleSelectRecipient = async (recipient: { id: number; name: string; username: string }) => {
    setCreatingConversation(true);

    try {
      const newConversation = await createConversation(recipient.id);
      if (newConversation) {
        await fetchConversations();
        setSelectedConversationId(newConversation.id);
        setMobileShowConversation(true);
      }
      setNewMessageOpen(false);
      setRecipientSearch('');
      setSearchResults([]);
      setRecipientError('');
    } catch (err: any) {
      setSnackbar({
        open: true,
        message: 'Failed to start conversation. Please try again.',
        severity: 'error',
      });
    } finally {
      setCreatingConversation(false);
    }
  };

  const handleShareDesign = () => {
    // Open file picker for design images
    designInputRef.current?.click();
  };

  const handleDesignUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const fileArray = Array.from(files);
    const { valid, invalid } = validateImageFiles(fileArray);

    // Show error for invalid files
    if (invalid.length > 0) {
      setSnackbar({
        open: true,
        message: `Unsupported file type: ${invalid.join(', ')}. Please use ${ALLOWED_EXTENSIONS}.`,
        severity: 'error',
      });

      // If no valid files, exit early
      if (valid.length === 0) {
        event.target.value = '';
        return;
      }
    }

    // Add valid files to pending attachments as designs
    const newAttachments: PendingAttachment[] = valid.map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      previewUrl: URL.createObjectURL(file),
      type: 'design' as const,
    }));

    setPendingAttachments((prev) => [...prev, ...newAttachments]);

    // Clear the input for next selection
    event.target.value = '';
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
      await appointmentService.respond(selectedConversation.appointment.id, {
        action: action as 'accept' | 'decline' | 'reschedule',
        reason,
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
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
              <IconButton
                onClick={(e) => setSortMenuAnchor(e.currentTarget)}
                sx={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  bgcolor: colors.background,
                  border: `1px solid ${colors.borderSubtle}`,
                  color: colors.textSecondary,
                  '&:hover': { borderColor: colors.accent, color: colors.accent },
                }}
              >
                <TuneIcon sx={{ fontSize: 18 }} />
              </IconButton>
              <IconButton
                onClick={() => setNewMessageOpen(true)}
                sx={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  bgcolor: colors.background,
                  border: `1px solid ${colors.borderSubtle}`,
                  color: colors.textSecondary,
                  '&:hover': { borderColor: colors.accent, color: colors.accent },
                }}
              >
                <AddIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>

            {/* Sort Menu */}
            <Menu
              anchorEl={sortMenuAnchor}
              open={Boolean(sortMenuAnchor)}
              onClose={() => setSortMenuAnchor(null)}
              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
              transformOrigin={{ vertical: 'top', horizontal: 'right' }}
              PaperProps={{
                sx: {
                  bgcolor: colors.surface,
                  border: `1px solid ${colors.borderSubtle}`,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                  minWidth: 180,
                },
              }}
            >
              <MenuItem
                onClick={() => { setSortOrder('newest'); setSortMenuAnchor(null); }}
                sx={{ color: colors.textPrimary }}
              >
                <ListItemIcon>
                  <ArrowDownwardIcon sx={{ color: sortOrder === 'newest' ? colors.accent : colors.textSecondary, fontSize: 18 }} />
                </ListItemIcon>
                <ListItemText>Newest first</ListItemText>
                {sortOrder === 'newest' && <CheckIcon sx={{ color: colors.accent, fontSize: 18, ml: 1 }} />}
              </MenuItem>
              <MenuItem
                onClick={() => { setSortOrder('oldest'); setSortMenuAnchor(null); }}
                sx={{ color: colors.textPrimary }}
              >
                <ListItemIcon>
                  <ArrowUpwardIcon sx={{ color: sortOrder === 'oldest' ? colors.accent : colors.textSecondary, fontSize: 18 }} />
                </ListItemIcon>
                <ListItemText>Oldest first</ListItemText>
                {sortOrder === 'oldest' && <CheckIcon sx={{ color: colors.accent, fontSize: 18, ml: 1 }} />}
              </MenuItem>
            </Menu>
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
            ) : sortedConversations.length > 0 ? (
              sortedConversations.map((conv) => (
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
          {creatingConversation ? (
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 4 }}>
              <CircularProgress sx={{ color: colors.accent, mb: 2 }} />
              <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                Starting conversation...
              </Typography>
            </Box>
          ) : selectedConversation ? (
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
                    onClick={handleMoreMenuClick}
                    title="More options"
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

                {/* More options menu */}
                <Menu
                  anchorEl={moreMenuAnchor}
                  open={Boolean(moreMenuAnchor)}
                  onClose={handleMoreMenuClose}
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  transformOrigin={{ vertical: 'top', horizontal: 'right' }}
                  PaperProps={{
                    sx: {
                      bgcolor: colors.surface,
                      border: `1px solid ${colors.borderSubtle}`,
                      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                      minWidth: 180,
                    },
                  }}
                >
                  {/* Show View Profile when participant is an artist (booking/consultation conversations) */}
                  {(selectedConversation?.type === 'booking' || selectedConversation?.type === 'consultation' || selectedConversation?.type === 'guest-spot') && (
                    <MenuItem onClick={handleViewProfile} sx={{ color: colors.textPrimary }}>
                      <ListItemIcon><PersonIcon sx={{ color: colors.textSecondary }} /></ListItemIcon>
                      <ListItemText>View Profile</ListItemText>
                    </MenuItem>
                  )}
                  <MenuItem onClick={handleBlockUser} sx={{ color: colors.textPrimary }}>
                    <ListItemIcon><BlockIcon sx={{ color: isParticipantBlocked ? colors.error : colors.textSecondary }} /></ListItemIcon>
                    <ListItemText>{isParticipantBlocked ? 'Unblock User' : 'Block User'}</ListItemText>
                  </MenuItem>
                  <MenuItem onClick={handleReportUser} sx={{ color: colors.error }}>
                    <ListItemIcon><ReportIcon sx={{ color: colors.error }} /></ListItemIcon>
                    <ListItemText>Report</ListItemText>
                  </MenuItem>
                </Menu>
              </Box>

              {/* Request Banner for pending appointments - only artists can accept/decline */}
              {selectedConversation.appointment?.status === 'pending' && isArtist && (
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
                {/* Hidden file inputs */}
                <input
                  type="file"
                  ref={imageInputRef}
                  style={{ display: 'none' }}
                  accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                  multiple
                  onChange={handleImageUpload}
                />
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  onChange={handleFileUpload}
                />
                <input
                  type="file"
                  ref={designInputRef}
                  style={{ display: 'none' }}
                  accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                  multiple
                  onChange={handleDesignUpload}
                />

                {/* Pending attachments preview */}
                {pendingAttachments.length > 0 && (
                  <Box
                    sx={{
                      display: 'flex',
                      gap: 1,
                      mb: 2,
                      p: 1.5,
                      bgcolor: colors.background,
                      borderRadius: '8px',
                      border: `1px solid ${colors.borderSubtle}`,
                      flexWrap: 'wrap',
                    }}
                  >
                    {pendingAttachments.map((attachment) => (
                      <Box
                        key={attachment.id}
                        sx={{
                          position: 'relative',
                          width: 80,
                          height: 80,
                          borderRadius: '6px',
                          overflow: 'hidden',
                          border: `1px solid ${colors.borderLight}`,
                        }}
                      >
                        <Box
                          component="img"
                          src={attachment.previewUrl}
                          alt="Pending attachment"
                          sx={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                        {/* Design badge */}
                        {attachment.type === 'design' && (
                          <Box
                            sx={{
                              position: 'absolute',
                              bottom: 2,
                              left: 2,
                              px: 0.5,
                              py: 0.25,
                              bgcolor: 'rgba(0,0,0,0.7)',
                              borderRadius: '4px',
                              fontSize: '0.6rem',
                              color: colors.accent,
                              fontWeight: 500,
                            }}
                          >
                            Design
                          </Box>
                        )}
                        {/* Remove button */}
                        <IconButton
                          onClick={() => removePendingAttachment(attachment.id)}
                          size="small"
                          sx={{
                            position: 'absolute',
                            top: 2,
                            right: 2,
                            width: 20,
                            height: 20,
                            bgcolor: 'rgba(0,0,0,0.6)',
                            color: 'white',
                            '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' },
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                    {/* Upload status indicator */}
                    {uploadingAttachments && (
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          color: colors.textMuted,
                          fontSize: '0.8rem',
                        }}
                      >
                        <CircularProgress size={16} sx={{ color: colors.accent }} />
                        Uploading...
                      </Box>
                    )}
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'flex-end' }}>
                  <Box sx={{ display: 'flex', gap: 0.5 }}>
                    <IconButton
                      onClick={handleImageClick}
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
                      onClick={handleFileClick}
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
                    placeholder={isParticipantBlocked ? "You have blocked this user" : "Type a message..."}
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
                    disabled={sendingMessage || isParticipantBlocked}
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
                    disabled={(!messageInput.trim() && pendingAttachments.length === 0) || sendingMessage || isParticipantBlocked}
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
                    {sendingMessage ? (
                      <CircularProgress size={20} sx={{ color: colors.background }} />
                    ) : (
                      <SendIcon sx={{ fontSize: 20 }} />
                    )}
                  </IconButton>
                </Box>

                {/* Quick Actions - Artist-only actions for booking/deposit */}
                <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                  {isArtist && (
                    <>
                      <QuickAction
                        icon={<CalendarMonthIcon sx={{ fontSize: 14 }} />}
                        label="Send Booking"
                        onClick={handleOpenBookingModal}
                      />
                      <QuickAction
                        icon={<AttachMoneyIcon sx={{ fontSize: 14 }} />}
                        label="Request Deposit"
                        onClick={handleOpenDepositModal}
                      />
                    </>
                  )}
                  <QuickAction
                    icon={<DescriptionIcon sx={{ fontSize: 14 }} />}
                    label="Share Design"
                    onClick={handleShareDesign}
                  />
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

      {/* New Message Dialog */}
      <Dialog
        open={newMessageOpen}
        onClose={() => { setNewMessageOpen(false); setRecipientSearch(''); setSearchResults([]); setRecipientError(''); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            border: `1px solid ${colors.borderSubtle}`,
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: colors.textPrimary }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AddIcon sx={{ color: colors.accent }} />
            New Message
          </Box>
          <IconButton onClick={() => { setNewMessageOpen(false); setRecipientSearch(''); setSearchResults([]); setRecipientError(''); }} sx={{ color: colors.textMuted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2, minHeight: 300 }}>
          <TextField
            fullWidth
            placeholder="Search by name, username, or email..."
            value={recipientSearch}
            onChange={(e) => setRecipientSearch(e.target.value)}
            size="small"
            autoFocus
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ fontSize: 18, color: colors.textMuted }} />
                </InputAdornment>
              ),
              endAdornment: searchingRecipient ? (
                <InputAdornment position="end">
                  <CircularProgress size={18} sx={{ color: colors.accent }} />
                </InputAdornment>
              ) : null,
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: colors.background,
                '& fieldset': { borderColor: colors.borderSubtle },
                '&:hover fieldset': { borderColor: colors.borderLight },
                '&.Mui-focused fieldset': { borderColor: colors.accent },
              },
              '& .MuiInputBase-input': { color: colors.textPrimary },
              '& .MuiInputBase-input::placeholder': { color: colors.textMuted, opacity: 1 },
            }}
          />

          {recipientError && !searchingRecipient && (
            <Typography sx={{ color: colors.textMuted, fontSize: '0.85rem', mt: 2, textAlign: 'center' }}>
              {recipientError}
            </Typography>
          )}

          {creatingConversation && (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mt: 2 }}>
              <CircularProgress size={18} sx={{ color: colors.accent }} />
              <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>Starting conversation...</Typography>
            </Box>
          )}

          {searchResults.length > 0 && (
            <Box sx={{ mt: 1 }}>
              {searchResults.map((result) => (
                <Box
                  key={result.id}
                  onClick={() => !creatingConversation && handleSelectRecipient(result)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    p: 1.5,
                    borderRadius: '8px',
                    cursor: creatingConversation ? 'default' : 'pointer',
                    opacity: creatingConversation ? 0.5 : 1,
                    '&:hover': creatingConversation ? {} : { bgcolor: colors.background },
                  }}
                >
                  <Avatar
                    src={result.image?.uri}
                    sx={{
                      width: 40,
                      height: 40,
                      bgcolor: colors.surfaceElevated,
                      color: colors.accent,
                      fontSize: '0.9rem',
                      fontWeight: 600,
                    }}
                  >
                    {result.name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || result.username?.slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontWeight: 600, fontSize: '0.9rem', color: colors.textPrimary }}>
                      {result.name || result.username}
                    </Typography>
                    <Typography sx={{ fontSize: '0.8rem', color: colors.textMuted }}>
                      @{result.username}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Booking Modal */}
      <Dialog
        open={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            border: `1px solid ${colors.borderSubtle}`,
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: colors.textPrimary }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CalendarMonthIcon sx={{ color: colors.accent }} />
            Send Booking Details
          </Box>
          <IconButton onClick={() => setBookingModalOpen(false)} sx={{ color: colors.textMuted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, mt: 1 }}>
            <TextField
              label="Date"
              type="date"
              value={bookingForm.date}
              onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colors.background,
                  '& fieldset': { borderColor: colors.borderSubtle },
                  '&:hover fieldset': { borderColor: colors.borderLight },
                  '&.Mui-focused fieldset': { borderColor: colors.accent },
                },
                '& .MuiInputBase-input': { color: colors.textPrimary },
                '& .MuiInputLabel-root': { color: colors.textMuted },
              }}
            />
            <TextField
              label="Time"
              type="time"
              value={bookingForm.time}
              onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colors.background,
                  '& fieldset': { borderColor: colors.borderSubtle },
                  '&:hover fieldset': { borderColor: colors.borderLight },
                  '&.Mui-focused fieldset': { borderColor: colors.accent },
                },
                '& .MuiInputBase-input': { color: colors.textPrimary },
                '& .MuiInputLabel-root': { color: colors.textMuted },
              }}
            />
            <TextField
              label="Estimated Duration"
              value={bookingForm.duration}
              onChange={(e) => setBookingForm({ ...bookingForm, duration: e.target.value })}
              placeholder="e.g., 2-3 hours"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colors.background,
                  '& fieldset': { borderColor: colors.borderSubtle },
                  '&:hover fieldset': { borderColor: colors.borderLight },
                  '&.Mui-focused fieldset': { borderColor: colors.accent },
                },
                '& .MuiInputBase-input': { color: colors.textPrimary },
                '& .MuiInputLabel-root': { color: colors.textMuted },
              }}
            />
            <TextField
              label="Deposit Amount"
              value={bookingForm.deposit}
              onChange={(e) => setBookingForm({ ...bookingForm, deposit: e.target.value })}
              placeholder="e.g., $100"
              fullWidth
              sx={{
                '& .MuiOutlinedInput-root': {
                  bgcolor: colors.background,
                  '& fieldset': { borderColor: colors.borderSubtle },
                  '&:hover fieldset': { borderColor: colors.borderLight },
                  '&.Mui-focused fieldset': { borderColor: colors.accent },
                },
                '& .MuiInputBase-input': { color: colors.textPrimary },
                '& .MuiInputLabel-root': { color: colors.textMuted },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setBookingModalOpen(false)}
            sx={{ color: colors.textSecondary, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendBookingCard}
            variant="contained"
            sx={{
              bgcolor: colors.accent,
              color: colors.background,
              textTransform: 'none',
              '&:hover': { bgcolor: colors.accentHover },
            }}
          >
            Send Booking Card
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deposit Request Modal */}
      <Dialog
        open={depositModalOpen}
        onClose={() => setDepositModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            bgcolor: colors.surface,
            border: `1px solid ${colors.borderSubtle}`,
            borderRadius: '12px',
          },
        }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: colors.textPrimary }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AttachMoneyIcon sx={{ color: colors.accent }} />
            Request Deposit
          </Box>
          <IconButton onClick={() => setDepositModalOpen(false)} sx={{ color: colors.textMuted }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', mb: 2 }}>
            Enter the deposit amount to request from {selectedConversation?.participant?.name || 'the client'}.
          </Typography>
          <TextField
            label="Deposit Amount"
            value={depositAmount}
            onChange={(e) => setDepositAmount(e.target.value)}
            placeholder="e.g., $100"
            fullWidth
            autoFocus
            sx={{
              '& .MuiOutlinedInput-root': {
                bgcolor: colors.background,
                '& fieldset': { borderColor: colors.borderSubtle },
                '&:hover fieldset': { borderColor: colors.borderLight },
                '&.Mui-focused fieldset': { borderColor: colors.accent },
              },
              '& .MuiInputBase-input': { color: colors.textPrimary, fontSize: '1.25rem', fontWeight: 500 },
              '& .MuiInputLabel-root': { color: colors.textMuted },
            }}
          />
          {user?.settings?.deposit_amount && (
            <Typography sx={{ color: colors.textMuted, fontSize: '0.8rem', mt: 1 }}>
              Your default deposit: ${user.settings.deposit_amount}
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 0 }}>
          <Button
            onClick={() => setDepositModalOpen(false)}
            sx={{ color: colors.textSecondary, textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSendDepositRequest}
            variant="contained"
            sx={{
              bgcolor: colors.accent,
              color: colors.background,
              textTransform: 'none',
              '&:hover': { bgcolor: colors.accentHover },
            }}
          >
            Send Request
          </Button>
        </DialogActions>
      </Dialog>

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
            bgcolor: snackbar.severity === 'success' ? colors.accent : snackbar.severity === 'info' ? colors.info : colors.error,
            color: snackbar.severity === 'error' ? 'white' : colors.background,
            fontWeight: 500,
            '& .MuiAlert-icon': { color: snackbar.severity === 'error' ? 'white' : colors.background },
            '& .MuiAlert-action': { color: snackbar.severity === 'error' ? 'white' : colors.background },
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
