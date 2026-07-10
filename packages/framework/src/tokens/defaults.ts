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
    // `xnarrow` (REQ-36) — a tight column below `narrow` (32rem/512px) for a
    // centred content block that reads narrower than the section band (the
    // reference "Who Uses Our Services" checklist wraps in a ~505px column, not
    // the 700px section width).
    xnarrow: '32rem',
    narrow: '40rem',
    // `readable` (REQ-49) — a reading measure (48rem/768px, Tailwind `max-w-3xl`)
    // between `narrow` and `default`, so a constrained column (e.g. the hero
    // body) can size independently of the `narrow` token.
    readable: '48rem',
    default: '72rem',
    wide: '90rem',
    bleed: '100%',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
  },
}
