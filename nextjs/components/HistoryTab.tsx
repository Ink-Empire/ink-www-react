import React from 'react';
import { Box, Typography, CircularProgress, Alert, Pagination, Stack } from '@mui/material';
import { useHistory } from '../hooks/useInbox';
import { useAuth } from '../contexts/AuthContext';
import AppointmentCard from './AppointmentCard';

interface HistoryTabProps {
  userId: number;
}

const HistoryTab: React.FC<HistoryTabProps> = ({ userId }) => {
  const { appointments, loading, error, pagination, loadPage } = useHistory(userId);

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    loadPage(value);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={2}>
        <Alert severity="error">
          {error}
        </Alert>
      </Box>
    );
  }

  if (!appointments || appointments.length === 0) {
    return (
      <Box p={4} textAlign="center">
        <Typography variant="h6" color="text.secondary">
          No appointment history found
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          Past appointments will appear here once you have completed some bookings.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Stack spacing={2} p={2}>
        {appointments.map((appointment) => (
          <AppointmentCard
            key={appointment.id}
            appointment={appointment}
            showActions={false}
            onStatusUpdate={() => {}}
          />
        ))}
      </Stack>

      {pagination && pagination.last_page > 1 && (
        <Box display="flex" justifyContent="center" p={2}>
          <Stack spacing={2} alignItems="center">
            <Typography variant="body2" color="text.secondary">
              Showing {pagination.from}-{pagination.to} of {pagination.total} appointments
            </Typography>
            <Pagination
              count={pagination.last_page}
              page={pagination.current_page}
              onChange={handlePageChange}
              color="primary"
              size="large"
            />
          </Stack>
        </Box>
      )}
    </Box>
  );
};

export default HistoryTab;