import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Avatar,
  Badge,
  CircularProgress,
  Alert,
  Divider
} from '@mui/material';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import { formatDistanceToNow } from 'date-fns';
import { messageService } from '@/services/messageService';
import { colors } from '@/styles/colors';

interface AppointmentWithMessages {
  id: number;
  title: string;
  description: string;
  date: string;
  type: string;
  status: string;
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
  latest_message?: {
    id: number;
    content: string;
    sender: {
      id: number;
      name: string;
    };
    created_at: string;
  };
  unread_count: number;
}

interface MessageThreadsListProps {
  onSelectThread: (appointmentId: number) => void;
  selectedThreadId?: number;
}

const MessageThreadsList: React.FC<MessageThreadsListProps> = ({
  onSelectThread,
  selectedThreadId
}) => {
  const [threads, setThreads] = useState<AppointmentWithMessages[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadThreads();
  }, []);

  const loadThreads = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await messageService.getInbox() as any;
      setThreads(response.appointments || response || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load message threads');
    } finally {
      setLoading(false);
    }
  };

  const truncateMessage = (content: string, maxLength: number = 50) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress sx={{ color: colors.accent }} />
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

  if (threads.length === 0) {
    return (
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <ChatBubbleIcon sx={{ fontSize: 64, color: colors.textMuted, mb: 2 }} />
        <Typography variant="h6" sx={{ color: colors.textSecondary, mb: 1 }}>
          No message threads
        </Typography>
        <Typography variant="body2" sx={{ color: colors.textMuted }}>
          Conversations about appointments will appear here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {threads.map((thread, index) => (
        <Box key={thread.id}>
          <Paper
            sx={{
              p: 2,
              mb: 1,
              bgcolor: selectedThreadId === thread.id ? colors.borderLight : colors.surfaceHover,
              border: selectedThreadId === thread.id ? `1px solid ${colors.accent}` : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              '&:hover': {
                bgcolor: colors.borderLight,
                borderColor: colors.border
              }
            }}
            onClick={() => onSelectThread(thread.id)}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              {/* Avatar */}
              <Badge
                badgeContent={thread.unread_count || 0}
                color="primary"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: colors.accent,
                    color: 'white'
                  }
                }}
              >
                <Avatar sx={{
                  bgcolor: colors.accent,
                  width: 48,
                  height: 48
                }}>
                  {thread.client.name.charAt(0).toUpperCase()}
                </Avatar>
              </Badge>

              {/* Content */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      color: 'white',
                      fontWeight: thread.unread_count > 0 ? 'bold' : 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {thread.client.name}
                  </Typography>
                  {thread.latest_message && (
                    <Typography variant="caption" sx={{ color: colors.textSecondary, ml: 1 }}>
                      {formatDistanceToNow(new Date(thread.latest_message.created_at), { addSuffix: true })}
                    </Typography>
                  )}
                </Box>

                {/* Appointment info */}
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: colors.textSecondary,
                    mb: 0.5,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {thread.type} • {(() => { const [y,m,d] = (thread.date || '').split('-').map(Number); return new Date(y, m-1, d).toLocaleDateString(); })()}
                </Typography>

                {/* Latest message */}
                {thread.latest_message && (
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: thread.unread_count > 0 ? 'white' : colors.textSecondary,
                      fontWeight: thread.unread_count > 0 ? 'medium' : 'normal',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    {thread.latest_message.sender.name}: {truncateMessage(thread.latest_message.content)}
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>
          
          {index < threads.length - 1 && (
            <Divider sx={{ borderColor: colors.border, my: 1 }} />
          )}
        </Box>
      ))}
    </Box>
  );
};

export default MessageThreadsList;