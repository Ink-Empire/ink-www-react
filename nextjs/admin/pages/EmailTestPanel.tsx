import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  Box,
  CircularProgress,
} from '@mui/material';
import { api } from '@/utils/api';

const EMAIL_TYPES = [
  { id: 'welcome', name: 'Welcome Email' },
  { id: 'verify-email', name: 'Verify Email' },
  { id: 'password-reset', name: 'Password Reset' },
  { id: 'booking-request', name: 'Booking Request' },
  { id: 'booking-accepted', name: 'Booking Accepted' },
  { id: 'booking-declined', name: 'Booking Declined' },
  { id: 'books-open', name: 'Books Open' },
  { id: 'tattoo-beacon', name: 'Tattoo Beacon' },
];

export const EmailTestPanel = () => {
  const [emailType, setEmailType] = useState('welcome');
  const [recipient, setRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 8000);
  };

  const handleSendEmail = async () => {
    if (!recipient.trim()) {
      showMessage('error', 'Please enter a recipient email address');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipient)) {
      showMessage('error', 'Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post<{ success: boolean; message: string }>('/admin/email-test/send', {
        type: emailType,
        email: recipient,
      });
      showMessage('success', response.message || 'Test email sent successfully');
    } catch (error: any) {
      showMessage('error', error?.message || 'Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ padding: 2, maxWidth: 600 }}>
      <Typography variant="h4" gutterBottom>
        Email Testing
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Send test emails to verify email templates and delivery.
      </Typography>

      {message && (
        <Alert severity={message.type} sx={{ mb: 2 }}>
          {message.text}
        </Alert>
      )}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Send Test Email
          </Typography>

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Email Type</InputLabel>
            <Select
              value={emailType}
              label="Email Type"
              onChange={(e) => setEmailType(e.target.value)}
            >
              {EMAIL_TYPES.map((type) => (
                <MenuItem key={type.id} value={type.id}>
                  {type.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            fullWidth
            label="Recipient Email"
            placeholder="test@example.com"
            type="email"
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            sx={{ mb: 3 }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={handleSendEmail}
            disabled={loading}
            fullWidth
          >
            {loading ? <CircularProgress size={24} /> : 'Send Test Email'}
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
};

export default EmailTestPanel;
