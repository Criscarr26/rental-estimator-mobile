import '@/global.css';

import { Platform } from 'react-native';

// Fixed dark palette, consistent with the Streamlit SaaS version of the estimator.
export const Palette = {
  background: '#0F172A',
  card: '#1E293B',
  cardSelected: '#27364F',
  border: '#334155',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  accent: '#38BDF8',
  accentText: '#0B1220',
  success: '#34D399',
  danger: '#F87171',
} as const;

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
