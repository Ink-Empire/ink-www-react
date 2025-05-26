import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import { formatDistanceToNow } from 'date-fns';
import { api } from '../utils/api';

interface Message {
  id: number;
  content: string;
  sender: {
    id: number;
    name: string;
    username: string;
  };
  recipient: {
    id: number;
    name: string;
    username: string;
  };
  parent_message_id?: number;
  read_at?: string;
  created_at: string;
}

interface Appointment {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
  client: {
    id: number;
    name: string;
    username: string;
  };
  artist: {
    id: number;
    name: string;
    username: string;
  };
}

interface MessageThreadProps {
  appointmentId: number;
  currentUserId: number;
  onClose?: () => void;
}

const MessageThread: React.FC<MessageThreadProps> = ({
  appointmentId,
  currentUserId,
  onClose
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMessages();
  }, [appointmentId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get(`/messages/appointment/${appointmentId}`);
      setMessages(response.messages || []);
      setAppointment(response.appointment);
    } catch (err: any) {
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      setSending(true);
      const response = await api.post('/messages/send', {
        appointment_id: appointmentId,
        content: newMessage.trim()
      });

      // Add new message to the list
      setMessages(prev => [...prev, response.message]);
      setNewMessage('');
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: '#339989' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ m: 2 }}>
        {error}
      </Alert>
    );
  }

  const otherUser = appointment?.client?.id === currentUserId 
    ? appointment?.artist 
    : appointment?.client;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #444' }}>
        <Typography variant="h6" sx={{ color: 'white', mb: 1 }}>
          {appointment?.title || 'Appointment Request'}
        </Typography>
        <Typography variant="body2" sx={{ color: '#888' }}>
          {appointment?.type} • {appointment?.date} • with {otherUser?.name}
        </Typography>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
        {messages.length === 0 ? (
          <Typography variant="body2" sx={{ color: '#888', textAlign: 'center', mt: 4 }}>
            No messages yet. Start the conversation!
          </Typography>
        ) : (
          messages.map((message, index) => (
            <Box key={message.id} sx={{ mb: 2 }}>
              {/* Show divider between different days */}
              {index > 0 && 
                new Date(message.created_at).toDateString() !== 
                new Date(messages[index - 1].created_at).toDateString() && (
                <Divider sx={{ my: 2, borderColor: '#444' }}>
                  <Typography variant="caption" sx={{ color: '#888', px: 2 }}>
                    {new Date(message.created_at).toLocaleDateString()}
                  </Typography>
                </Divider>
              )}

              <Box sx={{ 
                display: 'flex', 
                flexDirection: message.sender.id === currentUserId ? 'row-reverse' : 'row',
                alignItems: 'flex-start',
                gap: 1
              }}>
                <Avatar sx={{ 
                  width: 32, 
                  height: 32, 
                  bgcolor: message.sender.id === currentUserId ? '#339989' : '#666',
                  fontSize: 14
                }}>
                  {message.sender.name.charAt(0).toUpperCase()}
                </Avatar>
                
                <Paper sx={{
                  p: 2,
                  maxWidth: '70%',
                  bgcolor: message.sender.id === currentUserId ? '#339989' : '#333',
                  color: 'white',
                  borderRadius: '16px',
                  ...(message.sender.id === currentUserId ? {
                    borderBottomRightRadius: '4px'
                  } : {
                    borderBottomLeftRadius: '4px'
                  })
                }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                    {message.content}
                  </Typography>
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      color: message.sender.id === currentUserId ? 'rgba(255,255,255,0.7)' : '#888',
                      display: 'block',
                      mt: 0.5
                    }}
                  >
                    {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                  </Typography>
                </Paper>
              </Box>
            </Box>
          ))
        )}
      </Box>

      {/* Message Input */}
      <Box sx={{ p: 2, borderTop: '1px solid #444' }}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end' }}>
          <TextField
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={sending}
            variant="outlined"
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                color: 'white',
                backgroundColor: '#333',
                '& fieldset': {
                  borderColor: '#555'
                },
                '&:hover fieldset': {
                  borderColor: '#666'
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#339989'
                }
              },
              '& .MuiInputBase-input::placeholder': {
                color: '#888'
              }
            }}
          />
          <Button
            variant="contained"
            onClick={sendMessage}
            disabled={!newMessage.trim() || sending}
            sx={{
              minWidth: 'auto',
              p: 1.5,
              bgcolor: '#339989',
              '&:hover': {
                bgcolor: '#267b6e'
              },
              '&:disabled': {
                bgcolor: '#555'
              }
            }}
          >
            {sending ? (
              <CircularProgress size={20} sx={{ color: 'white' }} />
            ) : (
              <SendIcon />
            )}
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default MessageThread;