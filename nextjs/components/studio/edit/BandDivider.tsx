import React from 'react';
import { Box, Typography } from '@mui/material';
import { colors } from '@/styles/colors';

interface BandDividerProps {
  title: string;
  hint: string;
}

/**
 * Marks where a visitor's page folds, without folding the editor.
 *
 * The editor shows every section at once - an owner should never have to hunt
 * behind a tab for something they are trying to edit - but the fold is real,
 * and a section below one of these dividers is a click away for a visitor
 * rather than on screen. Preview swaps these back for the actual tabs.
 */
const BandDivider: React.FC<BandDividerProps> = ({ title, hint }) => (
  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 5, mb: 3 }}>
    <Box sx={{ flexShrink: 0 }}>
      <Typography sx={{
        fontSize: '0.7rem',
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: colors.accent,
      }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: '0.8rem', color: colors.textSecondary }}>
        {hint}
      </Typography>
    </Box>

    <Box sx={{ flex: 1, height: '1px', bgcolor: colors.border }} />
  </Box>
);

export default BandDivider;
