import React from 'react';
import { Box, TextField, Typography } from '@mui/material';
import { colors } from '@/styles/colors';
import { fieldStyles } from './fieldStyles';

export interface LocationDraft {
  address: string;
  address2: string;
  city: string;
  state: string;
  postal_code: string;
}

interface LocationEditorProps {
  value: LocationDraft;
  onChange: (value: LocationDraft) => void;
}

/** Where the shop is. This is what shows on the map card and in search. */
const LocationEditor: React.FC<LocationEditorProps> = ({ value, onChange }) => {
  const set = (field: keyof LocationDraft) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...value, [field]: e.target.value });

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Typography sx={{ fontSize: '0.85rem', color: colors.textSecondary }}>
        This is the address people will use to find you.
      </Typography>

      <TextField label="Street address" value={value.address} onChange={set('address')} fullWidth size="small" sx={fieldStyles} />
      <TextField label="Unit or suite (optional)" value={value.address2} onChange={set('address2')} fullWidth size="small" sx={fieldStyles} />

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '2fr 1fr 1fr' }, gap: 2 }}>
        <TextField label="City" value={value.city} onChange={set('city')} size="small" sx={fieldStyles} />
        <TextField label="State" value={value.state} onChange={set('state')} size="small" sx={fieldStyles} />
        <TextField label="Postcode" value={value.postal_code} onChange={set('postal_code')} size="small" sx={fieldStyles} />
      </Box>
    </Box>
  );
};

export default LocationEditor;
