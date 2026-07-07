import '@/global.css';

import { Platform } from 'react-native';

// Fixed dark palette: deep navy background with a cyan-to-indigo accent.
export const Palette = {
  background: '#0B1121',
  card: '#141D33',
  cardSelected: '#1C2A4A',
  border: '#243252',
  text: '#F1F5F9',
  textSecondary: '#8FA3C4',
  accent: '#38BDF8',
  accentAlt: '#818CF8',
  accentText: '#071018',
  success: '#34D399',
  danger: '#FB7185',
} as const;

export const CtaGradient = ['#38BDF8', '#818CF8'] as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
} as const;
