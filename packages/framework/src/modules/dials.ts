/**
 * Shared per-instance dial enumerations (DOC-7 §4.1) for the **capability
 * modules** (carousel, contact-form). Dial values are semantic names; each
 * module's scoped CSS maps them to concrete token references (e.g. the
 * `spacingTop` value `md` resolves to `var(--space-8)`). Centralised here so the
 * capability modules don't drift from one another.
 *
 * Since the framework pivot (REQ-79/REQ-84) the semantic *layout* modules and
 * their ~20 layout-only dials (hero height/scrim, header logo, footer layout,
 * text-block panel, services-grid card chrome, …) are gone — layout is owned by
 * the L1 substrate. What remains here is the **shared length/step resolvers**
 * (the absolute-or-overlay seam, REQ-58) plus the small set of structural dials
 * the surviving capability modules still declare.
 */
import { BREAKPOINTS, type Breakpoint } from './breakpoints'

/**
 * Vertical spacing dial values (spacingTop / spacingBottom). `2xl`/`3xl` (REQ-36)
 * extend each module's own scale one and two steps past `xl` for the airy section
 * padding a reference like joyfulculinary's "How It Works" band uses (deep top
 * padding, large gaps); every spacing-bearing module renders the two new steps.
 */
export const SPACING_DIAL = ['none', 'sm', 'md', 'lg', 'xl', '2xl', '3xl'] as const

/**
 * Standard vertical-spacing step overlay — the named steps → space tokens shared
 * by the capability modules (carousel, contact-form). Passed to {@link resolveStep}.
 * A literal px (or any length) bypasses the overlay entirely (absolute-or-overlay).
 */
export const SPACING_STEPS: Record<string, string> = {
  none: 'var(--space-0)',
  sm: 'var(--space-4)',
  md: 'var(--space-8)',
  lg: 'var(--space-16)',
  xl: 'var(--space-24)',
  '2xl': 'var(--space-32)',
  '3xl': 'var(--space-48)',
}

/** Surface (background + text treatment) dial values. */
export const SURFACE_DIAL = ['default', 'subtle', 'inverse', 'accent'] as const

/**
 * Band width dial. `full` (default) spans the container; `half` flexes to one
 * of two columns — consecutive `half` bands are grouped into a shared row by
 * the render pipeline, so e.g. a subscribe + contact form sit side by side.
 */
export const WIDTH_DIAL = ['full', 'half', 'third', 'two-thirds'] as const

/** Horizontal alignment dial values (block alignment + text-align share these). */
export const ALIGN_DIAL = ['left', 'center'] as const

/** Inter-slide gap dial values (carousel). */
export const GAP_DIAL = ['tight', 'normal', 'loose', 'airy'] as const

/**
 * Card chrome for a carousel slide (REQ-79). `default` draws the standard filled
 * + bordered card; `bare` strips the card's fill, border, radius and padding so
 * the slides read as plain columns composited on the band itself — for dark,
 * art-directed carousels where a white card would break the composition.
 */
export const CARD_SURFACE_DIAL = ['default', 'bare'] as const

/**
 * Palette roles usable as a closed, token-backed role treatment (e.g. the
 * contact-form submit fill). A closed set — each resolves to `var(--color-<role>)`
 * — so no raw colour ever reaches the output. Kebab-cased to match the emitted
 * custom-property names (`neutral-cool` → `--color-neutral-cool`).
 */
export const TREATMENT_ROLE_DIAL = [
  'primary',
  'accent',
  'secondary',
  'muted',
  'neutral-cool',
  'accent-light',
  'accent-deep',
  'accent-mid',
] as const

/**
 * Contact-form submit-button *fill* treatment (REQ-33). `primary` (default)
 * fills the button with the brand primary; `neutral` fills it with the dark
 * neutral text colour and a near-white label — a high-contrast dark button on a
 * light band. (The label *colour* is now a styled run's `color`, REQ-50.)
 */
export const SUBMIT_TREATMENT_DIAL = ['primary', 'neutral'] as const

/**
 * Contact-form submit layout (REQ-58). `stacked` (default) lays the button below
 * the fields; `inline` lays a single-field capture form's field + button on one
 * row (the reference subscribe strip). A structural mode (a closed set), not a
 * boolean flag.
 */
export const SUBMIT_INLINE_DIAL = ['stacked', 'inline'] as const

/**
 * Named content-column width steps (REQ-55) — the `--container-*` token keys,
 * aligned 1:1 to Tailwind's `max-w` scale (rem → px @ root-16). The map is the
 * authority for both the dial's named layer and the resolver below.
 */
export const CONTAINER_STEPS = {
  sm: '24rem', // 384
  md: '28rem', // 448
  lg: '32rem', // 512
  xl: '36rem', // 576
  '2xl': '42rem', // 672
  '3xl': '48rem', // 768
  '4xl': '56rem', // 896
  '5xl': '64rem', // 1024
  '6xl': '72rem', // 1152
  '7xl': '80rem', // 1280
  bleed: '100%',
} as const

