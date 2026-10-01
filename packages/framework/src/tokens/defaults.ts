import type { L1TextStyles } from '@1stcontact/site-schema'
import type { ThemeTokens } from './contract'

/**
 * REQ-350 — the text styles a new site starts with: the system face for copy
 * and headings, `body` the default every page inherits. What the theme's
 * typography families used to supply, as named styles a run can refer to.
 */
export const SYSTEM_FONT_STACK = 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif'
export const defaultTextStyles: L1TextStyles = {
  body: { fontFamily: SYSTEM_FONT_STACK },
  heading: { fontFamily: SYSTEM_FONT_STACK },
}
export const defaultTextStyle = 'body'

/**
 * Sane default values for every theme-token slot (DOC-7 §4 / REQ-4 superset).
 * Used by the CSS generator to fill any slot
 * a site omits, so generated CSS always declares the full custom-property
 * surface regardless of how sparse the site's theme is.
 *
 * REQ-114 — no colour defaults: colour left the token surface for the L1 palette
 * model (DOC-23 §5), where a literal hex is always valid and needs no default.
 */
export const defaultTokens: ThemeTokens = {
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
