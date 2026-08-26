import React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { colors } from '@/styles/colors';
import { fieldStyles } from './fieldStyles';

export interface ContactDraft {
  phone: string;
  email: string;
  website: string;
}

interface ContactEditorProps {
  value: ContactDraft;
  onChange: (value: ContactDraft) => void;
}

/** How people reach the shop. Every field here is optional. */
const ContactEditor: React.FC<ContactEditorProps> = ({ value, onChange }) => {
  const set = (field: keyof ContactDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: e.target.value });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
        Leave anything blank and it simply will not show on your page.
      </Typography>

      <TextField label="Phone" value={value.phone} onChange={set('phone')} fullWidth size="small" sx={fieldStyles} />
      <TextField label="Email" value={value.email} onChange={set('email')} fullWidth size="small" sx={fieldStyles} />
      <TextField label="Website" placeholder="https://" value={value.website} onChange={set('website')} fullWidth size="small" sx={fieldStyles} />
    </Box>
  );
};

export default ContactEditor;
