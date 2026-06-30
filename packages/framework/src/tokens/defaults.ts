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
      regular: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
      black: '900',
    },
    lineHeights: {
      tight: '1.1',
      normal: '1.5',
      relaxed: '1.75',
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
  },
  container: {
    narrow: '40rem',
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
