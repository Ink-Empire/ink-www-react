import React, { useState, useEffect, useMemo, useCallback, forwardRef, useImperativeHandle } from 'react';
import Link from 'next/link';
import { Box, Typography, IconButton, Modal, Button, CircularProgress, Switch, TextField, Tooltip } from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventBusyIcon from '@mui/icons-material/EventBusy';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/utils/api';
import { useArtistAppointments, useWorkingHours } from '@/hooks';
import { colors } from '@/styles/colors';
import WorkingHoursModal from './WorkingHoursModal';

interface ArtistProfileCalendarProps {
  artistIdOrSlug: string | number;
  artistId?: number;
  artistName?: string;
  onDateSelected?: (date: Date, workingHours: any, bookingType: 'consultation' | 'appointment') => void;
  showExternalEvents?: boolean;
  isOwnCalendar?: boolean;
}

export interface ArtistProfileCalendarRef {
  refreshEvents: () => void;
}

interface ExternalCalendarEvent {
  id: number;
  title: string;
  starts_at: string;
  ends_at: string;
  all_day: boolean;
  source: string;
}

interface WorkingHour {
  id?: number;
  artist_id: number;
  day_of_week: number;
  day_name?: string;
  start_time: string;
  end_time: string;
  is_day_off: boolean | number;
}

type BookingType = 'consultation' | 'appointment';

const viewConfig = {
  consultation: {
    title: 'Consultation',
    description: 'Set aside time to discuss your tattoo idea, placement, sizing, and get a quote before committing.',
    duration: '15 minutes',
    cost: 'Free',
    modalDescription: (artistName: string) => `You're requesting a consultation with ${artistName} to discuss your tattoo idea.`,
    modalDuration: '15 min',
    modalCost: 'Free'
  },
  appointment: {
    title: 'Appointment',
    description: 'An in-studio tattoo session. A deposit is required to confirm your booking and will be deducted from your final total.',
    duration: '2+ hours',
    cost: '$180/hr',
    modalDescription: (artistName: string) => `You're requesting an in-studio appointment with ${artistName}. A deposit is required to confirm.`,
    modalDuration: '2+ hrs',
    modalCost: 'Deposit req.'
  }
};

