/**
 * Shared per-instance dial enumerations (DOC-7 §4.1). Dial values are semantic
 * names; each module's scoped CSS maps them to concrete token references (e.g.
 * the `spacingTop` value `md` resolves to `var(--space-8)`). Centralised here so
 * the chrome modules don't drift from one another.
 */

/** Vertical spacing dial values (spacingTop / spacingBottom). */
export const SPACING_DIAL = ['none', 'sm', 'md', 'lg', 'xl'] as const

/** Surface (background + text treatment) dial values. */
export const SURFACE_DIAL = ['default', 'subtle', 'inverse', 'accent'] as const

/** Hero size dial values. */
export const SIZE_DIAL = ['sm', 'md', 'lg'] as const

/**
 * Hero band height dial. `auto` sizes the band to its content (default);
 * `fold` fills the viewport to the fold (min-height 100vh) with the content
 * vertically centred — used where the hero image is meant to fill the screen.
 */
export const HEIGHT_DIAL = ['auto', 'fold'] as const

/**
 * Header wordmark size dial (independent of the surface/heading scale). Steps
 * up from the default `md` so a display wordmark can read at hero scale.
 */
export const LOGO_SIZE_DIAL = ['sm', 'md', 'lg', 'xl'] as const

/**
 * Band width dial. `full` (default) spans the container; `half` flexes to one
 * of two columns — consecutive `half` bands are grouped into a shared row by
 * the render pipeline, so e.g. a subscribe + contact form sit side by side.
 */
export const WIDTH_DIAL = ['full', 'half'] as const

/** Horizontal alignment dial values (block alignment + text-align share these). */
export const ALIGN_DIAL = ['left', 'center'] as const

/** Footer content layout dial. `center` stacks centred; `spread` puts the
 * copyright and links on opposite ends of one row (justified, left/right). */
export const FOOTER_LAYOUT_DIAL = ['center', 'spread'] as const

/** Inter-card / inter-item gap dial values (services-grid). */
export const GAP_DIAL = ['tight', 'normal', 'loose'] as const

/**
 * Wordmark font-family selection for the header logo (REQ-24). `display`
 * selects the site's bespoke display face (`--font-family-display`), enabling a
 * wordmark in a font distinct from the theme's heading/body families.
 */
export const LOGO_FONT_DIAL = ['heading', 'body', 'display'] as const

/**
 * Wordmark colour treatment for the header logo (REQ-24). `gold` fills the
 * wordmark glyphs with a metallic-gold gradient (background-clip: text) keyed to
 * the site's `--color-accent`; `plain` inherits the header's text colour.
 * `gradient` (REQ-32) reads a structured `logoGradient` content field — an
 * arbitrary-direction, multi-stop, palette-role-backed sweep — for wordmarks
 * whose gradient the fixed `gold` recipe can't express.
 */
export const LOGO_TREATMENT_DIAL = ['plain', 'gold', 'gradient'] as const

/**
 * Palette roles selectable as gradient stops / callout accents (REQ-32). A
 * closed, token-backed set — each resolves to `var(--color-<role>)` — so a
 * gradient or callout treatment never carries a raw colour. `neutralCool` is the
 * REQ-32 cool-neutral role. Kebab-cased to match the emitted custom-property
 * names (`neutral-cool` → `--color-neutral-cool`).
 */
export const TREATMENT_ROLE_DIAL = [
  'primary',
  'accent',
  'secondary',
  'muted',
  'neutral-cool',
  // `accent-light` / `accent-deep` (REQ-33) are optional warm companions to the
  // brand `accent` — a lighter and a deeper warm hue. They let a multi-stop warm
  // brand gradient (e.g. a gold→orange wordmark) and a solid warm highlight text
  // be expressed as roles, so no raw colour ever reaches a gradient stop.
  'accent-light',
  'accent-deep',
  // `accent-mid` (REQ-20) is a third warm companion between `accent-light` and
  // `accent-deep`, so a multi-stop warm gradient can pass through a distinct
  // mid hue (the gigabytealchemy wordmark's lighter orange before its deep
  // orange) from a palette role rather than a raw colour.
  'accent-mid',
] as const

/**
 * Hero subhead/body colour dial (REQ-33). `inherit` (default) keeps the surface
 * text colour; any palette role tints the whole subhead block that role — e.g. a
 * gold lead paragraph over an inverse hero. A closed set (role names, never a raw
 * colour), so the framework computes the `var(--color-<role>)` fill.
 */
export const SUBHEAD_COLOR_DIAL = ['inherit', ...TREATMENT_ROLE_DIAL] as const

/**
 * Hero subhead/body scale dial (REQ-33). Sizes the lead paragraph and the body
 * copy independently of the heading `size` — a hero can carry a modest heading
 * but a prominent lead subtitle (e.g. gigabytealchemy). `md` (default) preserves
 * the prior xl/base scale; `sm`/`lg` step the pair down/up together.
 */
export const SUBHEAD_SIZE_DIAL = ['sm', 'md', 'lg'] as const

/**
 * Contact-form submit-button colour treatment (REQ-33). `primary` (default)
 * fills the button with the brand primary; `neutral` fills it with the dark
 * neutral text colour and a near-white label — a high-contrast dark button
 * (e.g. gigabytealchemy's black "Send message") on a light band.
 */
export const SUBMIT_TREATMENT_DIAL = ['primary', 'neutral'] as const

/**
 * Gradient sweep direction (REQ-32) — the eight principal directions, kept as a
 * closed enum (like `motionEasing`) rather than a raw angle so no free CSS value
 * enters an instance. Each maps to a CSS `linear-gradient` direction keyword.
 */
export const GRADIENT_DIRECTION_DIAL = [
  'to-top',
  'to-bottom',
  'to-left',
  'to-right',
  'to-tr',
  'to-tl',
  'to-br',
  'to-bl',
] as const

/**
 * Hero legibility scrim (REQ-32) — an opacity step of a dark neutral tint
 * painted over the background image so overlaid text stays legible. `none`
 * (default) paints nothing; `light`/`medium`/`strong` step up the opacity.
 */
export const SCRIM_DIAL = ['none', 'light', 'medium', 'strong'] as const

/**
 * Vertical anchor of a hero's content within a `fold`-height band (REQ-32).
 * `center` (default) matches the prior behaviour; `top`/`bottom` push the
 * content to the band's start/end — e.g. a hero whose copy sits low over the
 * image.
 */
export const CONTENT_ANCHOR_DIAL = ['top', 'center', 'bottom'] as const

/**
 * Heading colour treatment for the hero (REQ-28). `plain` inherits the surface
 * text colour; `accent` fills the heading with the solid site accent; `gold`
 * applies the same metallic-gold gradient as the header wordmark (REQ-24),
 * keyed to `--color-accent`. Used by the gigabytealchemy import, whose hero
 * heading is gold rather than the inverse-surface default (white). `gradient`
 * (REQ-32) reads a structured `headingGradient` content field for an
 * arbitrary-direction, multi-stop, palette-role-backed sweep.
 */
export const HEADING_TREATMENT_DIAL = ['plain', 'accent', 'gold', 'gradient'] as const
