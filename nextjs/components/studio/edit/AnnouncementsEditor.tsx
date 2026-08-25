import React, { useState } from 'react';
import { Box, Button, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CampaignIcon from '@mui/icons-material/Campaign';
import { colors } from '@/styles/colors';
import { fieldStyles } from './fieldStyles';

export interface AnnouncementDraft {
  id?: number;
  type?: string;
  title: string;
  content: string;
  starts_at?: string | null;
  ends_at?: string | null;
}

interface AnnouncementsEditorProps {
  value: AnnouncementDraft[];
  onChange: (value: AnnouncementDraft[]) => void;
}

/**
 * The kinds a studio can post. Everything except a plain announcement and a
 * walk-in notice also gets a page of its own, which is why those two are
 * described as showing on the page only.
 */
const TYPES = [
  { value: 'general', label: 'Announcement', hint: 'General news' },
  { value: 'flash_drop', label: 'Flash drop', hint: 'New flash available' },
  { value: 'books_open', label: 'Books open', hint: 'You are taking bookings' },
  { value: 'guest_spot', label: 'Guest spot', hint: 'A visiting artist' },
  { value: 'travel', label: 'Travel dates', hint: 'You are working elsewhere' },
  { value: 'walk_ins', label: 'Walk-ins', hint: 'Open for walk-ins, shows on the page only' },
];

const emptyDraft: AnnouncementDraft = {
  type: 'general',
  title: '',
  content: '',
  starts_at: '',
  ends_at: '',
};

/** Studio news. New entries and deletions are applied on Publish. */
const AnnouncementsEditor: React.FC<AnnouncementsEditorProps> = ({ value, onChange }) => {
  const [draft, setDraft] = useState<AnnouncementDraft>(emptyDraft);

  const set = (field: keyof AnnouncementDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((current) => ({ ...current, [field]: e.target.value }));

  const canSave = draft.title.trim() !== '' && draft.content.trim() !== '';

  const save = () => {
    if (!canSave) return;

    onChange([
      {
        type: draft.type || 'general',
        title: draft.title.trim(),
        content: draft.content.trim(),
        starts_at: draft.starts_at || null,
        ends_at: draft.ends_at || null,
      },
      ...value,
    ]);

    setDraft(emptyDraft);
  };

  const labelFor = (type?: string) =>
    TYPES.find((option) => option.value === type)?.label || 'Announcement';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
        Tell visitors what is happening. Flash days, open books, guest artists.
      </Typography>

      <TextField
        select
        label="Kind"
        value={draft.type}
        onChange={set('type')}
        fullWidth
        size="small"
        sx={fieldStyles}
      >
        {TYPES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label} — {option.hint}
          </MenuItem>
        ))}
      </TextField>

      <TextField label="Title" placeholder="Books open March 1" value={draft.title}
        onChange={set('title')} fullWidth size="small" sx={fieldStyles} />

      <TextField label="Details" placeholder="Add the detail people need, like dates or how to book."
        value={draft.content} onChange={set('content')} fullWidth multiline rows={3} sx={fieldStyles} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        <TextField
          label="Show from (optional)"
          type="date"
          value={draft.starts_at || ''}
          onChange={set('starts_at')}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={fieldStyles}
        />
        <TextField
          label="Stop showing (optional)"
          type="date"
          value={draft.ends_at || ''}
          onChange={set('ends_at')}
          size="small"
          InputLabelProps={{ shrink: true }}
          sx={fieldStyles}
        />
      </Box>

      <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary, mt: -1 }}>
        Leave the dates blank to show it until you delete it. After the end date
        it comes off your page but keeps its own link.
      </Typography>

      <Button
        onClick={save}
        disabled={!canSave}
        startIcon={<CampaignIcon sx={{ fontSize: 18 }} />}
        sx={{
          alignSelf: 'flex-start',
          bgcolor: colors.accent,
          color: colors.background,
          textTransform: 'none',
          '&:hover': { bgcolor: colors.accent, opacity: 0.9 },
          '&.Mui-disabled': { bgcolor: colors.border, color: colors.textMuted },
        }}
      >
        Save
      </Button>

      {value.length > 0 && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {value.map((item, index) => (
            <Box
              key={item.id ?? `new-${index}`}
              sx={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 1,
                p: 1.5,
                borderRadius: '8px',
                bgcolor: colors.background,
                border: `1px solid ${colors.border}`,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.75rem', color: colors.accent, mb: 0.25 }}>
                  {labelFor(item.type)}
                  {item.ends_at ? ` · until ${item.ends_at}` : ''}
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
                  {item.title}
                  {!item.id && (
                    <Box component="span" sx={{ ml: 1, fontSize: '0.75rem', color: colors.accent }}>
                      not published yet
                    </Box>
                  )}
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                  {item.content}
                </Typography>
              </Box>
              <IconButton
                onClick={() => onChange(value.filter((_, i) => i !== index))}
                size="small"
                sx={{ color: colors.textSecondary }}
              >
                <DeleteIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default AnnouncementsEditor;
