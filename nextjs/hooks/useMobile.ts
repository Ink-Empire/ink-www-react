import { useMediaQuery, useTheme } from '@mui/material';

/**
 * Hook to detect mobile viewport
 * Uses MUI breakpoints - mobile is below 'sm' (600px)
 *
 * This hook is designed to be easily replaced in React Native
 * where it would always return true or use different detection
 */
export function useMobile(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down('sm'));
}

/**
 * Hook to detect tablet viewport
 * Uses MUI breakpoints - tablet is between 'sm' (600px) and 'md' (900px)
 */
export function useTablet(): boolean {
  const theme = useTheme();
  const isAboveSm = useMediaQuery(theme.breakpoints.up('sm'));
  const isBelowMd = useMediaQuery(theme.breakpoints.down('md'));
  return isAboveSm && isBelowMd;
}

/**
 * Hook to get current breakpoint info
 * Useful for conditional rendering based on screen size
 */
export function useBreakpoint() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.only('xs'));
  const isSm = useMediaQuery(theme.breakpoints.only('sm'));
  const isMd = useMediaQuery(theme.breakpoints.only('md'));
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));
  const isXl = useMediaQuery(theme.breakpoints.only('xl'));

  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  return {
    isXs,
    isSm,
    isMd,
    isLg,
    isXl,
    isMobile,
    isTablet,
    isDesktop,
    // Current breakpoint name
    current: isXs ? 'xs' : isSm ? 'sm' : isMd ? 'md' : isLg ? 'lg' : 'xl'
  };
}
