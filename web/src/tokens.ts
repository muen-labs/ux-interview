/** Claire Design Tokens — single source of truth
 *
 * COLORS references CSS custom properties (--color-*, defined in App.tsx
 * under :root and [data-theme="dark"]) so theme changes react automatically.
 * COLORS_DARK is kept for programmatic reference only.
 */

export const COLORS = {
 // Brand
 primary: 'var(--color-primary)',
 primaryHover: 'var(--color-primary-hover)',
 primaryBg: 'var(--color-primary-bg)',
 secondary: 'var(--color-secondary)',
 secondaryHover: 'var(--color-secondary-hover)',
 tertiary: 'var(--color-tertiary)',
 tertiaryHover: 'var(--color-tertiary-hover)',

 // Backgrounds
 bg: 'var(--color-bg)',
 card: 'var(--color-card)',
 white: 'var(--color-white)',
 overlay: 'var(--color-overlay)',

 // Gradients
 gradientBg: 'var(--gradient-bg)',

 // Text
 text: 'var(--color-text)',
 textSecondary: 'var(--color-text-secondary)',
 textMuted: 'var(--color-text-muted)',

 // Borders
 border: 'var(--color-border)',
 borderLight: 'var(--color-border-light)',
 borderLightest: 'var(--color-border-lightest)',

 // Error
 error: 'var(--color-error)',
 errorBg: 'var(--color-error-bg)',
 errorBorder: '#e8b4b4',

 // Success
 success: 'var(--color-success)',
 successBg: 'var(--color-success-bg)',

 // Info / neutral callout
 info: 'var(--color-info)',
 infoBg: 'var(--color-info-bg)',

 // Badge / tag colors (solid bg, white text) - candy shop palette via
 // --color-badge-* (themeVars), kept separate from the dataviz chart tokens
 // so badges keep their candy identity across the rebrand.
 badgePink: 'var(--color-badge-pink)',
 badgePurple: 'var(--color-badge-purple)',
 badgeOrange: 'var(--color-badge-orange)',
 badgeTeal: 'var(--color-badge-teal)',
} as const

/** Dark mode palette — harmonized with brand #7C8CFF blue */
export const COLORS_DARK = {
  // Brand
  primary: '#7C8CFF',
  primaryHover: '#6B7BFF',
  primaryBg: '#1A1F3A',
  secondary: '#52d053',
  secondaryHover: '#6ede63',
  tertiary: '#c62a3e',
  tertiaryHover: '#e0462c',

  // Backgrounds
  bg: '#121212',
  card: '#1e1e1e',
  white: '#1e1e1e',
  overlay: 'rgba(0,0,0,0.7)',

  // Gradients
  gradientBg: 'linear-gradient(135deg, #7C8CFF 0%, #FAA0A0 100%)',

  // Text
  text: '#e8e8e8',
  textSecondary: '#a0a0a0',
  textMuted: '#666666',

  // Borders
  border: '#333333',
  borderLight: '#444444',
  borderLightest: '#2a2a2a',

  // Error
  error: '#FF5252',
  errorBg: '#2c1515',
  errorBorder: '#4a2020',

  // Success
  success: '#4CAF50',
  successBg: '#1a2e1a',

  // Info / neutral callout
  info: '#64B5F6',
  infoBg: '#0d2137',

  // Badge / tag colors (solid bg, white text) - same --color-badge-* mapping
  // as light; badge candy tones are constant across themes.
  badgePink: 'var(--color-badge-pink)',
  badgePurple: 'var(--color-badge-purple)',
  badgeOrange: 'var(--color-badge-orange)',
  badgeTeal: 'var(--color-badge-teal)',
} as const

/** Text & icon color tokens — semantic names matching Material emphasis levels.
 * References COLORS CSS variables so dark mode theming works automatically.
 *
 * Font weight conventions:
 *   400 — Default for all labels, body text, menu items, descriptions
 *   500 — Emphasis (active items, section titles, headings, key stats)
 *   600 — Strong emphasis (card titles, column headers, prominent labels)
 *   Avoid fontWeight >600 — use bold/heading tokens for display text instead. */
