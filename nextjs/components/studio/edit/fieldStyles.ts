import { colors } from '@/styles/colors';

/** Shared input styling for the studio editors. */
export const fieldStyles = {
  '& .MuiOutlinedInput-root': {
    bgcolor: colors.background,
    color: colors.textPrimary,
    '& fieldset': { borderColor: colors.border },
    '&:hover fieldset': { borderColor: colors.borderLight },
    '&.Mui-focused fieldset': { borderColor: colors.accent },
  },
  '& .MuiInputLabel-root': { color: colors.textSecondary },
  '& .MuiInputLabel-root.Mui-focused': { color: colors.accent },
};
