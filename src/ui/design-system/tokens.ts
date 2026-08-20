/**
 * Design Tokens for Workout PWA
 * Aesthetic: Focused, calm, technical, athletic, human, minimal.
 * Avoids aggressive saturation, excessive rounded corners, or generic gradients.
 */

export const tokens = {
  colors: {
    bg: '#0a0a0a',
    surface: '#171717',
    surfaceSubtle: '#262626',
    border: '#2a2a2a',
    borderSubtle: '#1f1f1f',
    textPrimary: '#fafafa',
    textSecondary: '#a3a3a3',
    textMuted: '#737373',
    accent: '#ffffff',
    accentHover: '#e5e5e5',
    activeGlow: 'rgba(255, 255, 255, 0.08)',
  },
  radii: {
    base: 'rounded-xl', // 12px
    inner: 'rounded-lg', // 8px
    pill: 'rounded-full',
  },
  typography: {
    fontDisplay: 'tracking-tight font-semibold',
    fontBody: 'leading-relaxed',
  },
} as const;
