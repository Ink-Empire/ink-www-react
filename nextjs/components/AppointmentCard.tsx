import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, Typography, Chip, Button, Avatar, Box, Collapse, Divider, TextField, CircularProgress } from '@mui/material';
import { format, parseISO } from 'date-fns';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MessageIcon from '@mui/icons-material/Message';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import SendIcon from '@mui/icons-material/Send';
import ReplyIcon from '@mui/icons-material/Reply';
import CloseIcon from '@mui/icons-material/Close';
import { api } from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import { colors } from '@/styles/colors';

interface Message {
  id: number;
  appointment_id: number;
  sender_id: number;
  recipient_id: number;
  content: string;
  message_type: 'initial' | 'reply';
  parent_message_id: number | null;
  read_at: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    id: number;
    username: string;
    name: string;
  };
}

interface Appointment {
  id: number;
  title: string;
  description: string;
  client_id: number;
  artist_id: number;
  studio_id: number | null;
  tattoo_id: number | null;
  date: string;
  status: string;
  type: 'tattoo' | 'consultation';
  all_day: number;
  start_time: string;
  end_time: string;
  created_at: string;
  updated_at: string;
  client?: {
    id: number;
    username: string;
    name: string;
    email: string;
  };
  artist?: {
    id: number;
    username: string;
    name: string;
    email: string;
  };
  messages?: Message[];
  has_unread_messages?: boolean;
}

