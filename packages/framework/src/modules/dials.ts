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
 */
export const LOGO_TREATMENT_DIAL = ['plain', 'gold'] as const

/**
 * Heading colour treatment for the hero (REQ-28). `plain` inherits the surface
 * text colour; `accent` fills the heading with the solid site accent; `gold`
 * applies the same metallic-gold gradient as the header wordmark (REQ-24),
 * keyed to `--color-accent`. Used by the gigabytealchemy import, whose hero
 * heading is gold rather than the inverse-surface default (white).
 */
export const HEADING_TREATMENT_DIAL = ['plain', 'accent', 'gold'] as const
