import { createTheme } from '@mui/material/styles';
import { Theme, ThemeOptions } from '@mui/material/styles';

// Define our custom colors
const colors = {
  licorice: '#1c0f13',
  pearl: '#e8dbc5',
  persianGreen: '#339989',
  tigersEye: '#bc6c25',
  crimson: '#DC0F38',
  warmBeige: '#e5cbb8'
};

// Create a theme instance
const theme = createTheme({
  palette: {
    primary: {
      main: colors.persianGreen,
      light: '#4fb3a7',
      dark: '#247c6c',
      contrastText: '#ffffff',
    },
    secondary: {
      main: colors.tigersEye,
      light: '#d1883b',
      dark: '#984f18',
      contrastText: '#ffffff',
    },
    error: {
      main: colors.crimson,
      light: '#e54060',
      dark: '#b00929',
      contrastText: '#ffffff',
    },
    background: {
      default: colors.licorice,
      paper: colors.licorice,
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
      disabled: 'rgba(255, 255, 255, 0.5)',
    },
    // Custom colors
    warmBeige: {
      main: colors.warmBeige,
      contrastText: '#000000',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontFamilyTattoo: '"Tattoo-Font", cursive',
    h1: {
      fontWeight: 500,
      color: '#ffffff',
    },
    h2: {
      fontWeight: 500,
      color: '#ffffff',
    },
    h3: {
      fontWeight: 500,
      color: '#ffffff',
    },
    h4: {
      fontWeight: 500,
      color: '#ffffff',
    },
    h5: {
      fontWeight: 500,
      color: '#ffffff',
    },
    h6: {
      fontWeight: 500,
      color: '#ffffff',
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
          backgroundColor: '#2a1a1e',
          color: '#ffffff',
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

  // Custom palette colors
  interface Palette {
    warmBeige: {
      main: string;
      contrastText: string;
    };
  }

  interface PaletteOptions {
    warmBeige?: {
      main: string;
      contrastText: string;
    };
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

export default theme;