interface AppointmentCardProps {
  appointment: Appointment;
  onAccept?: (appointmentId: number) => void;
  onDecline?: (appointmentId: number) => void;
  onStatusUpdate?: (appointmentId: number, status: string) => void;
  loading?: boolean;
  showActions?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onAccept,
  onDecline,
  onStatusUpdate,
  loading = false,
  showActions = true
}) => {
  const [messagesExpanded, setMessagesExpanded] = useState(false);
  const [messages, setMessages] = useState<Message[]>(appointment.messages || []);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messageRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const { user } = useAuth();

  const loadMessages = async () => {
    if (messages.length > 0) return; // Already loaded
    
    setLoadingMessages(true);
    try {
      const response = await api.get<{ messages?: Message[] }>(`/messages/appointment/${appointment.id}`);
      setMessages(response.messages || []);
    } catch (error) {
      console.error('Failed to load messages:', error);
    } finally {
      setLoadingMessages(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || sendingMessage) return;

    setSendingMessage(true);

    try {
      // Default to replying to the last message if no specific message is selected
      const defaultParentId = replyingTo?.id || (messages.length > 0 ? messages[messages.length - 1].id : null);
      
      const response = await api.post<{ message?: Message }>('/messages/send', {
        appointment_id: appointment.id,
        content: newMessage.trim(),
        parent_message_id: defaultParentId
      });

      if (response?.message) {
        setMessages(prev => [...prev, response.message]);
        setNewMessage('');
        setReplyingTo(null);
      }
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setSendingMessage(false);
    }
  };

  const handleReplyTo = (message: Message) => {
    setReplyingTo(message);
    setNewMessage('');
  };

  const cancelReply = () => {
    setReplyingTo(null);
    setNewMessage('');
  };

  const markMessageAsRead = async (messageId: number) => {
    try {
      await api.put(`/messages/${messageId}/read`, {});
      
      // Update the local state to mark message as read
      setMessages(prev => 
        prev.map(msg => 
          msg.id === messageId 
            ? { ...msg, read_at: new Date().toISOString() }
            : msg
        )
      );
    } catch (error) {
      console.error('Failed to mark message as read:', error);
    }
  };

  const handleExpandMessages = () => {
    setMessagesExpanded(!messagesExpanded);
    if (!messagesExpanded && messages.length === 0) {
      loadMessages();
    }
  };

  // Intersection Observer to mark messages as read when they come into view
  useEffect(() => {
    if (!messagesExpanded || !user?.id) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const messageId = parseInt(entry.target.getAttribute('data-message-id') || '0');
            const message = messages.find(msg => msg.id === messageId);
            
            // Only mark as read if:
            // 1. Message exists
            // 2. Current user is the recipient (not the sender)
            // 3. Message is not already read
            if (message && message.recipient_id === user.id && !message.read_at) {
              markMessageAsRead(messageId);
            }
          }
        });
      },
      {
        root: null, // Use viewport as root
        rootMargin: '0px',
        threshold: 0.5 // Trigger when 50% of message is visible
      }
    );

    // Observe all message elements
    Object.values(messageRefs.current).forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      observer.disconnect();
    };
  }, [messagesExpanded, messages, user?.id]);

  const getTypeColor = (type: string) => {
    return type === 'consultation' ? colors.info : colors.accent;
  };

  const getTypeIcon = (type: string) => {
    return type === 'consultation' ? '💬' : '⚡️';
  };

  const formatDateTime = (date: string, startTime: string, endTime: string) => {
    try {
      const appointmentDate = parseISO(date);
      const formattedDate = format(appointmentDate, 'EEEE, MMMM d, yyyy');
      const formattedTime = `${startTime.slice(0, 5)} - ${endTime.slice(0, 5)}`;
      return { date: formattedDate, time: formattedTime };
    } catch (error) {
      return { date: date, time: `${startTime} - ${endTime}` };
    }
  };

  const { date: formattedDate, time: formattedTime } = formatDateTime(
    appointment.date, 
    appointment.start_time, 
    appointment.end_time
  );

  // Determine which user to display based on current user's role
  const isCurrentUserArtist = user?.id === appointment.artist_id;
  const isCurrentUserClient = user?.id === appointment.client_id;
  
  // Show the "other" person in the appointment
  const displayUser = isCurrentUserArtist 
    ? appointment.client 
    : appointment.artist;
  
  const displayUserName = displayUser
    ? `${displayUser.name} (${displayUser.username})`
    : isCurrentUserArtist 
      ? `Client #${appointment.client_id}`
      : `Artist #${appointment.artist_id}`;

  const displayUsername = displayUser?.username || 
    (isCurrentUserArtist ? `client${appointment.client_id}` : `artist${appointment.artist_id}`);

  return (
    <Card
      sx={{
        mb: 2,
        bgcolor: colors.surface,
        border: '1px solid #444',
        '&:hover': {
          border: `1px solid ${colors.accent}`,
          transform: 'translateY(-2px)',
          transition: 'all 0.2s ease-in-out'
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        {/* Header with type and status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <span style={{ fontSize: '20px' }}>{getTypeIcon(appointment.type)}</span>
            <Chip
              label={appointment.type.charAt(0).toUpperCase() + appointment.type.slice(1)}
              size="small"
              sx={{
                bgcolor: getTypeColor(appointment.type),
                color: 'white',
                fontWeight: 'bold'
              }}
            />
          </Box>
          <Chip
            label={appointment.status.toUpperCase()}
            size="small"
            sx={{
              bgcolor: colors.warning,
              color: 'white'
            }}
          />
        </Box>

        {/* Client information */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: colors.accent, mr: 2 }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              {displayUserName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#888' }}>
              @{displayUsername}
            </Typography>
          </Box>
        </Box>

        {/* Appointment title */}
        <Typography variant="h6" sx={{ color: colors.accent, mb: 1, fontWeight: 'bold' }}>
          {appointment.title}
        </Typography>

        {/* Date and time */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1, gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <CalendarTodayIcon sx={{ fontSize: 16, color: '#888' }} />
            <Typography variant="body2" sx={{ color: 'white' }}>
              {formattedDate}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <AccessTimeIcon sx={{ fontSize: 16, color: '#888' }} />
            <Typography variant="body2" sx={{ color: 'white' }}>
              {formattedTime}
            </Typography>
          </Box>
        </Box>

        {/* Description */}
        {appointment.description && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 3 }}>
            <MessageIcon sx={{ fontSize: 16, color: '#888', mt: 0.5 }} />
            <Typography variant="body2" sx={{ color: '#ccc', lineHeight: 1.5 }}>
              {appointment.description}
            </Typography>
          </Box>
        )}

        {/* Messages section */}
        <Box sx={{ mt: 2 }}>
          <Button
            onClick={handleExpandMessages}
            startIcon={<MessageIcon />}
            endIcon={messagesExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            sx={{
              color: colors.accent,
              '&:hover': { bgcolor: 'rgba(51, 153, 137, 0.1)' },
              mb: 1
            }}
          >
            Messages {appointment.has_unread_messages && <Chip label="!" size="small" sx={{ ml: 1, bgcolor: colors.error, color: 'white' }} />}
          </Button>

          <Collapse in={messagesExpanded}>
            <Box sx={{ mt: 2, p: 2, bgcolor: '#1a1a1a', borderRadius: 1, border: '1px solid #333' }}>
              {loadingMessages ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                  <CircularProgress size={20} sx={{ color: colors.accent }} />
                </Box>
              ) : (
                <>
                  {/* Messages list */}
                  <Box sx={{ maxHeight: 200, overflowY: 'auto', mb: 2 }}>
                    {messages.map((message) => (
                      <Box 
                        key={message.id}
                        ref={(el: HTMLDivElement | null) => { messageRefs.current[message.id] = el; }}
                        data-message-id={message.id}
                        sx={{ 
                          mb: 2,
                          p: 1,
                          ml: message.parent_message_id ? 2 : 0,
                          borderLeft: message.parent_message_id ? `2px solid ${colors.accent}` : 'none',
                          bgcolor: message.parent_message_id ? '#1e1e1e' : 'transparent',
                          opacity: message.read_at ? 0.8 : 1,
                          border: !message.read_at && message.recipient_id === user?.id ? '1px solid rgba(51, 153, 137, 0.3)' : 'none'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5, justifyContent: 'space-between' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {message.parent_message_id && <ReplyIcon sx={{ fontSize: 12, color: '#666' }} />}
                            <Typography variant="caption" sx={{ color: colors.accent, fontWeight: 'bold' }}>
                              {message.sender?.name ||
                                (message.sender_id === appointment.client_id ?
                                  (appointment.client?.name || displayUsername) :
                                  (appointment.artist?.name || displayUsername)
                                )
                              }
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#888' }}>
                              {format(parseISO(message.created_at), 'MMM d, h:mm a')}
                            </Typography>
                            {!message.read_at && message.recipient_id === user?.id && (
                              <Box
                                sx={{
                                  width: 6,
                                  height: 6,
                                  borderRadius: '50%',
                                  bgcolor: colors.accent,
                                  ml: 1
                                }}
                              />
                            )}
                          </Box>
                          <Button
                            size="small"
                            onClick={() => handleReplyTo(message)}
                            sx={{
                              minWidth: 'auto',
                              p: 0.5,
                              color: '#666',
                              '&:hover': { color: colors.accent }
                            }}
                          >
                            <ReplyIcon sx={{ fontSize: 14 }} />
                          </Button>
                        </Box>
                        <Typography variant="body2" sx={{ color: '#ddd', whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                      </Box>
                    ))}
                  </Box>

                  {/* Reply input */}
                  <Divider sx={{ bgcolor: '#444', mb: 2 }} />
                  
                  {/* Reply context */}
                  {replyingTo && (
                    <Box sx={{ 
                      mb: 2, 
                      p: 1, 
                      bgcolor: '#2a2a2a', 
                      borderRadius: 1, 
                      border: '1px solid #444',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 1
                    }}>
                      <ReplyIcon sx={{ fontSize: 16, color: colors.accent, mt: 0.5 }} />
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="caption" sx={{ color: '#888' }}>
                          Replying to {replyingTo.sender?.name || 
                            (replyingTo.sender_id === appointment.client_id ? 
                              (appointment.client?.name || 'Client') : 
                              (appointment.artist?.name || 'Artist')
                            )}:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#bbb', fontSize: '0.8rem' }}>
                          {replyingTo.content.length > 50 
                            ? `${replyingTo.content.substring(0, 50)}...` 
                            : replyingTo.content}
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={cancelReply}
                        sx={{
                          minWidth: 'auto',
                          p: 0.5,
                          color: '#666',
                          '&:hover': { color: colors.error }
                        }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </Button>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      placeholder={replyingTo ? `Reply to ${replyingTo.sender?.name || 
                        (replyingTo.sender_id === appointment.client_id ? 
                          (appointment.client?.name || 'Client') : 
                          (appointment.artist?.name || 'Artist')
                        )}...` : "Type your message..."}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      variant="outlined"
                      size="small"
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: 'white',
                          '& fieldset': { borderColor: '#444' },
                          '&:hover fieldset': { borderColor: colors.accent },
                          '&.Mui-focused fieldset': { borderColor: colors.accent }
                        }
                      }}
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendingMessage}
                      sx={{
                        minWidth: 'auto',
                        bgcolor: colors.accent,
                        color: 'white',
                        '&:hover': { bgcolor: colors.accentDark },
                        '&:disabled': { bgcolor: '#555', color: '#888' }
                      }}
                    >
                      {sendingMessage ? <CircularProgress size={16} /> : <SendIcon />}
                    </Button>
                  </Box>
                </>
              )}
            </Box>
          </Collapse>
        </Box>

        {/* Action buttons */}
        {showActions && (onAccept || onDecline) && (
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
            {onDecline && (
              <Button
                variant="outlined"
                onClick={() => onDecline(appointment.id)}
                disabled={loading}
                sx={{
                  color: colors.error,
                  borderColor: colors.error,
                  '&:hover': {
                    borderColor: '#d32f2f',
                    bgcolor: 'rgba(244, 67, 54, 0.1)'
                  }
                }}
              >
                Decline
              </Button>
            )}
            {onAccept && (
              <Button
                variant="contained"
                onClick={() => onAccept(appointment.id)}
                disabled={loading}
                sx={{
                  bgcolor: colors.accent,
                  '&:hover': {
                    bgcolor: colors.accentDark
                  }
                }}
              >
                Accept
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;