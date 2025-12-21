import { createTheme } from '@mui/material/styles';
import { Theme, ThemeOptions } from '@mui/material/styles';
import { colors } from './colors';

// Extend MUI theme typography to include custom fontFamilyTattoo
declare module '@mui/material/styles' {
  interface TypographyVariants {
    fontFamilyTattoo: string;
  }
  interface TypographyVariantsOptions {
    fontFamilyTattoo?: string;
  }
}

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary,
      light: colors.primaryLight,
      dark: colors.primaryDark,
      contrastText: colors.background,
    },
    secondary: {
      main: colors.secondary,
      light: colors.secondaryLight,
      dark: colors.secondaryDark,
      contrastText: colors.background,
    },
    error: {
      main: colors.error,
      contrastText: colors.textPrimary,
    },
    warning: {
      main: colors.warning,
      contrastText: colors.background,
    },
    success: {
      main: colors.success,
      contrastText: colors.textPrimary,
    },
    info: {
      main: colors.info,
      contrastText: colors.textPrimary,
    },
    background: {
      default: colors.background,
      paper: colors.surface,
    },
    text: {
      primary: colors.textPrimary,
      secondary: colors.textSecondary,
      disabled: colors.textMuted,
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontFamilyTattoo: '"Tattoo-Font", cursive',
    h1: {
      fontWeight: 500,
      color: colors.textPrimary,
    },
    h2: {
      fontWeight: 500,
      color: colors.textPrimary,
    },
    h3: {
      fontWeight: 500,
      color: colors.textPrimary,
    },
    h4: {
      fontWeight: 500,
      color: colors.textPrimary,
    },
    h5: {
      fontWeight: 500,
      color: colors.textPrimary,
    },
    h6: {
      fontWeight: 500,
      color: colors.textPrimary,
    },
    button: {
      textTransform: 'none',
      fontWeight: 500,
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
        contained: {
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.15)',
          backgroundColor: colors.surface,
          color: colors.textPrimary,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          textTransform: 'none',
        },
      },
    },
  },
});

// Declare module augmentation for custom variants
declare module '@mui/material/styles' {
  interface TypographyVariants {
    tattoo: React.CSSProperties;
  }

  // allow configuration using `createTheme`
  interface TypographyVariantsOptions {
    tattoo?: React.CSSProperties;
  }
}

// Update the Typography's variant prop options
declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    tattoo: true;
  }
}

// Apply the new variant
theme.typography.tattoo = {
  fontFamily: theme.typography.fontFamilyTattoo,
  fontSize: '1.5rem',
  [theme.breakpoints.up('md')]: {
    fontSize: '2rem',
  },
};

// Re-export colors for convenience
export { colors } from './colors';
export default theme;