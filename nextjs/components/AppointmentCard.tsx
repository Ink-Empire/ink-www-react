import React from 'react';
import { Card, CardContent, Typography, Chip, Button, Avatar, Box } from '@mui/material';
import { format, parseISO } from 'date-fns';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import MessageIcon from '@mui/icons-material/Message';

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
}

interface AppointmentCardProps {
  appointment: Appointment;
  onAccept: (appointmentId: number) => void;
  onDecline: (appointmentId: number) => void;
  loading?: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onAccept,
  onDecline,
  loading = false
}) => {
  const getTypeColor = (type: string) => {
    return type === 'consultation' ? '#2196f3' : '#339989';
  };

  const getTypeIcon = (type: string) => {
    return type === 'consultation' ? '💬' : '🎨';
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

  const clientName = appointment.client
    ? `${appointment.client?.name} (${appointment.client.username})`
    : `User #${appointment.client_id}`;

  const clientUsername = appointment.client?.username || `user${appointment.client_id}`;

  return (
    <Card 
      sx={{ 
        mb: 2, 
        bgcolor: '#2a1a1e', 
        border: '1px solid #444',
        '&:hover': {
          border: '1px solid #339989',
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
              bgcolor: '#ff9800',
              color: 'white'
            }}
          />
        </Box>

        {/* Client information */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ width: 40, height: 40, bgcolor: '#339989', mr: 2 }}>
            <PersonIcon />
          </Avatar>
          <Box>
            <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
              {clientName}
            </Typography>
            <Typography variant="body2" sx={{ color: '#888' }}>
              @{clientUsername}
            </Typography>
          </Box>
        </Box>

        {/* Appointment title */}
        <Typography variant="h6" sx={{ color: '#339989', mb: 1, fontWeight: 'bold' }}>
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

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            onClick={() => onDecline(appointment.id)}
            disabled={loading}
            sx={{
              color: '#f44336',
              borderColor: '#f44336',
              '&:hover': {
                borderColor: '#d32f2f',
                bgcolor: 'rgba(244, 67, 54, 0.1)'
              }
            }}
          >
            Decline
          </Button>
          <Button
            variant="contained"
            onClick={() => onAccept(appointment.id)}
            disabled={loading}
            sx={{
              bgcolor: '#339989',
              '&:hover': {
                bgcolor: '#267b6e'
              }
            }}
          >
            Accept
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;