export const TEXT = {
  /** Primary text / active icons (~87% black/white) */
  primary: COLORS.text,
  /** Secondary text / inactive icons (~60%) */
  secondary: COLORS.textSecondary,
  /** Disabled text / muted icons (~38%) */
  disabled: COLORS.textMuted,
  /** Brand accent text */
  brand: COLORS.primary,
  /** Inverse text on dark backgrounds */
  inverse: '#ffffff',
  /** Error / destructive text */
  error: COLORS.error,
  /** Success / positive text */
  success: COLORS.success,
} as const

export const SPACING = {
 xs: '0.25rem',
 sm: '0.35rem',
 md: '0.5rem',
 lg: '0.75rem',
 xl: '1rem',
 xxl: '1.5rem',
} as const

/** Pixel-based spacing for component-level sizing (chips, icon buttons, etc.).
 * For layout padding/margin, prefer the rem-based SPACING above. */
export const SPACING_PX = {
 xxs: 4,
 xs: 6,
 sm: 8,
 md: 10,
 lg: 12,
} as const

export const RADIUS = {
 /** 6px — small elements: chips, badges, tags */
 xs: 6,
 /** 8px — cards, buttons, inputs */
 sm: 8,
 /** 12px — large cards, modals */
 md: 12,
 /** 16px — very large containers */
 lg: 16,
 /** 16px — alias for lg */
 xl: 16,
 /** 999px — fully rounded (pills, circles) */
 full: 999,
} as const

export const SIZE = {
 btnSm: 28,
 btnMd: 40,
 btnLg: 48,
} as const

export const FONT = {
 xxs: '0.65rem',
 xs: '0.75rem',
 sm: '0.85rem',
 md: '0.95rem',
 lg: '1.125rem',
 xl: '1.25rem',
 h6: '1.35rem',
 h5: '1.8rem',
} as const

export const TYPOGRAPHY = {
 sm: { fontSize: '0.85rem', fontWeight: 400, lineHeight: 1.5 },
 md: { fontSize: '0.95rem', fontWeight: 400, lineHeight: 1.5 },
 lg: { fontSize: '1.125rem', fontWeight: 400, lineHeight: 1.5 },
 xl: { fontSize: '1.25rem', fontWeight: 400, lineHeight: 1.5 },
 h6: { fontSize: '1.35rem', fontWeight: 500, lineHeight: 1.3 },
 h5: { fontSize: '1.8rem', fontWeight: 600, lineHeight: 1.3 },
 /** Section label — small uppercase with tracking. Use with COLORS.textMuted. */
 eyebrow: { fontSize: '0.75rem', fontWeight: 600, lineHeight: 1.3, letterSpacing: '0.04em', textTransform: 'uppercase' },
} as const

/** Chip component sizing tokens */
export const CHIP = {
 height: {
  sm: 22,
  md: 28,
 },
} as const

/** Gap tokens for flex/grid layouts (pixel-based) */
export const GAP = {
 xs: 2,
 sm: 4,
 md: 6,
 lg: 8,
} as const

export const SIDE_NAV_WIDTH = 56 as const

/** Resolution badge colors - candy shop palette via --color-badge-* tokens
 * (unchanged by the dataviz rebrand; badges are NOT chart series). */
export const RESO_BADGE: Record<string, { bg: string; text: string }> = {
  '2K': { bg: 'var(--color-badge-purple)', text: '#fff' },
  '3K': { bg: 'var(--color-badge-orange)', text: '#fff' },
  '4K': { bg: 'var(--color-badge-pink)', text: '#fff' },
  '6K': { bg: 'var(--color-badge-teal)', text: '#fff' },
}

/** Get badge label from the longest edge. */
export function resoLabel(long: number): string {
  if (long >= 6000) return '6K'
  if (long >= 3800) return '4K'
  if (long >= 2800) return '3K'
  if (long >= 2000) return '2K'
  return `${long}px`
}

/** Short resolution string like "3840px". */
export function resoShort(long: number): string {
  if (long >= 6000) return '6048px'
  if (long >= 3800) return '3840px'
  if (long >= 2800) return '2880px'
  if (long >= 2000) return '2160px'
  return `${long}px`
}