const ArtistProfileCalendar = forwardRef<ArtistProfileCalendarRef, ArtistProfileCalendarProps>(({
  artistIdOrSlug,
  artistId: propArtistId,
  artistName = 'Artist',
  onDateSelected,
  showExternalEvents = false,
  isOwnCalendar = false,
}, ref) => {
  const { user, isAuthenticated } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [bookingType, setBookingType] = useState<BookingType>('consultation');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const [artist, setArtist] = useState<any>(null);
  const [workingHours, setWorkingHours] = useState<WorkingHour[]>([]);
  const [workingHoursLoading, setWorkingHoursLoading] = useState(true);
  const [booksOpen, setBooksOpen] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  // Wishlist state for notification signup
  const [onWishlist, setOnWishlist] = useState<boolean>(false);
  const [wishlistLoading, setWishlistLoading] = useState(false);
  const [notifySignupLoading, setNotifySignupLoading] = useState(false);
  const [resolvedArtistId, setResolvedArtistId] = useState<number | null>(propArtistId || null);

  // Books toggle state for own profile
  const [isTogglingBooks, setIsTogglingBooks] = useState(false);

  // Working hours modal state
  const [workingHoursModalOpen, setWorkingHoursModalOpen] = useState(false);

  // Booking settings state for owner view
  const [bookingSettings, setBookingSettings] = useState({
    hourly_rate: '',
    deposit_amount: '',
    consultation_fee: '',
    minimum_session: ''
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Artist day management modal state
  const [artistDayModalOpen, setArtistDayModalOpen] = useState(false);
  const [inviteType, setInviteType] = useState<'consultation' | 'appointment'>('consultation');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestName, setGuestName] = useState('');
  const [inviteNote, setInviteNote] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);

  // External calendar events state
  const [externalEvents, setExternalEvents] = useState<ExternalCalendarEvent[]>([]);
  const [externalEventsLoading, setExternalEventsLoading] = useState(false);

  // Fetch external calendar events
  const fetchExternalEvents = useCallback(async () => {
    if (!showExternalEvents || !isOwnCalendar) return;

    setExternalEventsLoading(true);
    try {
      // Fetch events for 3 months range
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, 0);
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];

      const response = await api.get<{ events: ExternalCalendarEvent[] }>(
        `/calendar/events?start=${encodeURIComponent(start)}&end=${encodeURIComponent(end)}`,
        { requiresAuth: true }
      );

      setExternalEvents(response.events || []);
    } catch (error) {
      console.error('Failed to fetch external events:', error);
      setExternalEvents([]);
    } finally {
      setExternalEventsLoading(false);
    }
  }, [showExternalEvents, isOwnCalendar, currentDate]);

  // Expose refresh method to parent
  useImperativeHandle(ref, () => ({
    refreshEvents: () => {
      fetchExternalEvents();
    },
  }), [fetchExternalEvents]);

  // Fetch external events when calendar loads or month changes
  useEffect(() => {
    fetchExternalEvents();
  }, [fetchExternalEvents]);

  // Fetch appointments
  const {
    appointments: fetchedAppointments,
    loading: appointmentsLoading
  } = useArtistAppointments(artistIdOrSlug);

  // Working hours hook for saving (only used when viewing own profile)
  const { saveWorkingHours } = useWorkingHours(resolvedArtistId);

  // Get closed days from working hours
  const closedDays = useMemo(() => {
    if (!workingHours.length) return [];
    return workingHours
      .filter(wh => wh.is_day_off === true || wh.is_day_off === 1)
      .map(wh => wh.day_of_week);
  }, [workingHours]);

  // Fetch artist data
  useEffect(() => {
    const fetchArtistData = async () => {
      if (!artistIdOrSlug) return;

      setLoading(true);

      try {
        const id = typeof artistIdOrSlug === 'number'
          ? artistIdOrSlug
          : parseInt(artistIdOrSlug.toString()) || 0;

        const slug = typeof artistIdOrSlug === 'string'
          ? artistIdOrSlug
          : artistIdOrSlug.toString();

        setArtist({ id, slug });
      } catch (error) {
        console.error('Error processing artist data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchArtistData();
  }, [artistIdOrSlug]);

  // Fetch working hours
  useEffect(() => {
    const fetchArtistAndWorkingHours = async () => {
      if (!artist) return;

      setWorkingHoursLoading(true);

      try {
        const artistData = await api.get<{ data: any }>(`/artists/${artist.slug}`, {
          requiresAuth: false
        });

        const artistInfo = artistData?.data || artistData;
        const artistRecord = artistInfo?.artist || artistInfo;

        // Capture the artist ID for wishlist operations
        if (artistRecord?.id && !resolvedArtistId) {
          setResolvedArtistId(artistRecord.id);
        }

        // Check artist_settings (the correct field name from API)
        const settings = artistRecord?.settings || artistRecord?.settings;
        const hasSettingsData = settings && Object.keys(settings).length > 0;
        const booksAreOpen = hasSettingsData && (
          settings?.books_open === true ||
          settings?.books_open === 1
        );

        setBooksOpen(booksAreOpen);

        // Populate booking settings from artist data (don't show 0 as value)
        if (settings) {
          setBookingSettings({
            hourly_rate: settings.hourly_rate && settings.hourly_rate > 0 ? settings.hourly_rate.toString() : '',
            deposit_amount: settings.deposit_amount && settings.deposit_amount > 0 ? settings.deposit_amount.toString() : '',
            consultation_fee: settings.consultation_fee && settings.consultation_fee > 0 ? settings.consultation_fee.toString() : '',
            minimum_session: settings.minimum_session && settings.minimum_session > 0 ? settings.minimum_session.toString() : ''
          });
        }

        if (booksAreOpen) {
          const data = await api.get<{ data: WorkingHour[] }>(
            `/artists/${artist.slug}/working-hours`,
            { requiresAuth: false }
          );

          if (data && typeof data === 'object' && 'data' in data) {
            setWorkingHours(data.data);
          } else {
            setWorkingHours([]);
          }
        } else {
          setWorkingHours([]);
        }
      } catch (error) {
        console.error('Error fetching artist data or working hours:', error);
        setWorkingHours([]);
        setBooksOpen(false);
      } finally {
        setWorkingHoursLoading(false);
      }
    };

    fetchArtistAndWorkingHours();
  }, [artist?.id]);

  // Check if artist is on user's wishlist (only when books are closed)
  useEffect(() => {
    const checkWishlistStatus = async () => {
      if (!isAuthenticated || !resolvedArtistId || booksOpen !== false) return;

      setWishlistLoading(true);
      try {
        const response = await api.get<{ wishlist: Array<{ id: number }> }>('/client/wishlist', {
          requiresAuth: true,
          useCache: false
        });

        const isOnWishlist = response.wishlist?.some(artist => artist.id === resolvedArtistId) || false;
        setOnWishlist(isOnWishlist);
      } catch (error) {
        console.error('Error checking wishlist status:', error);
      } finally {
        setWishlistLoading(false);
      }
    };

    checkWishlistStatus();
  }, [isAuthenticated, resolvedArtistId, booksOpen]);

  // Handle notification signup (add to wishlist)
  const handleNotifySignup = async () => {
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    if (!resolvedArtistId) {
      console.error('No artist ID available for wishlist');
      return;
    }

    setNotifySignupLoading(true);
    try {
      await api.post('/client/wishlist', {
        artist_id: resolvedArtistId,
        notify_booking_open: true
      }, { requiresAuth: true });

      setOnWishlist(true);
    } catch (error: any) {
      // If already on wishlist (409), just mark as on wishlist
      if (error?.message?.includes('409') || error?.message?.includes('already')) {
        setOnWishlist(true);
      } else {
        console.error('Error adding to wishlist:', error);
      }
    } finally {
      setNotifySignupLoading(false);
    }
  };

  // Handle toggling books open/closed (for own profile)
  const handleToggleBooks = async () => {
    if (!resolvedArtistId) return;

    const newValue = !booksOpen;
    const previousValue = booksOpen;

    // Optimistic update
    setBooksOpen(newValue);
    setIsTogglingBooks(true);

    try {
      await api.put(`/artists/${resolvedArtistId}/settings`, { books_open: newValue }, { requiresAuth: true });
    } catch (err) {
      console.error('Failed to update books status:', err);
      // Revert on error
      setBooksOpen(previousValue);
    } finally {
      setIsTogglingBooks(false);
    }
  };

  // Handle saving working hours from modal
  const handleSaveWorkingHours = async (hours: any[]) => {
    try {
      await saveWorkingHours(hours);
      // Update local state with new hours
      setWorkingHours(hours);
      setWorkingHoursModalOpen(false);
    } catch (err) {
      console.error('Failed to save working hours:', err);
    }
  };

  // Handle booking settings change
  const handleSettingChange = (key: keyof typeof bookingSettings, value: string) => {
    setBookingSettings(prev => ({ ...prev, [key]: value }));
  };

  // Save booking settings
  const handleSaveBookingSettings = async () => {
    if (!resolvedArtistId) return;
    setSavingSettings(true);
    try {
      await api.put(`/artists/${resolvedArtistId}/settings`, {
        hourly_rate: bookingSettings.hourly_rate ? parseFloat(bookingSettings.hourly_rate) : 0,
        deposit_amount: bookingSettings.deposit_amount ? parseFloat(bookingSettings.deposit_amount) : 0,
        consultation_fee: bookingSettings.consultation_fee ? parseFloat(bookingSettings.consultation_fee) : 0,
        minimum_session: bookingSettings.minimum_session ? parseFloat(bookingSettings.minimum_session) : 0
      }, { requiresAuth: true });
    } catch (err) {
      console.error('Failed to save booking settings:', err);
    } finally {
      setSavingSettings(false);
    }
  };

  // Generate availability data
  const availabilityData = useMemo(() => {
    if (workingHoursLoading || booksOpen === false || !workingHours.length) {
      return {};
    }

    const data: Record<string, { consultation: boolean; appointment: boolean }> = {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(today.getFullYear(), today.getMonth() + 3, 0);
    const currentDateIter = new Date(today);

    while (currentDateIter <= endDate) {
      const dayOfWeek = currentDateIter.getDay();
      const dayWorkingHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);

      if (dayWorkingHours) {
        const isDayOff = dayWorkingHours.is_day_off === true || dayWorkingHours.is_day_off === 1;

        if (!isDayOff) {
          const dateStr = currentDateIter.toISOString().split('T')[0];

          // Check if day is booked
          const isFullyBooked = fetchedAppointments.some(appointment => {
            let appointmentDate = '';
            try {
              if (appointment.start && typeof appointment.start === 'object' && 'toISOString' in appointment.start) {
                appointmentDate = (appointment.start as Date).toISOString().split('T')[0];
              } else if (typeof appointment.start === 'string') {
                appointmentDate = new Date(appointment.start).toISOString().split('T')[0];
              }
            } catch (e) {
              appointmentDate = '';
            }
            return appointmentDate === dateStr &&
                  (appointment.status === 'booked' || appointment.status === 'unavailable');
          });

          if (!isFullyBooked) {
            // Consultations available on all working days
            // Appointments available on select days (for demo, all working days)
            data[dateStr] = {
              consultation: true,
              appointment: true
            };
          }
        }
      }

      currentDateIter.setDate(currentDateIter.getDate() + 1);
    }

    return data;
  }, [workingHours, workingHoursLoading, booksOpen, fetchedAppointments]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

  // Count available days and find next available
  const { availableCount, nextAvailable } = useMemo(() => {
    let count = 0;
    let next: string | null = null;

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const isClosed = closedDays.includes(dayOfWeek);

      if (!isClosed && availabilityData[dateStr]?.[bookingType]) {
        count++;
        if (!next) {
          const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
          next = `${dayName} ${day}`;
        }
      }
    }

    return { availableCount: count, nextAvailable: next || 'None' };
  }, [year, month, daysInMonth, closedDays, availabilityData, bookingType]);

  const changeMonth = (delta: number) => {
    setCurrentDate(new Date(year, month + delta, 1));
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDay(dateStr);

    // Check if viewing own profile - show artist management modal
    if (isAuthenticated && user?.id === resolvedArtistId) {
      setArtistDayModalOpen(true);
      return;
    }

    // Check if user is authenticated (for client booking)
    if (!isAuthenticated) {
      setLoginModalOpen(true);
      return;
    }

    const date = new Date(dateStr + 'T12:00:00');
    const dayOfWeek = date.getDay();
    const dayWorkingHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);

    setModalOpen(true);

    if (onDateSelected && dayWorkingHours) {
      onDateSelected(date, dayWorkingHours, bookingType);
    }
  };

  const closeLoginModal = () => {
    setLoginModalOpen(false);
    setSelectedDay(null);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedDay(null);
  };

  const closeArtistDayModal = () => {
    setArtistDayModalOpen(false);
    setSelectedDay(null);
    setGuestEmail('');
    setGuestName('');
    setInviteNote('');
    setInviteType('consultation');
  };

  // Get appointments for a specific date
  const getAppointmentsForDate = (dateStr: string) => {
    return fetchedAppointments.filter(apt => {
      const aptDate = new Date(apt.start).toISOString().split('T')[0];
      return aptDate === dateStr;
    });
  };

  // Get external events for a specific date
  const getExternalEventsForDate = useCallback((dateStr: string) => {
    return externalEvents.filter(event => {
      const eventStart = new Date(event.starts_at).toISOString().split('T')[0];
      const eventEnd = new Date(event.ends_at).toISOString().split('T')[0];
      // Event spans this date if it starts on this day, ends on this day, or spans across it
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  }, [externalEvents]);

  // Check if a date has external events (for busy indicator)
  const hasExternalEventsOnDate = useCallback((dateStr: string) => {
    return getExternalEventsForDate(dateStr).length > 0;
  }, [getExternalEventsForDate]);

  // Handle sending invite
  const handleSendInvite = async () => {
    if (!selectedDay || !guestEmail || !resolvedArtistId) return;

    setSendingInvite(true);
    try {
      await api.post('/appointments/invite', {
        artist_id: resolvedArtistId,
        date: selectedDay,
        type: inviteType,
        guest_email: guestEmail,
        guest_name: guestName,
        note: inviteNote
      }, { requiresAuth: true });

      closeArtistDayModal();
    } catch (err) {
      console.error('Failed to send invite:', err);
    } finally {
      setSendingInvite(false);
    }
  };

  const formatDateForDisplay = (dateStr: string) => {
    const date = new Date(dateStr + 'T12:00:00');
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric'
    });
  };

  const confirmBooking = () => {
    if (selectedDay) {
      const date = new Date(selectedDay + 'T12:00:00');
      const dayOfWeek = date.getDay();
      const dayWorkingHours = workingHours.find(wh => wh.day_of_week === dayOfWeek);

      if (onDateSelected && dayWorkingHours) {
        onDateSelected(date, dayWorkingHours, bookingType);
      }
    }
    closeModal();
  };

  // Check if viewing own profile
  const isOwnProfile = isAuthenticated && user?.id === resolvedArtistId;

  // Render books closed warning with notification signup
  if (!workingHoursLoading && booksOpen === false) {
    return (
      <Box sx={{
        bgcolor: colors.surface,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        p: 4,
        textAlign: 'center',
        maxWidth: 480,
        mx: 'auto'
      }}>
        {/* Status Badge */}
        <Box sx={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 0.75,
          bgcolor: `${colors.warning}22`,
          color: colors.warning,
          px: 2,
          py: 0.75,
          borderRadius: '100px',
          fontSize: '0.8rem',
          fontWeight: 600,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
          mb: 2
        }}>
          <Box sx={{ width: 8, height: 8, bgcolor: colors.warning, borderRadius: '50%' }} />
          Books Closed
        </Box>

        <Typography sx={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontSize: '1.75rem',
          fontWeight: 500,
          color: colors.textPrimary,
          mb: 1
        }}>
          {isOwnProfile ? "Your books are closed" : `${artistName} isn't booking right now`}
        </Typography>

        <Typography sx={{ color: colors.textSecondary, fontSize: '0.95rem', mb: 3, lineHeight: 1.6 }}>
          {isOwnProfile
            ? "You're not currently accepting new appointments. Open your books in the dashboard to start receiving booking requests."
            : "This artist is not accepting new appointments at the moment. Sign up to be notified when their books open back up."}
        </Typography>

        {/* Own profile - show toggle to open books */}
        {isOwnProfile ? (
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
            mt: 1
          }}>
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              p: 2,
              bgcolor: colors.background,
              borderRadius: '10px',
              border: `1px solid ${colors.border}`
            }}>
              <Typography sx={{
                fontSize: '0.9rem',
                fontWeight: 500,
                color: booksOpen ? colors.success : colors.textSecondary,
              }}>
                {booksOpen ? 'Open' : 'Closed'}
              </Typography>
              <Switch
                checked={booksOpen || false}
                onChange={handleToggleBooks}
                disabled={isTogglingBooks}
                sx={{
                  '& .MuiSwitch-switchBase.Mui-checked': {
                    color: colors.success,
                  },
                  '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                    backgroundColor: colors.success,
                  },
                }}
              />
            </Box>
            <Typography sx={{ color: colors.textSecondary, fontSize: '0.85rem' }}>
              Toggle to open your books and start accepting appointments
            </Typography>
          </Box>
        ) : wishlistLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress size={24} sx={{ color: colors.accent }} />
          </Box>
        ) : onWishlist ? (
          // Already signed up
          <Box sx={{
            bgcolor: `${colors.success}15`,
            border: `1px solid ${colors.success}4D`,
            borderRadius: '10px',
            p: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}>
            <CheckCircleIcon sx={{ color: colors.success, fontSize: '1.25rem' }} />
            <Typography sx={{ color: colors.success, fontWeight: 500 }}>
              You'll be notified when books open
            </Typography>
          </Box>
        ) : isAuthenticated ? (
          // Authenticated - show signup button
          <Button
            onClick={handleNotifySignup}
            disabled={notifySignupLoading}
            startIcon={notifySignupLoading ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <NotificationsActiveIcon />}
            sx={{
              bgcolor: colors.accent,
              color: colors.background,
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.95rem',
              px: 4,
              py: 1.5,
              borderRadius: '8px',
              '&:hover': { bgcolor: colors.accentHover },
              '&:disabled': { bgcolor: `${colors.accent}80` }
            }}
          >
            {notifySignupLoading ? 'Signing up...' : 'Notify Me When Books Open'}
          </Button>
        ) : (
          // Not authenticated - show login prompt
          <Box>
            <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem', mb: 2 }}>
              Create an account to get notified when this artist opens their books.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'center' }}>
              <Button
                component={Link}
                href="/login"
                sx={{
                  color: colors.textPrimary,
                  border: `1px solid ${colors.border}`,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  borderRadius: '8px',
                  '&:hover': { borderColor: colors.accent, color: colors.accent }
                }}
              >
                Log In
              </Button>
              <Button
                component={Link}
                href="/register"
                sx={{
                  bgcolor: colors.accent,
                  color: colors.background,
                  textTransform: 'none',
                  fontWeight: 500,
                  px: 3,
                  py: 1,
                  borderRadius: '8px',
                  '&:hover': { bgcolor: colors.accentHover }
                }}
              >
                Sign Up
              </Button>
            </Box>
          </Box>
        )}
      </Box>
    );
  }

  const config = viewConfig[bookingType];

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 320px' }, gap: 3 }}>
      {/* Calendar Container */}
      <Box sx={{
        bgcolor: colors.surface,
        borderRadius: '12px',
        p: 3,
        border: `1px solid ${colors.border}`
      }}>
        {/* Calendar Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '1.75rem',
              fontWeight: 500,
              color: colors.textPrimary
            }}>
              {monthNames[month]} {year}
            </Typography>
            <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              <Box component="span" sx={{ color: colors.accent, fontWeight: 600 }}>{availableCount}</Box> days available · Next: <Box component="span" sx={{ color: colors.accent, fontWeight: 600 }}>{nextAvailable}</Box>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            <IconButton
              onClick={() => changeMonth(-1)}
              sx={{
                bgcolor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textPrimary,
                '&:hover': { bgcolor: colors.background, borderColor: colors.accent, color: colors.accent }
              }}
            >
              <ChevronLeftIcon />
            </IconButton>
            <IconButton
              onClick={() => changeMonth(1)}
              sx={{
                bgcolor: colors.surface,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textPrimary,
                '&:hover': { bgcolor: colors.background, borderColor: colors.accent, color: colors.accent }
              }}
            >
              <ChevronRightIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Weekday Headers */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px', mb: 0.5 }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
            <Box key={day} sx={{
              textAlign: 'center',
              py: 1,
              fontSize: '0.75rem',
              fontWeight: 600,
              color: closedDays.includes(index) ? colors.textSecondary : colors.textSecondary,
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              {day}
              {closedDays.includes(index) && (
                <Box sx={{ fontSize: '0.6rem', fontWeight: 400, mt: '2px' }}>(Closed)</Box>
              )}
            </Box>
          ))}
        </Box>

        {/* Calendar Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '4px' }}>
          {/* Previous month trailing days */}
          {Array.from({ length: firstDay }, (_, i) => (
            <Box key={`prev-${i}`} sx={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: colors.background,
              borderRadius: '8px',
              color: colors.textSecondary,
              opacity: 0.3,
              fontSize: '0.95rem'
            }}>
              {daysInPrevMonth - firstDay + i + 1}
            </Box>
          ))}

          {/* Current month days */}
          {Array.from({ length: daysInMonth }, (_, i) => {
            const day = i + 1;
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const date = new Date(year, month, day);
            const dayOfWeek = date.getDay();
            const isToday = dateStr === todayStr;
            const isClosed = closedDays.includes(dayOfWeek);
            const isAvailable = !isClosed && availabilityData[dateStr]?.[bookingType];
            const hasExternalEvents = showExternalEvents && hasExternalEventsOnDate(dateStr);
            const externalEventsOnDay = showExternalEvents ? getExternalEventsForDate(dateStr) : [];

            // Allow artist to click any day on their own calendar
            const canClick = isOwnProfile || isAvailable;

            const tooltipContent = isOwnCalendar && externalEventsOnDay.length > 0 ? (
              <Box sx={{ p: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 600, mb: 0.5 }}>
                  Google Calendar:
                </Typography>
                {externalEventsOnDay.slice(0, 3).map((event, idx) => (
                  <Typography key={idx} sx={{ fontSize: '0.7rem', color: 'inherit' }}>
                    • {event.title || 'Busy'}
                    {event.all_day ? ' (all day)' : ''}
                  </Typography>
                ))}
                {externalEventsOnDay.length > 3 && (
                  <Typography sx={{ fontSize: '0.7rem', fontStyle: 'italic' }}>
                    +{externalEventsOnDay.length - 3} more
                  </Typography>
                )}
              </Box>
            ) : hasExternalEvents ? 'Busy' : '';

            const dayContent = (
              <Box
                key={day}
                onClick={canClick ? () => handleDayClick(dateStr) : undefined}
                sx={{
                  aspectRatio: '1',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px',
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  position: 'relative',
                  cursor: canClick ? 'pointer' : 'default',
                  border: '2px solid transparent',
                  transition: 'all 0.25s ease',
                  ...(isClosed ? {
                    background: `repeating-linear-gradient(45deg, ${colors.background}, ${colors.background} 4px, ${colors.surface} 4px, ${colors.surface} 8px)`,
                    color: colors.textSecondary,
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      inset: 0,
                      bgcolor: `${colors.background}80`,
                      borderRadius: '6px'
                    }
                  } : isAvailable ? {
                    bgcolor: `${colors.accent}1A`,
                    borderColor: colors.accent,
                    color: colors.textPrimary,
                    '&:hover': {
                      bgcolor: `${colors.accent}33`,
                      transform: 'scale(1.08)',
                      boxShadow: `0 4px 20px ${colors.accent}33`,
                      zIndex: 2
                    }
                  } : {
                    bgcolor: colors.background,
                    color: colors.textSecondary
                  }),
                  ...(isToday && { borderColor: colors.textSecondary })
                }}
              >
                <Box component="span" sx={{ position: 'relative', zIndex: 1 }}>{day}</Box>
                {isToday && (
                  <Box sx={{
                    position: 'absolute',
                    bottom: '4px',
                    fontSize: '0.5rem',
                    color: colors.textSecondary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em'
                  }}>
                    Today
                  </Box>
                )}
                {/* External event indicator */}
                {hasExternalEvents && !isClosed && (
                  <Box sx={{
                    position: 'absolute',
                    top: '3px',
                    right: '3px',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    bgcolor: isOwnCalendar ? '#4285F4' : colors.warning, // Google blue for own, warning for others
                    zIndex: 2,
                  }} />
                )}
              </Box>
            );

            // Wrap with tooltip if there are external events to show
            return hasExternalEvents && tooltipContent ? (
              <Tooltip key={day} title={tooltipContent} arrow placement="top">
                {dayContent}
              </Tooltip>
            ) : (
              <React.Fragment key={day}>{dayContent}</React.Fragment>
            );
          })}

          {/* Next month leading days */}
          {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }, (_, i) => (
            <Box key={`next-${i}`} sx={{
              aspectRatio: '1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              bgcolor: colors.background,
              borderRadius: '8px',
              color: colors.textSecondary,
              opacity: 0.3,
              fontSize: '0.95rem'
            }}>
              {i + 1}
            </Box>
          ))}
        </Box>
      </Box>

      {/* Sidebar */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {isOwnProfile ? (
          <>
            {/* Books Status Card - Owner View */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 2,
              border: `1px solid ${colors.border}`
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 500,
                mb: 1.5,
                color: colors.textPrimary
              }}>
                Booking Status
              </Typography>
              <Box sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                p: 1.5,
                bgcolor: booksOpen ? `${colors.success}15` : colors.background,
                borderRadius: '8px',
                border: `1px solid ${booksOpen ? colors.success : colors.border}40`,
              }}>
                <Box>
                  <Typography sx={{
                    fontWeight: 600,
                    color: colors.textPrimary,
                    fontSize: '0.9rem',
                  }}>
                    {booksOpen ? 'Books Open' : 'Books Closed'}
                  </Typography>
                  <Typography sx={{
                    color: colors.textSecondary,
                    fontSize: '0.8rem',
                  }}>
                    {booksOpen ? 'Accepting bookings' : 'Not accepting bookings'}
                  </Typography>
                </Box>
                <Switch
                  checked={booksOpen || false}
                  onChange={handleToggleBooks}
                  disabled={isTogglingBooks}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': {
                      color: colors.success,
                    },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                      backgroundColor: colors.success,
                    },
                  }}
                />
              </Box>
            </Box>

            {/* Working Hours Card - Owner View */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 2,
              border: `1px solid ${colors.border}`
            }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography sx={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontSize: '1.25rem',
                  fontWeight: 500,
                  color: colors.textPrimary
                }}>
                  Working Hours
                </Typography>
                <Button
                  onClick={() => setWorkingHoursModalOpen(true)}
                  sx={{
                    fontSize: '0.8rem',
                    color: colors.accent,
                    textTransform: 'none',
                    p: 0.5,
                    minWidth: 'auto',
                    '&:hover': { bgcolor: 'transparent', textDecoration: 'underline' }
                  }}
                >
                  Edit
                </Button>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => {
                  const dayHours = workingHours.find(wh => wh.day_of_week === index);
                  const isClosed = !dayHours || dayHours.is_day_off === true || dayHours.is_day_off === 1;
                  return (
                    <Box key={day} sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      py: 0.5,
                      borderBottom: index < 6 ? `1px solid ${colors.border}` : 'none',
                    }}>
                      <Typography sx={{ fontSize: '0.85rem', color: colors.textPrimary }}>{day}</Typography>
                      <Typography sx={{
                        fontSize: '0.85rem',
                        color: isClosed ? colors.textSecondary : colors.textPrimary,
                        fontWeight: isClosed ? 400 : 500
                      }}>
                        {isClosed ? 'Closed' : `${dayHours?.start_time?.slice(0, 5)} - ${dayHours?.end_time?.slice(0, 5)}`}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* Booking Settings Card - Owner View */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 2,
              border: `1px solid ${colors.border}`
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 500,
                color: colors.textPrimary,
                mb: 1.5
              }}>
                Your Rates
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mb: 0.5 }}>
                    Hourly Rate
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 200"
                    value={bookingSettings.hourly_rate}
                    onChange={(e) => handleSettingChange('hourly_rate', e.target.value)}
                    InputProps={{
                      startAdornment: <Typography sx={{ color: colors.textSecondary, mr: 0.5 }}>$</Typography>
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: colors.background,
                        color: colors.textPrimary,
                        fontSize: '0.85rem',
                        '& fieldset': { borderColor: colors.border },
                        '&:hover fieldset': { borderColor: colors.borderLight },
                        '&.Mui-focused fieldset': { borderColor: colors.accent }
                      },
                      '& .MuiInputBase-input::placeholder': { color: colors.textSecondary, opacity: 0.7 }
                    }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mb: 0.5 }}>
                    Min. Session (hours)
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 2"
                    value={bookingSettings.minimum_session}
                    onChange={(e) => handleSettingChange('minimum_session', e.target.value)}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: colors.background,
                        color: colors.textPrimary,
                        fontSize: '0.85rem',
                        '& fieldset': { borderColor: colors.border },
                        '&:hover fieldset': { borderColor: colors.borderLight },
                        '&.Mui-focused fieldset': { borderColor: colors.accent }
                      },
                      '& .MuiInputBase-input::placeholder': { color: colors.textSecondary, opacity: 0.7 }
                    }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mb: 0.5 }}>
                    Deposit Amount
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 150"
                    value={bookingSettings.deposit_amount}
                    onChange={(e) => handleSettingChange('deposit_amount', e.target.value)}
                    InputProps={{
                      startAdornment: <Typography sx={{ color: colors.textSecondary, mr: 0.5 }}>$</Typography>
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: colors.background,
                        color: colors.textPrimary,
                        fontSize: '0.85rem',
                        '& fieldset': { borderColor: colors.border },
                        '&:hover fieldset': { borderColor: colors.borderLight },
                        '&.Mui-focused fieldset': { borderColor: colors.accent }
                      },
                      '& .MuiInputBase-input::placeholder': { color: colors.textSecondary, opacity: 0.7 }
                    }}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mb: 0.5 }}>
                    Consultation Fee
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Free or e.g. 50"
                    value={bookingSettings.consultation_fee}
                    onChange={(e) => handleSettingChange('consultation_fee', e.target.value)}
                    InputProps={{
                      startAdornment: <Typography sx={{ color: colors.textSecondary, mr: 0.5 }}>$</Typography>
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        bgcolor: colors.background,
                        color: colors.textPrimary,
                        fontSize: '0.85rem',
                        '& fieldset': { borderColor: colors.border },
                        '&:hover fieldset': { borderColor: colors.borderLight },
                        '&.Mui-focused fieldset': { borderColor: colors.accent }
                      },
                      '& .MuiInputBase-input::placeholder': { color: colors.textSecondary, opacity: 0.7 }
                    }}
                  />
                </Box>
              </Box>
              <Button
                onClick={handleSaveBookingSettings}
                disabled={savingSettings}
                fullWidth
                sx={{
                  mt: 2,
                  py: 1,
                  borderRadius: '6px',
                  textTransform: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  bgcolor: colors.accent,
                  color: colors.background,
                  '&:hover': { bgcolor: colors.accentHover },
                  '&:disabled': { bgcolor: `${colors.accent}80` }
                }}
              >
                {savingSettings ? 'Saving...' : 'Save Rates'}
              </Button>
            </Box>

            {/* Legend Card - Owner View */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 2,
              border: `1px solid ${colors.border}`
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 500,
                mb: 1.5,
                color: colors.textPrimary
              }}>
                Legend
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {[
                  { type: 'available', label: 'Available', desc: 'Open for bookings' },
                  { type: 'unavailable', label: 'Unavailable', desc: 'Already booked' },
                  { type: 'closed', label: 'Closed', desc: 'Day off' },
                  ...(showExternalEvents ? [{ type: 'google', label: 'Google Event', desc: 'From Google Calendar' }] : [])
                ].map(item => (
                  <Box key={item.type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 24,
                      height: 24,
                      borderRadius: '4px',
                      flexShrink: 0,
                      position: 'relative',
                      ...(item.type === 'available' ? {
                        bgcolor: `${colors.accent}1A`,
                        border: `2px solid ${colors.accent}`
                      } : item.type === 'unavailable' ? {
                        bgcolor: colors.background,
                        border: '2px solid transparent'
                      } : item.type === 'google' ? {
                        bgcolor: colors.background,
                        border: '2px solid transparent'
                      } : {
                        background: `repeating-linear-gradient(45deg, ${colors.background}, ${colors.background} 3px, ${colors.surface} 3px, ${colors.surface} 6px)`,
                        border: '2px solid transparent'
                      })
                    }}>
                      {/* Google Calendar blue dot indicator */}
                      {item.type === 'google' && (
                        <Box sx={{
                          position: 'absolute',
                          top: '2px',
                          right: '2px',
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          bgcolor: '#4285F4',
                        }} />
                      )}
                    </Box>
                    <Box>
                      <Typography sx={{ color: colors.textPrimary, fontWeight: 500, fontSize: '0.8rem' }}>
                        {item.label}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>
          </>
        ) : (
          <>
            {/* View Toggle Card - Client View */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 2,
              border: `1px solid ${colors.border}`
            }}>
              <Box sx={{
                bgcolor: `${colors.accent}1A`,
                border: `1px solid ${colors.accent}4D`,
                borderRadius: '8px',
                p: 1.5,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 1.5
              }}>
                <Box sx={{ width: 10, height: 10, bgcolor: colors.accent, borderRadius: '50%' }} />
                <Typography sx={{ fontSize: '0.85rem', color: colors.textPrimary }}>
                  Showing <Box component="strong" sx={{ color: colors.accent }}>{bookingType}</Box> availability
                </Typography>
              </Box>

              <Typography sx={{
                fontSize: '0.8rem',
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
                mb: 1
              }}>
                I'm looking to book a...
              </Typography>

              <Box sx={{
                display: 'flex',
                bgcolor: colors.background,
                borderRadius: '8px',
                p: 0.5,
                gap: 0.5
              }}>
                <Button
                  onClick={() => setBookingType('consultation')}
                  sx={{
                    flex: 1,
                    py: 1,
                    px: 1.5,
                    borderRadius: '6px',
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    flexDirection: 'column',
                    ...(bookingType === 'consultation' ? {
                      bgcolor: colors.accent,
                      color: colors.background,
                      '&:hover': { bgcolor: colors.accentHover }
                    } : {
                      color: colors.textSecondary,
                      '&:hover': { color: colors.textPrimary, bgcolor: 'transparent' }
                    })
                  }}
                >
                  Consultation
                  <Box component="span" sx={{ fontSize: '0.65rem', opacity: 0.7, mt: 0.25 }}></Box>
                </Button>
                <Button
                  onClick={() => setBookingType('appointment')}
                  sx={{
                    flex: 1,
                    py: 1,
                    px: 1.5,
                    borderRadius: '6px',
                    textTransform: 'none',
                    fontSize: '0.85rem',
                    fontWeight: 500,
                    flexDirection: 'column',
                    ...(bookingType === 'appointment' ? {
                      bgcolor: colors.accent,
                      color: colors.background,
                      '&:hover': { bgcolor: colors.accentHover }
                    } : {
                      color: colors.textSecondary,
                      '&:hover': { color: colors.textPrimary, bgcolor: 'transparent' }
                    })
                  }}
                >
                  Appointment
                  <Box component="span" sx={{ fontSize: '0.65rem', opacity: 0.7, mt: 0.25 }}>In-studio session</Box>
                </Button>
              </Box>
            </Box>

            {/* Legend Card - Client View */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 2,
              border: `1px solid ${colors.border}`
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 500,
                mb: 1.5,
                color: colors.textPrimary
              }}>
                Legend
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { type: 'available', label: 'Available', desc: 'Click to book' },
                  { type: 'unavailable', label: 'Unavailable', desc: 'Fully booked' },
                  { type: 'closed', label: 'Closed', desc: "Artist doesn't work this day" }
                ].map(item => (
                  <Box key={item.type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{
                      width: 32,
                      height: 32,
                      borderRadius: '6px',
                      flexShrink: 0,
                      ...(item.type === 'available' ? {
                        bgcolor: `${colors.accent}1A`,
                        border: `2px solid ${colors.accent}`
                      } : item.type === 'unavailable' ? {
                        bgcolor: colors.background,
                        border: '2px solid transparent'
                      } : {
                        background: `repeating-linear-gradient(45deg, ${colors.background}, ${colors.background} 3px, ${colors.surface} 3px, ${colors.surface} 6px)`,
                        border: '2px solid transparent',
                        position: 'relative',
                        '&::before': {
                          content: '""',
                          position: 'absolute',
                          inset: 0,
                          bgcolor: `${colors.background}80`,
                          borderRadius: '4px'
                        }
                      })
                    }} />
                    <Box>
                      <Typography sx={{ color: colors.textPrimary, fontWeight: 500, fontSize: '0.85rem' }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ color: colors.textSecondary, fontSize: '0.8rem' }}>
                        {item.desc}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </Box>

            {/* Info Card - Client View */}
            <Box sx={{
              bgcolor: colors.surface,
              borderRadius: '12px',
              p: 2,
              border: `1px solid ${colors.border}`
            }}>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.25rem',
                fontWeight: 500,
                mb: 1,
                color: colors.textPrimary
              }}>
                {config.title}
              </Typography>
              <Typography sx={{
                color: colors.textSecondary,
                fontSize: '0.9rem',
                lineHeight: 1.6,
                mb: 1.5,
                pb: 1.5,
                borderBottom: `1px solid ${colors.border}`
              }}>
                {config.description}
              </Typography>
              {[
                { label: 'Duration', value: config.duration },
                { label: 'Cost', value: config.cost, accent: true },
                { label: 'Response Time', value: '~24 hours' }
              ].map((item, idx) => (
                <Box key={item.label} sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  py: 1,
                  borderBottom: idx < 2 ? `1px solid ${colors.border}` : 'none',
                  fontSize: '0.9rem'
                }}>
                  <Typography sx={{ color: colors.textSecondary }}>{item.label}</Typography>
                  <Typography sx={{
                    color: item.accent ? colors.accent : colors.textPrimary,
                    fontWeight: 500
                  }}>
                    {item.value}
                  </Typography>
                </Box>
              ))}
            </Box>
          </>
        )}
      </Box>

      {/* Booking Modal */}
      <Modal
        open={modalOpen}
        onClose={closeModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{
          bgcolor: colors.surface,
          borderRadius: '16px',
          p: 3,
          width: '100%',
          maxWidth: 440,
          border: `1px solid ${colors.accent}33`,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          mx: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.5rem',
                fontWeight: 500,
                color: colors.textPrimary
              }}>
                {selectedDay ? formatDateForDisplay(selectedDay) : ''}
              </Typography>
              <Box sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                bgcolor: `${colors.accent}1A`,
                color: colors.accent,
                px: 1,
                py: 0.5,
                borderRadius: '100px',
                fontSize: '0.75rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                mt: 0.5
              }}>
                {config.title}
              </Box>
            </Box>
            <IconButton
              onClick={closeModal}
              sx={{
                bgcolor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textSecondary,
                '&:hover': { bgcolor: colors.surface, color: colors.textPrimary }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography sx={{ color: colors.textSecondary, fontSize: '0.95rem', lineHeight: 1.6, mb: 2 }}>
            {config.modalDescription(artistName)}
          </Typography>

          <Box sx={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 1.5,
            bgcolor: colors.background,
            borderRadius: '10px',
            p: 1.5,
            mb: 2
          }}>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>
                Duration
              </Typography>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.textPrimary }}>
                {config.modalDuration}
              </Typography>
            </Box>
            <Box sx={{ textAlign: 'center' }}>
              <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, textTransform: 'uppercase', mb: 0.5 }}>
                Cost
              </Typography>
              <Typography sx={{ fontSize: '1.1rem', fontWeight: 600, color: colors.accent }}>
                {config.modalCost}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={closeModal}
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                '&:hover': { borderColor: colors.textSecondary }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmBooking}
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                bgcolor: colors.accent,
                color: colors.background,
                '&:hover': { bgcolor: colors.accentHover }
              }}
            >
              Request Booking
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Login Required Modal */}
      <Modal
        open={loginModalOpen}
        onClose={closeLoginModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{
          bgcolor: colors.surface,
          borderRadius: '16px',
          p: 3,
          width: '100%',
          maxWidth: 400,
          border: `1px solid ${colors.accent}33`,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          mx: 2
        }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Typography sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: '1.5rem',
              fontWeight: 500,
              color: colors.accent
            }}>
              Account Required
            </Typography>
            <IconButton
              onClick={closeLoginModal}
              sx={{
                bgcolor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textSecondary,
                '&:hover': { bgcolor: colors.surface, color: colors.textPrimary }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <Typography sx={{ color: colors.textSecondary, fontSize: '0.95rem', lineHeight: 1.6, mb: 3 }}>
            Please log in or create an account to book appointments with this artist.
          </Typography>

          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={closeLoginModal}
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                '&:hover': { borderColor: colors.textSecondary }
              }}
            >
              Cancel
            </Button>
            <Button
              component={Link}
              href="/login"
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                '&:hover': { borderColor: colors.accent, color: colors.accent }
              }}
            >
              Log In
            </Button>
            <Button
              component={Link}
              href="/register"
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                bgcolor: colors.accent,
                color: colors.background,
                '&:hover': { bgcolor: colors.accentHover }
              }}
            >
              Sign Up
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Working Hours Modal */}
      {isOwnProfile && (
        <WorkingHoursModal
          isOpen={workingHoursModalOpen}
          onClose={() => setWorkingHoursModalOpen(false)}
          onSave={handleSaveWorkingHours}
          artistId={resolvedArtistId || undefined}
          initialWorkingHours={workingHours}
        />
      )}

      {/* Artist Day Management Modal */}
      <Modal
        open={artistDayModalOpen}
        onClose={closeArtistDayModal}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <Box sx={{
          bgcolor: colors.surface,
          borderRadius: '16px',
          p: 3,
          width: '100%',
          maxWidth: 480,
          border: `1px solid ${colors.accent}33`,
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.5)',
          mx: 2,
          maxHeight: '90vh',
          overflowY: 'auto'
        }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography sx={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontSize: '1.5rem',
                fontWeight: 500,
                color: colors.textPrimary
              }}>
                {selectedDay ? formatDateForDisplay(selectedDay) : ''}
              </Typography>
            </Box>
            <IconButton
              onClick={closeArtistDayModal}
              sx={{
                bgcolor: colors.background,
                border: `1px solid ${colors.border}`,
                borderRadius: '8px',
                color: colors.textSecondary,
                '&:hover': { bgcolor: colors.surface, color: colors.textPrimary }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Existing Appointments Section */}
          {selectedDay && getAppointmentsForDate(selectedDay).length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography sx={{
                fontSize: '0.85rem',
                fontWeight: 600,
                color: colors.textSecondary,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                mb: 1.5
              }}>
                Scheduled
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                {getAppointmentsForDate(selectedDay).map((apt, idx) => (
                  <Box key={idx} sx={{
                    p: 1.5,
                    bgcolor: colors.background,
                    borderRadius: '8px',
                    border: `1px solid ${colors.border}`
                  }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography sx={{ fontWeight: 500, color: colors.textPrimary, fontSize: '0.9rem' }}>
                        {apt.title || 'Appointment'}
                      </Typography>
                      <Box sx={{
                        px: 1,
                        py: 0.25,
                        bgcolor: apt.status === 'confirmed' ? `${colors.success}22` : `${colors.accent}22`,
                        color: apt.status === 'confirmed' ? colors.success : colors.accent,
                        borderRadius: '4px',
                        fontSize: '0.7rem',
                        fontWeight: 600,
                        textTransform: 'uppercase'
                      }}>
                        {apt.status || 'pending'}
                      </Box>
                    </Box>
                    {apt.start && (
                      <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mt: 0.5 }}>
                        {new Date(apt.start).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Typography>
                    )}
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* No Appointments Message */}
          {selectedDay && getAppointmentsForDate(selectedDay).length === 0 && (
            <Box sx={{
              p: 2,
              bgcolor: colors.background,
              borderRadius: '8px',
              mb: 3,
              textAlign: 'center'
            }}>
              <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
                No appointments scheduled for this day
              </Typography>
            </Box>
          )}

          {/* Divider */}
          <Box sx={{ height: '1px', bgcolor: colors.border, mb: 3 }} />

          {/* Invite Guest Section */}
          <Typography sx={{
            fontSize: '0.85rem',
            fontWeight: 600,
            color: colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            mb: 1.5
          }}>
            Invite a Guest
          </Typography>

          {/* Invite Type Toggle */}
          <Box sx={{
            display: 'flex',
            bgcolor: colors.background,
            borderRadius: '8px',
            p: 0.5,
            gap: 0.5,
            mb: 2
          }}>
            <Button
              onClick={() => setInviteType('consultation')}
              sx={{
                flex: 1,
                py: 1,
                borderRadius: '6px',
                textTransform: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
                ...(inviteType === 'consultation' ? {
                  bgcolor: colors.accent,
                  color: colors.background,
                  '&:hover': { bgcolor: colors.accentHover }
                } : {
                  color: colors.textSecondary,
                  '&:hover': { color: colors.textPrimary, bgcolor: 'transparent' }
                })
              }}
            >
              Consultation
            </Button>
            <Button
              onClick={() => setInviteType('appointment')}
              sx={{
                flex: 1,
                py: 1,
                borderRadius: '6px',
                textTransform: 'none',
                fontSize: '0.85rem',
                fontWeight: 500,
                ...(inviteType === 'appointment' ? {
                  bgcolor: colors.accent,
                  color: colors.background,
                  '&:hover': { bgcolor: colors.accentHover }
                } : {
                  color: colors.textSecondary,
                  '&:hover': { color: colors.textPrimary, bgcolor: 'transparent' }
                })
              }}
            >
              Appointment
            </Button>
          </Box>

          {/* Guest Details Form */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5, mb: 2 }}>
            <Box>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mb: 0.5 }}>
                Guest Email *
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="client@email.com"
                value={guestEmail}
                onChange={(e) => setGuestEmail(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colors.background,
                    color: colors.textPrimary,
                    fontSize: '0.9rem',
                    '& fieldset': { borderColor: colors.border },
                    '&:hover fieldset': { borderColor: colors.borderLight },
                    '&.Mui-focused fieldset': { borderColor: colors.accent }
                  },
                  '& .MuiInputBase-input::placeholder': { color: colors.textSecondary, opacity: 0.7 }
                }}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mb: 0.5 }}>
                Guest Name
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="Client name (optional)"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colors.background,
                    color: colors.textPrimary,
                    fontSize: '0.9rem',
                    '& fieldset': { borderColor: colors.border },
                    '&:hover fieldset': { borderColor: colors.borderLight },
                    '&.Mui-focused fieldset': { borderColor: colors.accent }
                  },
                  '& .MuiInputBase-input::placeholder': { color: colors.textSecondary, opacity: 0.7 }
                }}
              />
            </Box>
            <Box>
              <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mb: 0.5 }}>
                Note
              </Typography>
              <TextField
                fullWidth
                size="small"
                multiline
                rows={2}
                placeholder="Add a message for your guest..."
                value={inviteNote}
                onChange={(e) => setInviteNote(e.target.value)}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: colors.background,
                    color: colors.textPrimary,
                    fontSize: '0.9rem',
                    '& fieldset': { borderColor: colors.border },
                    '&:hover fieldset': { borderColor: colors.borderLight },
                    '&.Mui-focused fieldset': { borderColor: colors.accent }
                  },
                  '& .MuiInputBase-input::placeholder': { color: colors.textSecondary, opacity: 0.7 }
                }}
              />
            </Box>
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              onClick={closeArtistDayModal}
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                '&:hover': { borderColor: colors.textSecondary }
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendInvite}
              disabled={!guestEmail || sendingInvite}
              sx={{
                flex: 1,
                py: 1.25,
                borderRadius: '8px',
                textTransform: 'none',
                fontSize: '0.9rem',
                fontWeight: 600,
                bgcolor: colors.accent,
                color: colors.background,
                '&:hover': { bgcolor: colors.accentHover },
                '&:disabled': { bgcolor: `${colors.accent}80`, color: colors.background }
              }}
            >
              {sendingInvite ? 'Sending...' : 'Send Invite'}
            </Button>
          </Box>
        </Box>
      </Modal>
    </Box>
  );
});

ArtistProfileCalendar.displayName = 'ArtistProfileCalendar';

export default ArtistProfileCalendar;
