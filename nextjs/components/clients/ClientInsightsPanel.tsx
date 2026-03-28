import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Avatar,
  Chip,
  TextField,
  Button,
  IconButton,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import { colors } from '@/styles/colors';
import { clientInsightsService } from '@/services/clientInsightsService';
import type {
  ClientProfile,
  TagGroup,
  ClientNote,
  ClientAppointmentHistory,
  UserTagCategory,
} from '@inkedin/shared/types';

const TAG_COLORS: Record<string, { bg: string; text: string }> = {
  teal: { bg: colors.tagLikesBg, text: colors.tagLikes },
  coral: { bg: colors.tagAvoidBg, text: colors.tagAvoid },
  purple: { bg: colors.tagPersonalityBg, text: colors.tagPersonality },
  amber: { bg: colors.tagNotesBg, text: colors.tagNotes },
};

const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  done: { bg: colors.tagLikesBg, text: colors.tagLikes },
  upcoming: { bg: colors.tagPersonalityBg, text: colors.tagPersonality },
  booked: { bg: colors.tagPersonalityBg, text: colors.tagPersonality },
  cancelled: { bg: colors.tagAvoidBg, text: colors.tagAvoid },
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

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface ClientInsightsPanelProps {
  clientId: number;
  onClose?: () => void;
  compact?: boolean;
}

