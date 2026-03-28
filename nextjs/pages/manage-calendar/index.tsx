import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import Layout from '@/components/Layout';
import EditAppointmentModal from '@/components/appointments/EditAppointmentModal';
import { useAuth } from '@/contexts/AuthContext';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ScheduleIcon from '@mui/icons-material/Schedule';
import EditIcon from '@mui/icons-material/Edit';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { colors } from '@/styles/colors';
import { appointmentService } from '@/services/appointmentService';

const PAGE_SIZE = 10;

interface ManageAppointment {
  id: number;
  title: string;
  date: string;
  start?: string | null;
  end?: string | null;
  start_time?: string | null;
  end_time?: string | null;
  status: string;
  client_id?: number | null;
  price?: string | number | null;
  duration_minutes?: number | null;
  notes?: string | null;
  is_derived?: boolean;
  client?: { id: number; name: string; username?: string; email?: string } | null;
  extendedProps?: {
    status?: string;
    description?: string;
    clientName?: string;
    artistName?: string;
  };
}

const STATUS_STYLES: Record<string, { bg: string; color: string; label: string }> = {
  pending: { bg: colors.warningDim, color: colors.warning, label: 'Pending' },
  booked: { bg: colors.successDim, color: colors.success, label: 'Confirmed' },
  completed: { bg: colors.accentDim, color: colors.accent, label: 'Completed' },
  cancelled: { bg: colors.tagDim, color: colors.error, label: 'Cancelled' },
};

