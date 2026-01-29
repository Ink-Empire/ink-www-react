import { colors } from '@/styles/colors';

// Text Input Styles
export const inputStyles = {
  '& .MuiOutlinedInput-root': {
    bgcolor: colors.background,
    '& fieldset': { borderColor: `${colors.textPrimary}1A` },
    '&:hover fieldset': { borderColor: `${colors.textPrimary}1A` },
    '&.Mui-focused fieldset': { borderColor: colors.accent }
  },
  '& .MuiInputBase-input': {
    fontSize: '0.95rem',
    color: colors.textPrimary,
    '&::placeholder': { color: colors.textSecondary, opacity: 1 }
  }
};
