import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  RefreshControl,
} from 'react-native';
import { colors } from '../../lib/colors';
import { clientInsightsService } from '../../lib/services';
import Avatar from '../components/common/Avatar';
import AddTagSheet from './AddTagSheet';
import type {
  ClientProfile,
  TagGroup,
  ClientNote,
  ClientAppointmentHistory,
} from '@inkedin/shared/types';

const TAG_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  teal:   { bg: colors.tagLikesBg, text: colors.tagLikes, border: `${colors.tagLikes}30` },
  coral:  { bg: colors.tagAvoidBg, text: colors.tagAvoid, border: `${colors.tagAvoid}30` },
  purple: { bg: colors.tagPersonalityBg, text: colors.tagPersonality, border: `${colors.tagPersonality}30` },
  amber:  { bg: colors.tagNotesBg, text: colors.tagNotes, border: `${colors.tagNotes}30` },
};

const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  done:     { bg: colors.tagLikesBg, text: colors.tagLikes },
  upcoming: { bg: colors.tagPersonalityBg, text: colors.tagPersonality },
  booked:   { bg: colors.tagPersonalityBg, text: colors.tagPersonality },
  cancelled:{ bg: colors.tagAvoidBg, text: colors.tagAvoid },
};

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return '';
  const hours = minutes / 60;
  return hours === Math.floor(hours) ? `${hours}h` : `${hours.toFixed(1)}h`;
}

