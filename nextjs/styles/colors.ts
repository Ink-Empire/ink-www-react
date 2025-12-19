/**
 * Color System - Single Source of Truth
 *
 * Usage in components:
 *   import { colors } from '@/styles/colors';
 *   <Box sx={{ backgroundColor: colors.primary }} />
 *
 * IMPORTANT: These values must stay in sync with CSS variables in globals.css
 * When changing colors, update both this file AND globals.css :root
 */

export const colors = {
  // Backgrounds
  background: '#0F0F0F',
  surface: '#1A1A1A',
  surfaceElevated: '#242424',
  surfaceHover: '#2a2a2a',

  // Text
  textPrimary: '#F5F4F0',
  textSecondary: '#A3A299',
  textMuted: '#6B6B63',

  // Accent (Gold)
  accent: '#C9A962',
  accentHover: '#E4C675',
  accentDark: '#A88B4A',
  accentDim: 'rgba(201, 169, 98, 0.15)',

  // Status Colors
  success: '#4A9B7F',
  successDim: 'rgba(74, 155, 127, 0.15)',
  error: '#C75D5D',
  warning: '#D4A84B',
  warningDim: 'rgba(212, 168, 75, 0.15)',
  info: '#6B8EAE',
  infoDim: 'rgba(107, 142, 174, 0.15)',

  // Borders
  border: '#2A2A2A',
  borderLight: '#3A3A3A',
  borderSubtle: 'rgba(245, 244, 240, 0.06)',

  // Calendar/Availability (using success green)
  available: '#4A9B7F',
  todayHighlight: '#C9A962',

  // Aliases for common usage
  primary: '#C9A962',
  primaryLight: '#E4C675',
  primaryDark: '#A88B4A',
  secondary: '#A3A299',
  secondaryLight: '#B8B8AE',
  secondaryDark: '#8A8A82',
} as const;

// Type for color keys
export type ColorKey = keyof typeof colors;

// CSS variable names (for reference)
export const cssVars = {
  background: 'var(--background)',
  surface: 'var(--surface)',
  surfaceElevated: 'var(--surface-elevated)',
  surfaceHover: 'var(--surface-hover)',
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  accent: 'var(--accent)',
  accentHover: 'var(--accent-hover)',
  accentDark: 'var(--accent-dark)',
  accentDim: 'var(--accent-dim)',
  success: 'var(--success)',
  successDim: 'var(--success-dim)',
  error: 'var(--error)',
  warning: 'var(--warning)',
  warningDim: 'var(--warning-dim)',
  info: 'var(--info)',
  infoDim: 'var(--info-dim)',
  border: 'var(--border)',
  borderLight: 'var(--border-light)',
  borderSubtle: 'var(--border-subtle)',
  available: 'var(--available)',
  todayHighlight: 'var(--today-highlight)',
  primary: 'var(--primary)',
  primaryLight: 'var(--primary-light)',
  primaryDark: 'var(--primary-dark)',
  secondary: 'var(--secondary)',
  secondaryLight: 'var(--secondary-light)',
  secondaryDark: 'var(--secondary-dark)',
} as const;

export default colors;