export default function ClientInsightsPanel({ clientId, onClose, compact }: ClientInsightsPanelProps) {
  const [profile, setProfile] = useState<ClientProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [addingTag, setAddingTag] = useState(false);
  const [tagText, setTagText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<UserTagCategory | null>(null);
  const [categories, setCategories] = useState<UserTagCategory[]>([]);
  const [savingTag, setSavingTag] = useState(false);
  const prevClientId = useRef(clientId);

  const fetchProfile = useCallback(async () => {
    try {
      setError(null);
      const response = await clientInsightsService.getProfile(clientId);
      setProfile(response.profile);
    } catch (err: any) {
      setError(err.message || 'Failed to load client profile');
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    if (clientId !== prevClientId.current) {
      setLoading(true);
      setProfile(null);
      prevClientId.current = clientId;
    }
    fetchProfile();
  }, [fetchProfile, clientId]);

  const handleAddNote = useCallback(async () => {
    if (!noteText.trim() || savingNote) return;
    setSavingNote(true);
    try {
      const response = await clientInsightsService.addNote(clientId, noteText.trim());
      setProfile(prev =>
        prev ? { ...prev, notes: [response.note, ...prev.notes] } : prev,
      );
      setNoteText('');
    } catch {
      // silently fail
    } finally {
      setSavingNote(false);
    }
  }, [clientId, noteText, savingNote]);

  const handleOpenTagForm = async () => {
    setAddingTag(true);
    try {
      const response = await clientInsightsService.getTagCategories();
      setCategories(response.categories);
    } catch {
      // silently fail
    }
  };

  const handleAddTag = async () => {
    if (!selectedCategory || !tagText.trim() || savingTag) return;
    setSavingTag(true);
    try {
      await clientInsightsService.addTag(clientId, selectedCategory.id, tagText.trim());
      await fetchProfile();
      setTagText('');
      setSelectedCategory(null);
      setAddingTag(false);
    } catch {
      // silently fail
    } finally {
      setSavingTag(false);
    }
  };

  const handleRemoveTag = async (tagId: number) => {
    try {
      await clientInsightsService.removeTag(clientId, tagId);
      await fetchProfile();
    } catch {
      // silently fail
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
        <CircularProgress size={32} sx={{ color: colors.accent }} />
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
        <Typography sx={{ color: colors.error, fontSize: '0.875rem' }}>
          {error || 'Client not found'}
        </Typography>
      </Box>
    );
  }

  const { client, stats, tags, notes, history } = profile;
  const sinceDate = new Date(client.created_at);
  const sinceStr = sinceDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: colors.background }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2.5,
        py: 2,
        borderBottom: `1px solid ${colors.border}`,
      }}>
        <Avatar sx={{
          width: 44,
          height: 44,
          bgcolor: `${colors.accent}26`,
          color: colors.accent,
          fontSize: '0.9rem',
          fontWeight: 600,
          border: `1.5px solid ${colors.accent}40`,
        }}>
          {getInitials(client.name)}
        </Avatar>
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontWeight: 500, color: colors.textPrimary, fontSize: '1rem' }}>
            {client.name}
          </Typography>
          <Typography sx={{ color: colors.textMuted, fontSize: '0.75rem' }}>
            Client since {sinceStr}
          </Typography>
        </Box>
        {onClose && (
          <IconButton onClick={onClose} size="small" sx={{ color: colors.textMuted }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </Box>

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflowY: 'auto', px: 2.5, py: 2 }}>
        {/* Stats */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, mb: 2.5 }}>
          <StatBox value={String(stats.sessions)} label="sessions" />
          <StatBox value={`$${Math.round(stats.total_spent)}`} label="total spent" />
          <StatBox value={`${stats.hours_in_chair} hrs`} label="in chair" />
          <StatBox
            value={stats.next_appointment ? formatShortDate(stats.next_appointment) : '\u2014'}
            label="next appt"
          />
        </Box>

        <Divider />

        {/* Tags */}
        <SectionHeader
          title="Tags"
          action={
            !addingTag ? (
              <Typography
                onClick={handleOpenTagForm}
                sx={{ color: colors.accent, fontSize: '0.75rem', cursor: 'pointer', '&:hover': { opacity: 0.8 } }}
              >
                + add
              </Typography>
            ) : null
          }
        />

        {addingTag && (
          <Box sx={{ mb: 2, p: 1.5, bgcolor: colors.surface, borderRadius: '8px', border: `1px solid ${colors.border}` }}>
            <TextField
              value={tagText}
              onChange={e => setTagText(e.target.value)}
              placeholder="Type a tag..."
              size="small"
              fullWidth
              sx={{
                mb: 1,
                '& .MuiOutlinedInput-root': {
                  color: colors.textPrimary,
                  fontSize: '0.8rem',
                  bgcolor: colors.background,
                  '& fieldset': { borderColor: selectedCategory ? `${TAG_COLORS[selectedCategory.color]?.text}40` : colors.border },
                },
              }}
            />
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
              {categories.map(cat => {
                const isSelected = selectedCategory?.id === cat.id;
                const catColor = TAG_COLORS[cat.color] || TAG_COLORS.teal;
                return (
                  <Chip
                    key={cat.id}
                    label={cat.name}
                    size="small"
                    onClick={() => setSelectedCategory(cat)}
                    sx={{
                      fontSize: '0.7rem',
                      bgcolor: isSelected ? catColor.bg : 'transparent',
                      color: isSelected ? catColor.text : colors.textMuted,
                      border: `1px solid ${isSelected ? catColor.text + '40' : colors.border}`,
                      '&:hover': { bgcolor: catColor.bg },
                    }}
                  />
                );
              })}
            </Box>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                onClick={handleAddTag}
                disabled={!selectedCategory || !tagText.trim() || savingTag}
                size="small"
                sx={{
                  bgcolor: colors.accent,
                  color: colors.textOnLight,
                  fontSize: '0.75rem',
                  textTransform: 'none',
                  '&:hover': { bgcolor: colors.accentHover },
                  '&:disabled': { opacity: 0.4, bgcolor: colors.accent },
                }}
              >
                {savingTag ? 'Adding...' : 'Add'}
              </Button>
              <Button
                onClick={() => { setAddingTag(false); setTagText(''); setSelectedCategory(null); }}
                size="small"
                sx={{ color: colors.textMuted, fontSize: '0.75rem', textTransform: 'none' }}
              >
                Cancel
              </Button>
            </Box>
          </Box>
        )}

        {tags.length > 0 ? (
          tags.map((group: TagGroup) => {
            const c = TAG_COLORS[group.category.color] || TAG_COLORS.teal;
            return (
              <Box key={group.category.id} sx={{ mb: 1.5 }}>
                <Typography sx={{
                  color: colors.textMuted,
                  fontSize: '0.625rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  mb: 0.75,
                }}>
                  {group.category.name}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {group.tags.map(tag => (
                    <Chip
                      key={tag.id}
                      label={tag.label}
                      size="small"
                      onDelete={() => handleRemoveTag(tag.id)}
                      deleteIcon={<CloseIcon sx={{ fontSize: 12, color: `${c.text} !important` }} />}
                      sx={{
                        fontSize: '0.7rem',
                        bgcolor: c.bg,
                        color: c.text,
                        border: `0.5px solid ${c.text}30`,
                        '& .MuiChip-deleteIcon': { opacity: 0.6, '&:hover': { opacity: 1 } },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            );
          })
        ) : (
          <Typography sx={{ color: colors.textMuted, fontSize: '0.75rem', mb: 2 }}>
            No tags yet
          </Typography>
        )}

        <Divider />

        {/* Notes */}
        <SectionHeader title="Artist notes" />

        <Box sx={{
          mb: 2,
          display: 'flex',
          gap: 1,
          alignItems: 'flex-start',
        }}>
          <TextField
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            placeholder="Note from today's session..."
            size="small"
            multiline
            maxRows={3}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                color: colors.textPrimary,
                fontSize: '0.8rem',
                bgcolor: colors.surface,
                '& fieldset': { borderColor: colors.border },
                '&:hover fieldset': { borderColor: colors.borderLight },
                '&.Mui-focused fieldset': { borderColor: colors.accent },
              },
            }}
          />
          <Button
            onClick={handleAddNote}
            disabled={!noteText.trim() || savingNote}
            size="small"
            sx={{
              minWidth: 'auto',
              px: 2,
              py: 1,
              color: colors.accent,
              fontSize: '0.75rem',
              textTransform: 'none',
              '&:disabled': { opacity: 0.4 },
            }}
          >
            {savingNote ? '...' : 'Save'}
          </Button>
        </Box>

        {notes.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, mb: 2.5 }}>
            {notes.map((note: ClientNote) => (
              <Box key={note.id} sx={{
                bgcolor: colors.surface,
                borderRadius: '6px',
                borderLeft: `2px solid ${colors.accent}40`,
                p: 1.25,
                pl: 1.5,
              }}>
                <Typography sx={{ color: colors.textSecondary, fontSize: '0.8rem', lineHeight: 1.5 }}>
                  {note.body}
                </Typography>
                <Typography sx={{ color: colors.textMuted, fontSize: '0.625rem', mt: 0.5 }}>
                  {formatDate(note.created_at)}
                  {note.source === 'appointment' && note.appointment_title
                    ? ` \u00B7 ${note.appointment_title}`
                    : ''}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography sx={{ color: colors.textMuted, fontSize: '0.75rem', mb: 2 }}>
            No notes yet
          </Typography>
        )}

        <Divider />

        {/* History */}
        <SectionHeader title="History" />

        {history.length > 0 ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
            {history.map((appt: ClientAppointmentHistory) => {
              const badge = BADGE_STYLES[appt.status] || BADGE_STYLES.done;
              const duration = formatDuration(appt.duration_minutes);
              return (
                <Box key={appt.id} sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  bgcolor: colors.surface,
                  borderRadius: '8px',
                  px: 1.5,
                  py: 1,
                  border: `0.5px solid ${colors.border}`,
                }}>
                  <Box>
                    <Typography sx={{ color: colors.textSecondary, fontSize: '0.8rem' }}>
                      {appt.type === 'consultation' ? 'Consultation' : 'Tattoo'}
                    </Typography>
                    <Typography sx={{ color: colors.textMuted, fontSize: '0.625rem', mt: 0.25 }}>
                      {formatShortDate(appt.date)}{duration ? ` \u00B7 ${duration}` : ''}
                    </Typography>
                  </Box>
                  <Box sx={{
                    bgcolor: badge.bg,
                    px: 1,
                    py: 0.25,
                    borderRadius: '10px',
                  }}>
                    <Typography sx={{ color: badge.text, fontSize: '0.625rem' }}>
                      {appt.status}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Box>
        ) : (
          <Typography sx={{ color: colors.textMuted, fontSize: '0.75rem' }}>
            No appointment history
          </Typography>
        )}
      </Box>
    </Box>
  );
}

function StatBox({ value, label }: { value: string; label: string }) {
  return (
    <Box sx={{
      bgcolor: colors.surface,
      borderRadius: '8px',
      p: 1.25,
      border: `0.5px solid ${colors.border}`,
    }}>
      <Typography sx={{ color: colors.accent, fontSize: '0.9rem', fontWeight: 500 }}>
        {value}
      </Typography>
      <Typography sx={{ color: colors.textMuted, fontSize: '0.625rem', mt: 0.25 }}>
        {label}
      </Typography>
    </Box>
  );
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Box sx={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      mb: 1.25,
    }}>
      <Typography sx={{
        color: colors.textMuted,
        fontSize: '0.625rem',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
      }}>
        {title}
      </Typography>
      {action}
    </Box>
  );
}

function Divider() {
  return <Box sx={{ height: '0.5px', bgcolor: colors.border, my: 2 }} />;
}