/**
 * Constrained content-column width (REQ-45 capability, REQ-55 scale). Sizes the
 * content column *within* the section's full-width frame, so the existing `align`
 * dial governs where that column sits. `bleed` (the default) fills the frame; a
 * named step caps the column to the matching `--container-*` token. Off-scale
 * widths use the literal escape hatch (a `px` number or a CSS length string) —
 * see {@link resolveContainerWidth}.
 */
export const CONTENT_WIDTH_DIAL = [
  'bleed',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  '4xl',
  '5xl',
  '6xl',
  '7xl',
] as const

/**
 * Resolve a `contentWidth`/`rowWidth` dial value to a CSS max-width length, or
 * `null` when it means "no cap / fill the frame" (`bleed`, or absent). The
 * named-layer + literal-escape-hatch pattern (REQ-55, cf. styled-text markup):
 *
 *   - a named step  → the themeable `var(--container-<step>)`
 *   - a `number`    → `<n>px` (matches captured render values, which are px)
 *   - any other string → a literal CSS length (`"56rem"`, `"896px"`)
 */
export function resolveContainerWidth(value: string | number | undefined | null): string | null {
  if (value === undefined || value === null || value === '' || value === 'bleed') return null
  if (typeof value === 'number') return `${value}px`
  if (value in CONTAINER_STEPS) return `var(--container-${value})`
  return value
}

/**
 * The length value model (REQ-58). A length is one of these KINDS — the size
 * analogue of the colour absolute-or-overlay seam. Reproduction authors in
 * `absolute`/`relative`/`content`; `token` is the design overlay of constants.
 *
 *   - `absolute` — a `#px` value (or a bare number, or a physical unit which CSS
 *     defines as a fixed px multiple: 1in=96px — so on screen it is absolute px).
 *   - `token`    — a named constant (`4xl`) resolving to `var(--container-4xl)`.
 *   - `relative` — a proportion of a reference: container `%`/`cqw`, viewport
 *     `vw/vh`, or font `em/rem/ch`. Carries the responsive behaviour an absolute
 *     px snapshot cannot (why the multi-viewport ladder exists).
 *   - `content`  — sized to the content: `fit-content`/`min-content`/`max-content`.
 *   - `bleed`    — full-bleed (no cap).
 *
 * (The relationship a captured px actually IS can only be inferred by measuring
 * across the viewport ladder — deferred. This models the *language*; a site def
 * can declare a relative/content length directly today.)
 */
export type LengthKind = 'absolute' | 'token' | 'relative' | 'content' | 'bleed'

const CONTENT_KEYWORDS = new Set(['fit-content', 'min-content', 'max-content'])
// A signed decimal followed by a *relative* unit (of container / viewport / font).
const RELATIVE_LENGTH_RE = /^-?\d*\.?\d+(%|vw|vh|vmin|vmax|cqw|cqh|cqi|cqb|em|rem|ch|ex)$/
// A bare number, or a decimal followed by an *absolute* unit (px + CSS physical,
// which are fixed px multiples on screen).
const ABSOLUTE_LENGTH_RE = /^-?\d*\.?\d+(px|pt|pc|in|cm|mm|q)?$/

/** Classify a length value into its {@link LengthKind}, or null when malformed. */
export function classifyLength(value: string | number): LengthKind | null {
  if (typeof value === 'number') return Number.isFinite(value) ? 'absolute' : null
  const v = value.trim()
  if (v === 'bleed') return 'bleed'
  if (v in CONTAINER_STEPS) return 'token'
  if (CONTENT_KEYWORDS.has(v)) return 'content'
  if (RELATIVE_LENGTH_RE.test(v)) return 'relative'
  if (ABSOLUTE_LENGTH_RE.test(v)) return 'absolute'
  return null
}

/** True when `value` is a well-formed length in the model (any kind). */
export function isLength(value: unknown): boolean {
  return (typeof value === 'number' || typeof value === 'string') && classifyLength(value) !== null
}

/**
 * Resolve a step-or-absolute LENGTH dial to CSS — the absolute-or-overlay seam for
 * every spacing/size dial (spacing, gap, radius). A named step (`lg`) maps
 * through the module's `steps` overlay to its token (`var(--space-16)`); an
 * ABSOLUTE value (a px number, or any length literal — `80px`, `5rem`,
 * `fit-content`) passes straight through, so a reproduction lands the exact
 * captured value instead of snapping to the nearest step. `fallback` is used
 * when the value is absent. Unknown/malformed → the fallback's resolution.
 */
export function resolveStep(
  value: string | number | undefined | null,
  steps: Record<string, string>,
  fallback: string,
): string {
  const v = value ?? fallback
  if (typeof v === 'number') return `${v}px`
  if (v in steps) return steps[v]
  if (classifyLength(v)) return v // an absolute px / literal length — verbatim
  return steps[fallback] ?? fallback
}

