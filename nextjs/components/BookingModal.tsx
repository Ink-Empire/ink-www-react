import React, { useState, useEffect, useMemo } from 'react';
import { Modal, Paper, Typography, FormControl, InputLabel, Select, MenuItem, TextField, Button, Alert, CircularProgress } from '@mui/material';
import { useRouter } from 'next/router';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { appointmentService } from '@/services/appointmentService';
import { colors, modalStyles } from '@/styles/colors';
import { formatTimeSlotWithClientTime, getClientTimezone, getTimezoneLabel, areTimezonesEqual } from '../utils/timezone';
import type { AvailableSlotsResponse } from '@/services/appointmentService';

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
  const [loadingSlots, setLoadingSlots] = useState<boolean>(false);
  const [slotsResponse, setSlotsResponse] = useState<AvailableSlotsResponse | null>(null);
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

  // Helper functions to determine what artist accepts
  const acceptsConsultations = Boolean(settings?.accepts_consultations);
  const acceptsAppointments = Boolean(settings?.accepts_appointments);
  const acceptsBoth = acceptsConsultations && acceptsAppointments;
  const booksOpen = Boolean(settings?.books_open);

  // Determine the effective booking type for slot fetching
  const effectiveBookingType = bookingType || (acceptsConsultations && !acceptsAppointments ? 'consultation' : 'appointment');

  // Fetch available slots from API when modal opens or booking type changes
  useEffect(() => {
    if (!open || !artistId || !selectedDate || !booksOpen) return;

    const fetchSlots = async () => {
      setLoadingSlots(true);
      setAvailableTimeSlots([]);
      setSelectedTimeSlot('');
      try {
        const dateStr = selectedDate instanceof Date
          ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
          : String(selectedDate);

        const response = await appointmentService.getAvailableSlots(
          artistId,
          dateStr,
          effectiveBookingType as 'consultation' | 'appointment'
        );
        const data = (response as any)?.data ?? response;
        setSlotsResponse(data);
        const slots = data.slots || [];
        setAvailableTimeSlots(slots);
        setSelectedTimeSlot(slots[0] || '');
      } catch (error) {
        console.error('Error fetching available slots:', error);
        setAvailableTimeSlots([]);
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchSlots();
  }, [open, artistId, selectedDate, effectiveBookingType, booksOpen]);

  // Set booking type from prop when modal opens
  useEffect(() => {
    if (open && initialBookingType) {
      setBookingType(initialBookingType);
    }
  }, [open, initialBookingType]);

  const handleBookAppointment = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      showError('Please select a date and time', 'Missing Information');
      return;
    }

    if (acceptsBoth && !bookingType) {
      showError('Please select booking type', 'Missing Information');
      return;
    }

    if (!user) {
      showError('You must be logged in to book an appointment', 'Authentication Required');
      return;
    }

    setIsSubmitting(true);

    try {
      const finalBookingType = effectiveBookingType === 'consultation' ? 'consultation' : 'tattoo';
      const startTime = selectedTimeSlot;

      // Format date as YYYY-MM-DD string to avoid timezone shifting
      const dateStr = selectedDate instanceof Date
        ? `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`
        : String(selectedDate);

      // Compute end_time: consultation uses consultation_duration, tattoo defaults to 3 hours
      const [h, m] = startTime.split(':').map(Number);
      let endTime: string;
      if (finalBookingType === 'consultation' && slotsResponse?.consultation_duration) {
        const totalMinutes = h * 60 + m + slotsResponse.consultation_duration;
        endTime = `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
      } else {
        const totalMinutes = h * 60 + m + 180;
        endTime = `${String(Math.floor(totalMinutes / 60)).padStart(2, '0')}:${String(totalMinutes % 60).padStart(2, '0')}`;
      }

      const appointmentData: any = {
        artist_id: artistId,
        title: `Tattoo ${finalBookingType === 'consultation' ? 'Consultation' : 'Appointment'}`,
        start_time: startTime,
        end_time: endTime,
        date: dateStr,
        all_day: false,
        description: notes || '',
        type: finalBookingType,
        client_id: user?.id,
      };

      const rawResponse = await appointmentService.create(appointmentData) as any;
      const response = rawResponse?.data ?? rawResponse;
      const conversationId = response?.conversation_id;

      handleClose();

      if (conversationId) {
        router.push(`/inbox?conversation=${conversationId}`);
      } else {
        showSuccess(
          `Your ${effectiveBookingType} request has been sent successfully! The artist will contact you soon.`,
          'Request Sent'
        );
      }

    } catch (error) {
      console.error('Error creating appointment:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create appointment request';
      showError(errorMessage, 'Booking Failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTimeSlot('');
    setAvailableTimeSlots([]);
    setSlotsResponse(null);
    setNotes('');
    setBookingType('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      aria-labelledby="booking-modal"
      aria-describedby="modal-for-booking-appointments"
      slotProps={{ backdrop: { sx: modalStyles.backdrop } }}
    >
      <Paper
        sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 400,
          maxWidth: '90%',
          p: 4,
          ...modalStyles.paper,
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

            {/* Warn if the selected booking type doesn't match what the artist accepts */}
            {!acceptsBoth && booksOpen && (
              (effectiveBookingType === 'consultation' && !acceptsConsultations) ||
              (effectiveBookingType !== 'consultation' && !acceptsAppointments)
            ) && (
              <Alert
                severity="info"
                sx={{ mb: 2, bgcolor: colors.surface, border: `1px solid ${colors.accent}`, color: colors.accent }}
              >
                This artist accepts {acceptsConsultations ? 'consultations' : 'appointments'} only.
              </Alert>
            )}

            {selectedDate && (
              <Typography variant="body1" sx={{ mb: 1 }}>
                Date: {selectedDate instanceof Date ? selectedDate.toLocaleDateString() : selectedDate}
              </Typography>
            )}

            {slotsResponse?.working_hours && (
              <Typography variant="body2" sx={{ mb: 1, color: '#888' }}>
                Artist's hours: {slotsResponse.working_hours.start} - {slotsResponse.working_hours.end}
                {artistTimezone && showTimezoneConversion && (
                  <span style={{ marginLeft: 4 }}>({getTimezoneLabel(artistTimezone)})</span>
                )}
              </Typography>
            )}

            {slotsResponse?.consultation_window && effectiveBookingType === 'consultation' && (
              <Typography variant="body2" sx={{ mb: 2, color: colors.accent, fontSize: '0.8rem' }}>
                Consultation window: {slotsResponse.consultation_window.start} - {slotsResponse.consultation_window.end}
              </Typography>
            )}

            {!slotsResponse?.working_hours && !loadingSlots && selectedWorkingHours && (
              <Typography variant="body2" sx={{ mb: 3, color: '#888' }}>
                Artist's hours: {selectedWorkingHours.start_time?.slice(0, 5)} - {selectedWorkingHours.end_time?.slice(0, 5)}
                {artistTimezone && showTimezoneConversion && (
                  <span style={{ marginLeft: 4 }}>({getTimezoneLabel(artistTimezone)})</span>
                )}
              </Typography>
            )}

            {/* Deposit info */}
            {effectiveBookingType === 'appointment' && slotsResponse?.deposit_amount && !loadingSlots && availableTimeSlots.length > 0 && (
              <Alert
                icon={false}
                sx={{
                  mb: 2,
                  bgcolor: colors.accentDim || 'rgba(51, 153, 137, 0.1)',
                  border: `1px solid ${colors.accent}`,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Deposit Required
                </Typography>
                <Typography variant="h5" sx={{ color: colors.accent, fontWeight: 700 }}>
                  ${slotsResponse.deposit_amount}
                </Typography>
                <Typography variant="caption" sx={{ color: colors.textSecondary }}>
                  Applied toward your final total
                </Typography>
              </Alert>
            )}

            {/* Consultation fee */}
            {effectiveBookingType === 'consultation' && slotsResponse?.consultation_fee && !loadingSlots && availableTimeSlots.length > 0 && (
              <Alert
                icon={false}
                sx={{
                  mb: 2,
                  bgcolor: colors.accentDim || 'rgba(51, 153, 137, 0.1)',
                  border: `1px solid ${colors.accent}`,
                  textAlign: 'center',
                }}
              >
                <Typography variant="body2" sx={{ color: colors.textSecondary, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Consultation Fee
                </Typography>
                <Typography variant="h5" sx={{ color: colors.accent, fontWeight: 700 }}>
                  ${slotsResponse.consultation_fee}
                </Typography>
              </Alert>
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
                {loadingSlots ? (
                  <div style={{ display: 'flex', justifyContent: 'center', padding: '16px 0' }}>
                    <CircularProgress size={24} sx={{ color: colors.accent }} />
                  </div>
                ) : availableTimeSlots.length === 0 ? (
                  <Typography variant="body2" sx={{ color: colors.textSecondary, py: 2, textAlign: 'center' }}>
                    No available times for this date
                  </Typography>
                ) : (
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
                )}
                {!loadingSlots && availableTimeSlots.length > 0 && (
                  <Typography variant="caption" sx={{ color: '#666', mt: 0.5, mb: 2, display: 'block' }}>
                    {showTimezoneConversion
                      ? 'Times shown in artist\'s timezone with your local time in parentheses'
                      : 'The artist may suggest a different time based on their availability'}
                  </Typography>
                )}
              </FormControl>
            )}

            {/* Notes field - only show if books are open and slots available */}
            {booksOpen && !loadingSlots && availableTimeSlots.length > 0 && (
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
              {booksOpen && !loadingSlots && availableTimeSlots.length > 0 && (
                <Button
                  variant="contained"
                  onClick={handleBookAppointment}
                  disabled={isSubmitting || !selectedTimeSlot}
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
