/**
 * Color System - Single Source of Truth for React Native
 * Ported from nextjs/styles/colors.ts
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

  // Tag Color (for subject tags - distinct from styles)
  tag: '#C75D5D',
  tagDim: 'rgba(199, 93, 93, 0.15)',

  // AI Suggestion Color
  aiSuggestion: '#5B8FB9',
  aiSuggestionDim: 'rgba(91, 143, 185, 0.15)',

  // Borders
  border: '#2A2A2A',
  borderLight: '#3A3A3A',
  borderSubtle: 'rgba(245, 244, 240, 0.06)',

  // Input-specific
  inputBorder: '#4A4A4A',
  inputBorderHover: '#5A5A5A',
  inputBackground: '#1A1A1A',

  // Calendar/Availability
  available: '#4A9B7F',
  todayHighlight: '#C9A962',

  // Text on Light Backgrounds
  textOnLight: '#000000',
  backgroundLight: '#ffffff',

  // Aliases
  primary: '#C9A962',
  primaryLight: '#E4C675',
  primaryDark: '#A88B4A',
  secondary: '#A3A299',
  secondaryLight: '#B8B8AE',
  secondaryDark: '#8A8A82',
} as const;

export type ColorKey = keyof typeof colors;

export default colors;
