import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Paper, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Button, Alert } from '@mui/material';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { appointmentService } from '@/services/appointmentService';
import { colors } from '@/styles/colors';
import { formatTimeSlotWithClientTime, getClientTimezone, getTimezoneLabel, areTimezonesEqual } from '../utils/timezone';

interface ArtistSettings {
  id: number;
  artist_id: number;
  books_open: number;
  accepts_walk_ins: number;
  accepts_deposits: number;
  accepts_consultations: number;
  accepts_appointments: number;
  created_at: string;
  updated_at: string;
}

interface BookingModalProps {
  open: boolean;
  onClose: () => void;
  selectedDate: Date | null;
  selectedWorkingHours: any;
  artistId?: number;
  artistTimezone?: string;
  settings?: ArtistSettings;
  bookingType: string | null;
}

export default function BookingModal({
  open,
  onClose,
  selectedDate,
  selectedWorkingHours,
  artistId,
  artistTimezone,
  settings,
  bookingType: initialBookingType
}: BookingModalProps) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<string>('');
  const [availableTimeSlots, setAvailableTimeSlots] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [bookingType, setBookingType] = useState<string>(initialBookingType || '');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const { user, isAuthenticated } = useAuth();
  const { showError, showSuccess } = useDialog();
  const router = useRouter();

  // Timezone handling
  const clientTimezone = useMemo(() => getClientTimezone(), []);
  const showTimezoneConversion = useMemo(
    () => artistTimezone && !areTimezonesEqual(artistTimezone, clientTimezone),
    [artistTimezone, clientTimezone]
  );

  const handleLoginClick = () => {
    onClose();
    router.push('/login');
  };

  const handleRegisterClick = () => {
    onClose();
    router.push('/register');
  };

  useEffect(() => {
    if (selectedWorkingHours && open) {
      // Generate available time slots based on working hours
      const startTime = selectedWorkingHours.start_time.split(':');
      const endTime = selectedWorkingHours.end_time.split(':');
      
      const startHour = parseInt(startTime[0]);
      const endHour = parseInt(endTime[0]);
      
      const slots = [];
      for (let hour = startHour; hour < endHour; hour++) {
        slots.push(`${hour.toString().padStart(2, '0')}:00`);
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
      
      setAvailableTimeSlots(slots);
      setSelectedTimeSlot(slots[0] || '');
    }

    // Set booking type from prop when modal opens
    if (open && initialBookingType) {
      setBookingType(initialBookingType);
    }
  }, [selectedWorkingHours, open, initialBookingType]);

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      showError('Please select a date and time', 'Missing Information');
      return;
    }

    // Check if booking type is required and selected
    const acceptsConsultations = settings?.accepts_consultations === 1;
    const acceptsAppointments = settings?.accepts_appointments === 1;
    
    if (acceptsConsultations && acceptsAppointments && !bookingType) {
      showError('Please select booking type', 'Missing Information');
      return;
    }

    // Check if user is authenticated
    if (!user) {
      showError('You must be logged in to book an appointment', 'Authentication Required');
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine the final booking type
      const finalBookingType = bookingType || (acceptsConsultations ? 'consultation' : 'tattoo');
      
      // Create start and end date objects
      const [timeHour, timeMinute] = selectedTimeSlot.split(':').map(Number);
      const startDate = new Date(selectedDate);
      startDate.setHours(timeHour, timeMinute, 0, 0);
      
      // Default to 1-hour appointment duration
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + 1);

      // Format dates as ISO strings
      const startISO = startDate.toISOString();
      const endISO = endDate.toISOString();

      console.log(user);

      // Prepare appointment data
      const appointmentData = {
        artist_id: artistId,
        title: `${finalBookingType} request from ${user?.username}`,
        start_time: startISO,
        end_time: endISO,
        date: selectedDate,
        all_day: false,
        description: notes || '',
        type: finalBookingType,
        client_id: user?.id,
      };

      // Make API request to create appointment
      await appointmentService.create(appointmentData);

      // Close the modal and reset form
      handleClose();

      // Show success message
      showSuccess(
        `Your ${finalBookingType} request has been sent successfully! The artist will contact you soon.`,
        'Request Sent'
      );

    } catch (error) {
      console.error('Error creating appointment:', error);
      
      // Show error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create appointment request';
      showError(errorMessage, 'Booking Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTimeSlot('');
    setNotes('');
    setBookingType('');
    onClose();
  };

  // Helper functions to determine what artist accepts
  const acceptsConsultations = Boolean(settings?.accepts_consultations);
  const acceptsAppointments = Boolean(settings?.accepts_appointments);
  const acceptsBoth = acceptsConsultations && acceptsAppointments;
  const booksOpen = Boolean(settings?.books_open);

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="booking-modal"
      aria-describedby="modal-for-booking-appointments"
    >
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          maxWidth: '90%',
          bgcolor: colors.surface,
          boxShadow: 24,
          borderRadius: 1,
          p: 4,
          color: 'white'
        }}
      >
        {/* Show login prompt if user is not authenticated */}
        {!isAuthenticated ? (
          <>
            <Typography variant="h5" component="h2" sx={{ mb: 2, color: colors.accent }}>
              Account Required
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 3, color: '#ccc' }}>
              Please log in or create an account to book {acceptsBoth ? 'appointments and consultations' : acceptsConsultations ? 'consultations' : 'appointments'} with this artist.
            </Typography>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '24px' }}>
              <Button
                onClick={handleClose}
                sx={{ 
                  color: '#888',
                  '&:hover': { color: 'white' }
                }}
              >
                Cancel
              </Button>
              <div style={{ display: 'flex', gap: '12px' }}>
                <Button
                  variant="outlined"
                  onClick={handleLoginClick}
                  sx={{
                    borderColor: colors.accent,
                    color: colors.accent,
                    '&:hover': {
                      borderColor: colors.accentDark,
                      color: colors.accentDark,
                      bgcolor: 'rgba(51, 153, 137, 0.1)'
                    }
                  }}
                >
                  Log In
                </Button>
                <Button
                  variant="contained"
                  onClick={handleRegisterClick}
                  sx={{
                    bgcolor: colors.accent,
                    '&:hover': { bgcolor: colors.accentDark }
                  }}
                >
                  Sign Up
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <Typography variant="h5" component="h2" sx={{ mb: 2, color: colors.accent }}>
              {acceptsBoth ? 'Book with Artist' : acceptsConsultations ? 'Book Consultation' : 'Book Appointment'}
            </Typography>

            {/* Show booking status */}
            {!booksOpen && (
              <Alert severity="warning" sx={{ mb: 2, bgcolor: colors.surface, border: `1px solid ${colors.warning}` }}>
                This artist's booking is currently closed.
              </Alert>
            )}

            {/* Show what artist accepts if not both */}
            {!acceptsBoth && booksOpen && (
              <Alert
                severity="info"
                sx={{ mb: 2, bgcolor: colors.surface, border: `1px solid ${colors.accent}`, color: colors.accent }}
              >
                This artist accepts {acceptsConsultations ? 'consultations' : 'appointments'} only.
              </Alert>
            )}
            
            {selectedDate && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                Date: {selectedDate.toLocaleDateString()}
              </Typography>
            )}

            {selectedWorkingHours && (
              <Typography variant="body2" sx={{ mb: 3, color: '#888' }}>
                Artist's hours: {selectedWorkingHours.start_time?.slice(0, 5)} - {selectedWorkingHours.end_time?.slice(0, 5)}
                {artistTimezone && showTimezoneConversion && (
                  <span style={{ marginLeft: 4 }}>({getTimezoneLabel(artistTimezone)})</span>
                )}
              </Typography>
            )}

            {/* Booking type selection - only show if artist accepts both */}
            {acceptsBoth && booksOpen && (
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="booking-type-label" sx={{ color: '#888' }}>Booking Type</InputLabel>
                <Select
                  labelId="booking-type-label"
                  value={bookingType}
                  onChange={(e) => setBookingType(e.target.value)}
                  label="Booking Type"
                  sx={{
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: '#444'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.accent
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.accent
                    }
                  }}
                >
                  <MenuItem value="consultation">Consultation</MenuItem>
                  <MenuItem value="appointment">Appointment</MenuItem>
                </Select>
              </FormControl>
            )}
            
            {/* Time slot selection - only show if books are open */}
            {booksOpen && (
              <FormControl fullWidth sx={{ mb: 1 }}>
                <InputLabel id="time-slot-label" sx={{ color: '#888' }}>Select Time</InputLabel>
                <Select
                  labelId="time-slot-label"
                  value={selectedTimeSlot}
                  onChange={(e) => setSelectedTimeSlot(e.target.value)}
                  label="Select Time"
                  sx={{
                    color: 'white',
                    '.MuiOutlinedInput-notchedOutline': {
                      borderColor: '#444'
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.accent
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: colors.accent
                    }
                  }}
                >
                  {availableTimeSlots.map((slot) => (
                    <MenuItem key={slot} value={slot}>
                      {selectedDate
                        ? formatTimeSlotWithClientTime(slot, selectedDate, artistTimezone, clientTimezone)
                        : slot}
                    </MenuItem>
                  ))}
                </Select>
                <Typography variant="caption" sx={{ color: '#666', mt: 0.5, mb: 2, display: 'block' }}>
                  {showTimezoneConversion
                    ? 'Times shown in artist\'s timezone with your local time in parentheses'
                    : 'The artist may suggest a different time based on their availability'}
                </Typography>
              </FormControl>
            )}
            
            {/* Notes field - only show if books are open */}
            {booksOpen && (
              <TextField
                fullWidth
                multiline
                rows={4}
                label="Notes for the artist"
                variant="outlined"
                placeholder="Describe what you're interested in..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                sx={{
                  mb: 3,
                  color: 'white',
                  '& label': { color: '#888' },
                  '& label.Mui-focused': { color: colors.accent },
                  '& .MuiInputBase-input': { color: 'white' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: '#444' },
                    '&:hover fieldset': { borderColor: '#666' },
                    '&.Mui-focused fieldset': { borderColor: colors.accent }
                  }
                }}
              />
            )}
            
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                onClick={handleClose}
                sx={{ 
                  color: '#888',
                  '&:hover': { color: 'white' }
                }}
              >
                Cancel
              </Button>
              {booksOpen && (
                <Button
                  variant="contained"
                  onClick={handleBookAppointment}
                  disabled={isSubmitting}
                  sx={{
                    bgcolor: colors.accent,
                    '&:hover': { bgcolor: colors.accentDark },
                    '&:disabled': { bgcolor: '#555' }
                  }}
                >
                  {isSubmitting ? 'Sending...' : `Book ${acceptsBoth && bookingType ? bookingType.charAt(0).toUpperCase() + bookingType.slice(1) : acceptsConsultations && !acceptsAppointments ? 'Consultation' : 'Appointment'}`}
                </Button>
              )}
            </div>
          </>
        )}
      </Paper>
    </Modal>
  );
}