export default function ClientProfileScreen({ route, navigation }: any) {
  const { clientId } = route.params;
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [tagSheetVisible, setTagSheetVisible] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const response = await clientInsightsService.getProfile(clientId);
      setProfile(response.profile);
    } catch (err: any) {
      setError(err.message || 'Failed to load client profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchProfile();
  }, [fetchProfile]);

  const handleAddNote = useCallback(async () => {
    if (!noteText.trim() || savingNote) return;
    setSavingNote(true);
    try {
      const response = await clientInsightsService.addNote(clientId, noteText.trim());
      setProfile(prev => prev ? {
        ...prev,
        notes: [response.note, ...prev.notes],
      } : prev);
      setNoteText('');
    } catch {
      // silently fail
    } finally {
      setSavingNote(false);
    }
  }, [clientId, noteText, savingNote]);

  if (loading) {
    return (
      <View style={s.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={s.centered}>
        <Text style={s.errorText}>{error || 'Client not found'}</Text>
      </View>
    );
  }

  const { client, stats, tags, notes, history } = profile;
  const sinceDate = new Date(client.created_at);
  const sinceStr = sinceDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={s.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
    >
      {/* Profile Header */}
      <View style={s.profileHeader}>
        <View style={s.avatarBorder}>
          <Avatar name={client.name} size={52} />
        </View>
        <View>
          <Text style={s.profileName}>{client.name}</Text>
          <Text style={s.profileSub}>Client since {sinceStr}</Text>
        </View>
      </View>

      {/* Stat Row */}
      <View style={s.statRow}>
        <StatCard value={String(stats.sessions)} label="sessions" />
        <StatCard value={`$${Math.round(stats.total_spent).toLocaleString()}`} label="total spent" />
        <StatCard value={`${stats.hours_in_chair} hrs`} label="in chair" />
        <StatCard
          value={stats.next_appointment ? formatShortDate(stats.next_appointment) : '—'}
          label="next appt"
        />
      </View>

      <View style={s.divider} />

      {/* Tags Section */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Tags</Text>
          <TouchableOpacity
            onPress={() => setTagSheetVisible(true)}
          >
            <Text style={s.sectionAdd}>+ add</Text>
          </TouchableOpacity>
        </View>
        {tags.length > 0 ? (
          tags.map((group: TagGroup) => (
            <View key={group.category.id} style={s.tagGroup}>
              <Text style={s.tagGroupLabel}>{group.category.name}</Text>
              <View style={s.tagsRow}>
                {group.tags.map(tag => {
                  const c = TAG_COLORS[group.category.color] || TAG_COLORS.teal;
                  return (
                    <View key={tag.id} style={[s.tag, { backgroundColor: c.bg, borderColor: c.border }]}>
                      <Text style={[s.tagText, { color: c.text }]}>{tag.label}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        ) : (
          <Text style={s.emptyText}>No tags yet</Text>
        )}
      </View>

      <View style={s.divider} />

      {/* Notes Section */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Artist notes</Text>
        </View>
        {notes.length > 0 ? (
          <View style={s.notesList}>
            {notes.map((note: ClientNote) => (
              <View key={note.id} style={s.note}>
                <Text style={s.noteText}>{note.body}</Text>
                <Text style={s.noteMeta}>{formatDate(note.created_at)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={s.emptyText}>No notes yet</Text>
        )}
      </View>

      {/* Add Note Bar */}
      <View style={s.addNoteBar}>
        <TextInput
          style={s.addNoteInput}
          placeholder="Note from today's session..."
          placeholderTextColor={colors.textMuted}
          value={noteText}
          onChangeText={setNoteText}
          multiline
        />
        <TouchableOpacity onPress={handleAddNote} disabled={savingNote || !noteText.trim()}>
          <Text style={[s.addNoteBtn, (!noteText.trim() || savingNote) && { opacity: 0.4 }]}>
            {savingNote ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={s.divider} />

      {/* History Section */}
      <View style={s.section}>
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>History</Text>
        </View>
        {history.length > 0 ? (
          <View style={s.historyList}>
            {history.map((appt: ClientAppointmentHistory) => {
              const badge = BADGE_STYLES[appt.status] || BADGE_STYLES.done;
              const duration = formatDuration(appt.duration_minutes);
              return (
                <View key={appt.id} style={s.historyRow}>
                  <View>
                    <Text style={s.historyType}>
                      {appt.type === 'consultation' ? 'Consultation' : 'Tattoo'}
                    </Text>
                    <Text style={s.historyDate}>
                      {formatShortDate(appt.date)}{duration ? ` \u00B7 ${duration}` : ''}
                    </Text>
                  </View>
                  <View style={[s.hBadge, { backgroundColor: badge.bg }]}>
                    <Text style={[s.hBadgeText, { color: badge.text }]}>{appt.status}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={s.emptyText}>No appointment history</Text>
        )}
      </View>

      <View style={{ height: 40 }} />

      <AddTagSheet
        clientId={clientId}
        visible={tagSheetVisible}
        onClose={() => setTagSheetVisible(false)}
        onTagAdded={() => fetchProfile()}
      />
    </ScrollView>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <View style={s.stat}>
      <Text style={s.statVal}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 40 },
  centered: { flex: 1, backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' },
  errorText: { color: colors.error, fontSize: 14 },

  // Profile Header
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  avatarBorder: {
    borderWidth: 1.5,
    borderColor: 'rgba(201, 169, 98, 0.38)',
    borderRadius: 28,
    padding: 1,
  },
  profileName: { color: colors.textPrimary, fontSize: 17, fontWeight: '500' },
  profileSub: { color: colors.textMuted, fontSize: 12, marginTop: 2 },

  // Stat Row
  statRow: { flexDirection: 'row', gap: 6, paddingHorizontal: 16, paddingBottom: 14 },
  stat: {
    flex: 1,
    backgroundColor: '#161616',
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderWidth: 0.5,
    borderColor: colors.border,
  },
  statVal: { color: colors.accent, fontSize: 15, fontWeight: '500' },
  statLabel: { color: colors.textMuted, fontSize: 10, marginTop: 2 },

  // Divider
  divider: { height: 0.5, backgroundColor: '#1e1e1e', marginHorizontal: 16, marginBottom: 14 },

  // Section
  section: { paddingHorizontal: 16, paddingBottom: 14 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  sectionAdd: { color: colors.accent, fontSize: 12 },
  emptyText: { color: colors.textMuted, fontSize: 12 },

  // Tags
  tagGroup: { marginBottom: 10 },
  tagGroupLabel: {
    color: colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 5 },
  tag: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 20, borderWidth: 0.5 },
  tagText: { fontSize: 11 },

  // Notes
  notesList: { gap: 7 },
  note: {
    backgroundColor: '#141414',
    borderRadius: 7,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    padding: 9,
    paddingLeft: 11,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(201, 169, 98, 0.38)',
  },
  noteText: { color: '#aaa', fontSize: 12, lineHeight: 18 },
  noteMeta: { color: colors.textMuted, fontSize: 10, marginTop: 4 },

  // Add Note
  addNoteBar: {
    marginHorizontal: 16,
    marginBottom: 14,
    backgroundColor: '#141414',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 0.5,
    borderColor: '#1e1e1e',
  },
  addNoteInput: { flex: 1, color: colors.textPrimary, fontSize: 12, padding: 0 },
  addNoteBtn: { color: colors.accent, fontSize: 12 },

  // History
  historyList: { gap: 5 },
  historyRow: {
    backgroundColor: '#141414',
    borderRadius: 8,
    paddingHorizontal: 11,
    paddingVertical: 9,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#1e1e1e',
  },
  historyType: { color: '#bbb', fontSize: 12 },
  historyDate: { color: colors.textMuted, fontSize: 10, marginTop: 2 },
  hBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 10 },
  hBadgeText: { fontSize: 10 },
});