function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.substring(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDay(dateStr: string): number {
  return parseDate(dateStr).getDate();
}

function formatMonth(dateStr: string): string {
  return parseDate(dateStr).toLocaleString('en-US', { month: 'short' });
}

function formatTime(isoOrTime?: string | null): string {
  if (!isoOrTime) return '';
  try {
    const timePart = isoOrTime.includes('T') ? isoOrTime.split('T')[1] : isoOrTime;
    const d = new Date(`2000-01-01T${timePart}`);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  } catch {
    return '';
  }
}

function formatTimeRange(start?: string | null, end?: string | null): string {
  const s = formatTime(start);
  const e = formatTime(end);
  if (s && e) return `${s} - ${e}`;
  return s || e || '';
}

export default function ManageCalendarPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<ManageAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [editAppointment, setEditAppointment] = useState<ManageAppointment | null>(null);

  const isArtist = user?.type === 'artist';

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const fetchAppointments = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const res = await appointmentService.getArtistAppointments({ artist_id: user.id });
      const list = Array.isArray(res) ? res : [];
      const sorted = list.sort((a: ManageAppointment, b: ManageAppointment) => {
        return (b.date || '').localeCompare(a.date || '');
      });
      setAppointments(sorted);
    } catch {
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Find page containing today's date on initial load
  const [hasInitialized, setHasInitialized] = useState(false);
  useEffect(() => {
    if (!hasInitialized && appointments.length > 0) {
      const today = new Date().toISOString().substring(0, 10);
      const idx = appointments.findIndex(a => (a.date || '') <= today);
      setPage(idx >= 0 ? Math.floor(idx / PAGE_SIZE) : 0);
      setHasInitialized(true);
    }
  }, [appointments, hasInitialized]);

  const totalPages = Math.max(1, Math.ceil(appointments.length / PAGE_SIZE));
  const pageAppointments = appointments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleEditClick = (apt: ManageAppointment) => {
    setEditAppointment(apt);
  };

  const handleSaved = () => {
    fetchAppointments();
  };

  if (authLoading) {
    return (
      <Layout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Typography sx={{ color: colors.textSecondary }}>Loading...</Typography>
        </Box>
      </Layout>
    );
  }

  if (!isAuthenticated || !user) return null;

  return (
    <Layout>
      <Head>
        <title>Manage Calendar | InkedIn</title>
        <meta name="description" content="View and manage your appointments" />
      </Head>

      <Box sx={{ maxWidth: 800, mx: 'auto', py: 3, px: { xs: 2, md: 3 } }}>
        {/* Header */}
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          p: 2,
          bgcolor: colors.surface,
          borderRadius: '12px',
          border: `1px solid ${colors.border}`,
          flexWrap: 'wrap',
          gap: 2,
        }}>
          <Box>
            <Typography sx={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: { xs: '1.5rem', md: '2rem' },
              fontWeight: 600,
              color: colors.textPrimary,
            }}>
              Manage Calendar
            </Typography>
            <Typography sx={{ color: colors.textSecondary, fontSize: '0.9rem' }}>
              View and edit your appointment details
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              component={Link}
              href="/calendar"
              sx={{
                px: 2, py: 1,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem',
                '&:hover': { borderColor: colors.accent, color: colors.accent },
              }}
              startIcon={<ScheduleIcon sx={{ fontSize: 16 }} />}
            >
              Calendar View
            </Button>
            <Button
              component={Link}
              href="/dashboard"
              sx={{
                px: 2, py: 1,
                color: colors.textPrimary,
                border: `1px solid ${colors.border}`,
                borderRadius: '6px',
                textTransform: 'none',
                fontWeight: 500,
                fontSize: '0.85rem',
                '&:hover': { borderColor: colors.accent, color: colors.accent },
              }}
              startIcon={<ArrowBackIcon sx={{ fontSize: 16 }} />}
            >
              Dashboard
            </Button>
          </Box>
        </Box>

        {/* Pagination header */}
        <Box sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 1.5,
          px: 2,
          mb: 2,
          bgcolor: colors.surface,
          borderRadius: '8px',
          border: `1px solid ${colors.border}`,
        }}>
          <IconButton
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            sx={{ color: page === 0 ? colors.textMuted : colors.textPrimary }}
          >
            <ChevronLeftIcon />
          </IconButton>
          <Typography sx={{ flex: 1, textAlign: 'center', color: colors.textSecondary, fontSize: '0.85rem', fontWeight: 500 }}>
            {appointments.length > 0
              ? `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, appointments.length)} of ${appointments.length}`
              : 'No appointments'}
          </Typography>
          <IconButton
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            sx={{ color: page >= totalPages - 1 ? colors.textMuted : colors.textPrimary }}
          >
            <ChevronRightIcon />
          </IconButton>
        </Box>

        {/* Appointment list */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: colors.accent }} />
          </Box>
        ) : appointments.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <EventNoteIcon sx={{ fontSize: 48, color: colors.textMuted }} />
            <Typography sx={{ color: colors.textPrimary, fontSize: '1.1rem', fontWeight: 600, mt: 2 }}>
              No Appointments
            </Typography>
            <Typography sx={{ color: colors.textMuted, fontSize: '0.9rem', mt: 1 }}>
              Appointments will appear here once clients book with you.
            </Typography>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {pageAppointments.map((apt) => {
              const st = STATUS_STYLES[apt.status] || STATUS_STYLES.pending;
              const isCancelled = apt.status === 'cancelled';
              const clientName = apt.client?.name || apt.extendedProps?.clientName || '';
              const dateStr = typeof apt.date === 'string' ? apt.date : '';
              const startTime = apt.start || apt.start_time;
              const endTime = apt.end || apt.end_time;
              const timeStr = formatTimeRange(startTime, endTime);

              return (
                <Box
                  key={apt.id}
                  onClick={() => handleEditClick(apt)}
                  sx={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 1.5,
                    p: 1.5,
                    bgcolor: colors.surfaceElevated,
                    borderRadius: '10px',
                    cursor: 'pointer',
                    opacity: isCancelled ? 0.6 : 1,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                      borderColor: colors.accent,
                      bgcolor: colors.surface,
                    },
                    border: `1px solid transparent`,
                  }}
                >
                  {/* Date badge */}
                  <Box sx={{
                    minWidth: 44,
                    textAlign: 'center',
                    bgcolor: colors.surface,
                    borderRadius: '8px',
                    py: 0.75,
                    px: 1,
                  }}>
                    <Typography sx={{ fontSize: '1.1rem', fontWeight: 700, color: isCancelled ? colors.textMuted : colors.textPrimary, lineHeight: 1.2 }}>
                      {dateStr ? formatDay(dateStr) : ''}
                    </Typography>
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 600, color: colors.textMuted, textTransform: 'uppercase' }}>
                      {dateStr ? formatMonth(dateStr) : ''}
                    </Typography>
                  </Box>

                  {/* Info */}
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      color: isCancelled ? colors.textMuted : colors.textPrimary,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}>
                      {apt.title}
                    </Typography>
                    {timeStr && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                        <ScheduleIcon sx={{ fontSize: 12, color: colors.textMuted }} />
                        <Typography sx={{ fontSize: '0.75rem', color: colors.textMuted }}>
                          {timeStr}
                        </Typography>
                      </Box>
                    )}
                    {clientName && (
                      <Typography sx={{ fontSize: '0.75rem', color: colors.textSecondary, mt: 0.25 }}>
                        {clientName}
                      </Typography>
                    )}
                    {(apt.price || apt.duration_minutes) && (
                      <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                        {apt.price != null && (
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: colors.accent }}>
                            ${Number(apt.price).toFixed(0)}{apt.is_derived ? '*' : ''}
                          </Typography>
                        )}
                        {apt.duration_minutes != null && (
                          <Typography sx={{ fontSize: '0.7rem', fontWeight: 600, color: colors.accent }}>
                            {apt.duration_minutes} min{apt.is_derived ? '*' : ''}
                          </Typography>
                        )}
                      </Box>
                    )}
                    {apt.notes && (
                      <Typography sx={{
                        fontSize: '0.7rem',
                        color: colors.textMuted,
                        fontStyle: 'italic',
                        mt: 0.5,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                      }}>
                        {apt.notes}
                      </Typography>
                    )}
                  </Box>

                  {/* Right column */}
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1, flexShrink: 0 }}>
                    <IconButton
                      size="small"
                      onClick={(e) => { e.stopPropagation(); handleEditClick(apt); }}
                      sx={{ color: colors.accent, p: 0.5 }}
                    >
                      <EditIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Box sx={{
                      px: 1,
                      py: 0.25,
                      bgcolor: st.bg,
                      borderRadius: '4px',
                    }}>
                      <Typography sx={{
                        fontSize: '0.6rem',
                        fontWeight: 700,
                        color: st.color,
                        textTransform: 'uppercase',
                      }}>
                        {st.label}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      {/* Edit Appointment Modal */}
      <EditAppointmentModal
        open={!!editAppointment}
        appointment={editAppointment}
        onClose={() => setEditAppointment(null)}
        onSaved={handleSaved}
      />
    </Layout>
  );
}
