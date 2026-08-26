import React, { useState } from 'react';
import { Box, Button, Checkbox, FormControlLabel, IconButton, MenuItem, TextField, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { colors } from '@/styles/colors';
import { fieldStyles } from './fieldStyles';

export interface GuideDraft {
  id?: number;
  type?: string;
  slug?: string;
  url?: string;
  title: string;
  excerpt?: string;
  content: string;
  is_default?: boolean;
}

interface GuidesEditorProps {
  value: GuideDraft[];
  onChange: (value: GuideDraft[]) => void;
}

const TYPES = [
  { value: 'aftercare', label: 'Aftercare', hint: 'Looking after a healing tattoo' },
  { value: 'prep', label: 'Preparation', hint: 'How to get ready for an appointment' },
  { value: 'article', label: 'General', hint: 'Anything else you want to write' },
];

/** Only an aftercare guide can be the one sent after an appointment. */
const canBeDefault = (type?: string) => type === 'aftercare';

const emptyDraft: GuideDraft = {
  type: 'aftercare',
  title: '',
  excerpt: '',
  content: '',
  is_default: false,
};

/**
 * Practical writing a studio only has to do once. Aftercare and preparation
 * are named because they are what most studios write, but General covers
 * anything else and renders identically.
 *
 * An aftercare guide can be marked as the one sent to clients after their
 * appointment, so nobody retypes healing instructions into a chat.
 */
const GuidesEditor: React.FC<GuidesEditorProps> = ({ value, onChange }) => {
  const [draft, setDraft] = useState<GuideDraft>(emptyDraft);

  const set = (field: keyof GuideDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setDraft((current) => {
      const next = { ...current, [field]: e.target.value };

      return field === 'type' && !canBeDefault(next.type)
        ? { ...next, is_default: false }
        : next;
    });

  const canSave = draft.title.trim() !== '' && draft.content.trim() !== '';

  const save = () => {
    if (!canSave) return;

    const next = [
      {
        type: draft.type || 'aftercare',
        title: draft.title.trim(),
        excerpt: draft.excerpt?.trim() || '',
        content: draft.content.trim(),
        is_default: Boolean(draft.is_default),
      },
      ...value,
    ];

    // Only one guide is sent after an appointment.
    onChange(draft.is_default
      ? next.map((guide, index) => ({ ...guide, is_default: index === 0 }))
      : next);

    setDraft(emptyDraft);
  };

  const setDefault = (index: number) =>
    onChange(value.map((guide, i) => ({ ...guide, is_default: i === index })));

  const labelFor = (type?: string) => TYPES.find((t) => t.value === type)?.label || 'General';

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
        Write this once and reuse it. Your aftercare guide can be sent straight
        to a client from your messages.
      </Typography>

      <TextField select label="Kind" value={draft.type} onChange={set('type')} fullWidth size="small" sx={fieldStyles}>
        {TYPES.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label} — {option.hint}
          </MenuItem>
        ))}
      </TextField>

      <TextField label="Title" placeholder="Healing your new tattoo" value={draft.title}
        onChange={set('title')} fullWidth size="small" sx={fieldStyles} />

      <TextField label="Short summary (optional)" placeholder="What to do for the first two weeks."
        value={draft.excerpt} onChange={set('excerpt')} fullWidth size="small" sx={fieldStyles} />

      <TextField label="The guide" placeholder="Write it the way you would explain it in the chair."
        value={draft.content} onChange={set('content')} fullWidth multiline rows={8} sx={fieldStyles} />

      {canBeDefault(draft.type) && (
        <FormControlLabel
          control={
            <Checkbox
              checked={Boolean(draft.is_default)}
              onChange={(e) => setDraft((current) => ({ ...current, is_default: e.target.checked }))}
              sx={{ color: colors.border, '&.Mui-checked': { color: colors.accent } }}
            />
          }
          label={
            <Typography sx={{ fontSize: '0.9rem', color: colors.textSecondary }}>
              Send this one to clients after their appointment
            </Typography>
          }
        />
      )}

      <Button
        onClick={save}
        disabled={!canSave}
        startIcon={<MenuBookIcon sx={{ fontSize: 18 }} />}
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
                border: `1px solid ${item.is_default ? colors.accent : colors.border}`,
              }}
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography sx={{ fontSize: '0.75rem', color: colors.accent, mb: 0.25 }}>
                  {labelFor(item.type)}
                  {item.is_default ? ' · sent after appointments' : ''}
                </Typography>
                <Typography sx={{ fontSize: '0.9rem', color: colors.textPrimary }}>
                  {item.title}
                  {!item.id && (
                    <Box component="span" sx={{ ml: 1, fontSize: '0.75rem', color: colors.accent }}>
                      not published yet
                    </Box>
                  )}
                </Typography>
                <Typography noWrap sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
                  {item.excerpt || item.content}
                </Typography>

                {canBeDefault(item.type) && !item.is_default && (
                  <Button
                    onClick={() => setDefault(index)}
                    size="small"
                    sx={{ mt: 0.5, ml: -0.75, color: colors.textSecondary, textTransform: 'none' }}
                  >
                    Send this one after appointments
                  </Button>
                )}
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

export default GuidesEditor;
