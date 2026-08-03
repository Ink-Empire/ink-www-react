import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { colors } from '../../lib/colors';
import { appointmentService } from '../../lib/services';

const PAGE_SIZE = 5;

function parseDate(dateStr: string): Date {
  const datePart = dateStr.substring(0, 10);
  const [y, m, d] = datePart.split('-').map(Number);
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
    // Handle ISO datetime (2026-03-20T14:00) or raw time (14:00:00)
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

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  pending: { bg: colors.warningDim, text: colors.warning, label: 'Pending' },
  booked: { bg: colors.successDim, text: colors.success, label: 'Confirmed' },
  completed: { bg: colors.accentDim, text: colors.accent, label: 'Completed' },
  cancelled: { bg: colors.tagDim, text: colors.error, label: 'Cancelled' },
};

interface ManageAppointment {
  id: number;
  title: string;
  date: string;
  start?: string | null;
  end?: string | null;
  status: string;
  client_id?: number | null;
  price?: string | number | null;
  duration_minutes?: number | null;
  notes?: string | null;
  is_derived?: boolean;
  client?: { id: number; name?: string } | null;
  extendedProps?: {
    status?: string;
    description?: string;
    clientName?: string;
    artistName?: string;
  };
}

export default function ManageCalendarScreen({ route, navigation }: any) {
  const { artistId } = route.params;
  const [allAppointments, setAllAppointments] = useState<ManageAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);

  const fetchAppointments = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await appointmentService.getArtistAppointments({
        artist_id: artistId,
      });
      const list = res?.data || res || [];
      const sorted = (Array.isArray(list) ? list : []).sort((a: ManageAppointment, b: ManageAppointment) => {
        // Most recent first
        const dateA = a.date || '';
        const dateB = b.date || '';
        return dateB.localeCompare(dateA);
      });
      setAllAppointments(sorted);
    } catch {
      setAllAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [artistId]);

  useFocusEffect(
    useCallback(() => {
      fetchAppointments();
    }, [fetchAppointments])
  );

  // Find the page that contains today's date (or most recent past)
  const findCurrentPage = useCallback(() => {
    const today = new Date().toISOString().substring(0, 10);
    const idx = allAppointments.findIndex(a => (a.date || '') <= today);
    return idx >= 0 ? Math.floor(idx / PAGE_SIZE) : 0;
  }, [allAppointments]);

  // Reset to current page when data loads
  const [hasInitialized, setHasInitialized] = useState(false);
  if (!hasInitialized && allAppointments.length > 0) {
    setPage(findCurrentPage());
    setHasInitialized(true);
  }

  const totalPages = Math.max(1, Math.ceil(allAppointments.length / PAGE_SIZE));
  const pageAppointments = allAppointments.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const handleEditPress = (apt: ManageAppointment) => {
    navigation.navigate('EditAppointment', { appointmentId: apt.id, appointment: apt });
  };

  return (
    <View style={styles.container}>
      {/* Pagination header */}
      <View style={styles.paginationHeader}>
        <TouchableOpacity
          onPress={() => setPage(p => Math.max(0, p - 1))}
          disabled={page === 0}
          style={styles.arrowButton}
        >
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={page === 0 ? colors.textMuted : colors.textPrimary}
          />
        </TouchableOpacity>
        <Text style={styles.pageLabel}>
          {allAppointments.length > 0
            ? `${page * PAGE_SIZE + 1}-${Math.min((page + 1) * PAGE_SIZE, allAppointments.length)} of ${allAppointments.length}`
            : 'No appointments'}
        </Text>
        <TouchableOpacity
          onPress={() => setPage(p => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
          style={styles.arrowButton}
        >
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={page >= totalPages - 1 ? colors.textMuted : colors.textPrimary}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, !loading && pageAppointments.length > 0 && styles.contentFill]} style={styles.scrollView}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : allAppointments.length === 0 ? (
          <View style={styles.centered}>
            <MaterialIcons name="event-note" size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>No Appointments</Text>
            <Text style={styles.emptySubtitle}>
              Appointments will appear here once clients book with you.
            </Text>
          </View>
        ) : (
          pageAppointments.map((apt) => {
            const status = STATUS_STYLES[apt.status] || STATUS_STYLES.pending;
            const isCancelled = apt.status === 'cancelled';
            const clientName = apt.client?.name || apt.extendedProps?.clientName;
            const clientId = apt.client?.id || apt.client_id;
            const dateStr = typeof apt.date === 'string' ? apt.date : '';
            const timeStr = formatTimeRange(apt.start, apt.end);

            return (
              <TouchableOpacity
                key={apt.id}
                style={[styles.card, isCancelled && styles.cardMuted]}
                onPress={() => handleEditPress(apt)}
                activeOpacity={0.7}
              >
                <View style={styles.cardContent}>
                  <View style={styles.dateBadge}>
                    <Text style={[styles.dateDay, isCancelled && styles.textMuted]}>
                      {dateStr ? formatDay(dateStr) : ''}
                    </Text>
                    <Text style={styles.dateMonth}>
                      {dateStr ? formatMonth(dateStr) : ''}
                    </Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={[styles.title, isCancelled && styles.textMuted]} numberOfLines={1}>
                      {apt.title}
                    </Text>
                    {timeStr ? (
                      <View style={styles.timeRow}>
                        <MaterialIcons name="schedule" size={12} color={colors.textMuted} />
                        <Text style={styles.time}>{timeStr}</Text>
                      </View>
                    ) : null}
                    {clientName ? (
                      clientId ? (
                        <Text
                          style={styles.clientNameLink}
                          onPress={() => {
                            navigation.navigate('ClientProfile', { clientId, name: clientName });
                          }}
                        >
                          {clientName}
                        </Text>
                      ) : (
                        <Text style={styles.clientName}>{clientName}</Text>
                      )
                    ) : null}
                    {(apt.price || apt.duration_minutes) ? (
                      <View style={styles.metaRow}>
                        {apt.price ? (
                          <Text style={styles.metaText}>${Number(apt.price).toFixed(0)}{apt.is_derived ? '*' : ''}</Text>
                        ) : null}
                        {apt.duration_minutes ? (
                          <Text style={styles.metaText}>{apt.duration_minutes} min{apt.is_derived ? '*' : ''}</Text>
                        ) : null}
                      </View>
                    ) : null}
                    {apt.notes ? (
                      <Text style={styles.notes} numberOfLines={2}>{apt.notes}</Text>
                    ) : null}
                  </View>
                  <View style={styles.rightColumn}>
                    <TouchableOpacity
                      onPress={() => handleEditPress(apt)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <MaterialIcons name="edit" size={18} color={colors.accent} />
                    </TouchableOpacity>
                    <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                      <Text style={[styles.statusText, { color: status.text }]}>{status.label}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  paginationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  arrowButton: {
    padding: 4,
  },
  pageLabel: {
    flex: 1,
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  contentFill: {
    flexGrow: 1,
  },
  scrollView: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  card: {
    flex: 1,
    backgroundColor: colors.surfaceElevated,
    borderRadius: 10,
    marginBottom: 8,
    overflow: 'hidden',
  },
  cardMuted: {
    opacity: 0.6,
  },
  cardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
  },
  dateBadge: {
    width: 44,
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingVertical: 6,
  },
  dateDay: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  dateMonth: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  textMuted: {
    color: colors.textMuted,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    color: colors.textMuted,
    fontSize: 12,
  },
  clientName: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  clientNameLink: {
    color: colors.accent,
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  metaText: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  notes: {
    color: colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 4,
  },
  rightColumn: {
    alignItems: 'flex-end',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
