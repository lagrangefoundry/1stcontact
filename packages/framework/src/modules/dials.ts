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

/** Horizontal alignment dial values (block alignment + text-align share these). */
export const ALIGN_DIAL = ['left', 'center'] as const

/** Inter-card / inter-item gap dial values (services-grid). */
export const GAP_DIAL = ['tight', 'normal', 'loose'] as const