/**
 * REQ-61 — a length dial value that may vary by breakpoint: a scalar (base only,
 * as today) OR a base plus per-breakpoint overrides `{ base, sm?, md?, lg?, xl? }`.
 * Each value is itself a scalar length (absolute px OR a named step overlay), so
 * the absolute-or-overlay mandate (REQ-58) now spans the breakpoint dimension.
 */
export type ResponsiveValue<T> = T | ({ base: T } & Partial<Record<Breakpoint, T>>)

/** True for the per-breakpoint object form (carries a `base`), not a scalar. */
export function isResponsiveValue(
  v: unknown,
): v is { base: string | number } & Partial<Record<Breakpoint, string | number>> {
  return typeof v === 'object' && v !== null && 'base' in (v as Record<string, unknown>)
}

/**
 * Emit the inline `--fc-<key>` (base) + `--fc-<key>-<bp>` (override) declarations
 * for a length dial that may be per-breakpoint, resolving every value through
 * {@link resolveStep} (named step overlay OR absolute px/length verbatim). A
 * scalar value emits just the base var — byte-identical to today, so the scalar
 * path is untouched. Pair with `responsivePropertyRules(selector, cssProp, key)`
 * (see ./breakpoints) so the consumed property re-points at each breakpoint.
 */
export function responsiveStepVars(
  key: string,
  value: ResponsiveValue<string | number> | undefined | null,
  steps: Record<string, string>,
  fallback: string,
): string {
  if (!isResponsiveValue(value)) return `--fc-${key}: ${resolveStep(value ?? undefined, steps, fallback)}`
  const decls = [`--fc-${key}: ${resolveStep(value.base, steps, fallback)}`]
  for (const bp of BREAKPOINTS) {
    const v = value[bp]
    if (v !== undefined) decls.push(`--fc-${key}-${bp}: ${resolveStep(v, steps, fallback)}`)
  }
  return decls.join('; ')
}

/**
 * REQ-61 — the per-breakpoint sibling of {@link resolveContainerWidth} for the
 * `contentWidth` dial (max-width cap). Unlike {@link responsiveStepVars}, a value
 * can mean "no cap" (`bleed`/absent → null), so this returns both the `--fc-content-width`
 * (+ `-<bp>`) declarations AND whether a base cap exists — the module gates its
 * `has-content-width` class on `hasCap`. A per-breakpoint cap requires a base cap
 * (the gating class, and thus every override rule, hangs off it); a `bleed`/absent
 * override emits no var, so that breakpoint falls through the chain to the base.
 */
export function responsiveContainerWidthVars(
  value: ResponsiveValue<string | number> | undefined | null,
): { decls: string; hasCap: boolean } {
  if (!isResponsiveValue(value)) {
    const css = resolveContainerWidth(value ?? undefined)
    return { decls: css ? `--fc-content-width: ${css}` : '', hasCap: css !== null }
  }
  const baseCss = resolveContainerWidth(value.base)
  const parts: string[] = []
  if (baseCss) parts.push(`--fc-content-width: ${baseCss}`)
  for (const bp of BREAKPOINTS) {
    if (value[bp] === undefined) continue
    const css = resolveContainerWidth(value[bp])
    if (css) parts.push(`--fc-content-width-${bp}: ${css}`)
  }
  return { decls: parts.join('; '), hasCap: baseCss !== null }
}

/**
 * Contact-form field labelling (REQ-58). `above` (default) renders a visible
 * `<label>` stacked over each input; `placeholder` moves the label text into the
 * field's `placeholder` and visually hides the `<label>` (kept for a11y / the
 * accessibility tree) — the compact single-column form gigabytealchemy uses.
 */
export const FIELD_LABELS_DIAL = ['above', 'placeholder'] as const

/**
 * Heading letter-case treatment (REQ-36), shared by the capability modules.
 * `normal` (default) renders the heading as authored; `upper` applies
 * `text-transform: uppercase` at render time. The DOM text node is left
 * **literal** — text-transform is not a report field, so it stays a treatment and
 * a faithful-repro values-diff still pairs on the literal text while the rendered
 * result matches the uppercased reference.
 */
export const HEADING_CASE_DIAL = ['normal', 'upper'] as const

/**
 * Carousel slides-per-view layout (REQ-79). `single` shows one slide per view
 * (the testimonial pattern); `peek` shows one main slide with its neighbours
 * peeking in at the edges; `multi` shows several slides per view (a gallery /
 * logo strip), collapsing to one below the `md` breakpoint. The track is a pure
 * CSS scroll-snap row — genuinely swipeable, no client JS (DOC-7 SSR-only).
 */
export const CAROUSEL_VIEW_DIAL = ['single', 'peek', 'multi'] as const

/**
 * Carousel pagination affordance (REQ-79). `none` renders the bare scroll-snap
 * track; `dots` adds a decorative row of position indicators below it (the first
 * marked active). The dots are `aria-hidden` presentation — the real affordance
 * is the swipeable/scrollable track, so no client JS is needed.
 */
export const CAROUSEL_CONTROLS_DIAL = ['none', 'dots'] as const
