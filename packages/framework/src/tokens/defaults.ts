import type { ThemeTokens } from './contract'

/**
 * Sane default values for every theme-token slot (DOC-7 §4 / REQ-4 superset).
 * A neutral palette, system fonts, and a standard scale. Used by the CSS
 * generator to fill any slot a site omits, so generated CSS always declares the
 * full custom-property surface regardless of how sparse the site's theme is.
 */
export const defaultTokens: ThemeTokens = {
  palette: {
    bg: '#ffffff',
    surface: '#f9fafb',
    surfaceSubtle: '#f3f4f6',
    surfaceInverse: '#111827',
    text: '#111827',
    muted: '#6b7280',
    primary: '#2563eb',
    accent: '#f59e0b',
    secondary: '#3b82f6',
    neutralCool: '#64748b',
    // Warm companions to `accent` (REQ-33): a lighter and a deeper amber, so the
    // `--color-accent-light` / `--color-accent-deep` custom properties are always
    // declared even when a site omits them.
    accentLight: '#fcd34d',
    accentDeep: '#b45309',
    // Hero legibility scrim (REQ-36) — a near-black so the `scrim` dial darkens a
    // background image for text contrast, independent of `surfaceInverse` (which
    // a theme may set to a mid neutral). A site can override for a tinted scrim.
    scrim: '#0a0a0a',
    border: '#e5e7eb',
  },
  typography: {
    family: {
      heading: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
      body: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
    },
    scale: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
      '5xl': '3rem',
    },
    weights: {
      // `extralight` (200, REQ-36) backs the `headingWeight` dial's lightest step
      // — the joyfulculinary section headings are Oswald 200 (extralight).
      extralight: '200',
      // `light` (300, REQ-49) backs the hero `subheadWeight` dial's lighter step
      // — a delicate lead weight (e.g. gigabytealchemy's `font-light` subhead).
      light: '300',
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },
    lineHeights: {
      tight: '1.1',
      // `snug` (~1.33, REQ-49) sits between `tight` and `normal` for the hero
      // `subheadLeading` dial's intermediate step.
      snug: '1.33',
      normal: '1.5',
      relaxed: '1.75',
    },
    // Letter-spacing (tracking) steps for the `tracking` treatment (REQ-45),
    // em-based so they scale with the type. `normal` is the neutral default;
    // `tight`/`tighter` pull display glyphs in at large sizes.
    tracking: {
      normal: '0em',
      tight: '-0.025em',
      tighter: '-0.05em',
    },
    // Component-owned sub-element type ramps (REQ-56), in the render's px
    // vocabulary. Defaults encode the services-grid module's previously
    // hard-coded values so behaviour is unchanged: badge = xs/semibold/tight
    // (12px / 600 / 13px leading), checklist item = base/regular/relaxed
    // (16px / 400 / 28px leading). Fixing a subscale here corrects every badge
    // / checklist instance; a per-instance `labelStyle`/`itemStyle` overrides one.
    subScales: {
      badge: { fontSizePx: 12, fontWeight: 600, lineHeightPx: 13, letterSpacingPx: 0 },
      checklist: { fontSizePx: 16, fontWeight: 400, lineHeightPx: 28, letterSpacingPx: 0 },
    },
  },
  spacing: {
    '0': '0',
    '1': '0.25rem',
    '2': '0.5rem',
    '3': '0.75rem',
    '4': '1rem',
    '6': '1.5rem',
    '8': '2rem',
    '12': '3rem',
    '16': '4rem',
    '24': '6rem',
    // Large steps (REQ-49) extend the scale past 6rem so a `fold` hero can pin
    // its content a deliberate distance from the band top (the reference's
    // `pt-80` = 20rem = 320px). Backs the hero `contentOffsetTop` dial; a general
    // spacing extension, available to every `--space-*` consumer.
    '32': '8rem',
    '48': '12rem',
    '64': '16rem',
    '80': '20rem',
  },
  radius: {
    none: '0',
    sm: '0.125rem',
    md: '0.375rem',
    lg: '0.5rem',
    full: '9999px',
  },
  shadow: {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.05)',
    md: '0 4px 6px rgba(0,0,0,0.1)',
    lg: '0 10px 15px rgba(0,0,0,0.1)',
    // `xl` (REQ-32 cap 5) — a lifted drop + soft glow for art-directed layer
    // photos; sites tune the exact value in their theme.
    xl: '0 15px 50px rgba(0,0,0,0.55), 0 0 30px rgba(255,255,255,0.12)',
  },
  container: {
    // Content-column width scale (REQ-55) — aligned 1:1 to Tailwind's `max-w`
    // scale so a real site lands on a named step. rem @ root-16 → px: sm 384 ·
    // md 448 · lg 512 · xl 576 · 2xl 672 · 3xl 768 · 4xl 896 · 5xl 1024 ·
    // 6xl 1152 · 7xl 1280. `bleed` (100%) fills the frame. A width off the scale
    // is a literal on the `contentWidth`/`rowWidth` dial, not a token.
    sm: '24rem',
    md: '28rem',
    lg: '32rem',
    xl: '36rem',
    '2xl': '42rem',
    '3xl': '48rem',
    '4xl': '56rem',
    '5xl': '64rem',
    '6xl': '72rem',
    '7xl': '80rem',
    bleed: '100%',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
}
