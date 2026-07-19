/**
 * Shared per-instance dial enumerations (DOC-7 §4.1). Dial values are semantic
 * names; each module's scoped CSS maps them to concrete token references (e.g.
 * the `spacingTop` value `md` resolves to `var(--space-8)`). Centralised here so
 * the chrome modules don't drift from one another.
 *
 * REQ-50: every *intrinsic typography / colour* dial (family, size, weight,
 * colour, tracking, leading, gradient, treatment) has been removed — those axes
 * now live on the text slots themselves as styled runs (see `text-style.ts`),
 * named after the fidelity report's fields. Only *structural* dials remain here:
 * band layout, height, width, spacing, scrim, shape, letter-case, positioning,
 * and closed chrome treatments (badge/panel/icon/card fills).
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
 * by the content modules (text-block, services-grid, contact-form, hero). Passed
 * to {@link resolveStep}; header/footer carry their own compressed overlays. A
 * literal px (or any length) bypasses the overlay entirely (absolute-or-overlay).
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
 * Hero band height dial. `auto` sizes the band to its content (default);
 * `fold` fills the viewport to the fold (min-height 100vh) with the content
 * vertically centred — used where the hero image is meant to fill the screen.
 */
export const HEIGHT_DIAL = ['auto', 'fold'] as const

/**
 * Header image-logo size dial (REQ-20 import; REQ-36). Sizes an `asset-ref` logo's
 * height; a text wordmark's size lives on its styled run's `fontSizePx` (REQ-50).
 */
export const LOGO_SIZE_DIAL = ['sm', 'md', 'lg', 'xl'] as const

/**
 * Band width dial. `full` (default) spans the container; `half` flexes to one
 * of two columns — consecutive `half` bands are grouped into a shared row by
 * the render pipeline, so e.g. a subscribe + contact form sit side by side.
 */
export const WIDTH_DIAL = ['full', 'half', 'third', 'two-thirds'] as const

/** Horizontal alignment dial values (block alignment + text-align share these). */
export const ALIGN_DIAL = ['left', 'center'] as const

/** Footer content layout dial. `center` stacks centred; `spread` puts the
 * copyright and links on opposite ends of one row (justified, left/right). */
export const FOOTER_LAYOUT_DIAL = ['center', 'spread'] as const

/**
 * Footer band surface (REQ-36). Extends the shared surface set with
 * `accent-muted` — a softer, less-saturated accent gold the reference footer uses,
 * distinct from the bright accent applied to headings/buttons. Footer-scoped so
 * the shared {@link SURFACE_DIAL} stays lean.
 */
export const FOOTER_SURFACE_DIAL = ['default', 'subtle', 'inverse', 'accent', 'accent-muted'] as const

/** Inter-card / inter-item gap dial values (services-grid). */
export const GAP_DIAL = ['tight', 'normal', 'loose', 'airy'] as const

/**
 * Grid-wide card chrome for services-grid (REQ-36 / CAP-1). `default` draws the
 * standard filled + bordered card; `bare` strips the card's fill, border,
 * radius and padding so the cards read as plain text columns composited on the
 * band itself — for dark, art-directed grids where a white card would break the
 * composition. Card title and body inherit the band's text colour; chrome (badge,
 * accent border) is suppressed under `bare`, so the dial is orthogonal to
 * `variant`. Omitting the dial (`default`) leaves cards unchanged.
 */
export const CARD_SURFACE_DIAL = ['default', 'bare'] as const

/**
 * Palette roles usable as a markdown callout accent (and other closed, token-
 * backed role treatments). A closed set — each resolves to `var(--color-<role>)`
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
 * Nav collapse breakpoint (REQ-61) — the width below which the header nav folds
 * to a hamburger. `sm`/`md`/`lg`/`xl` pick the threshold; `none` never collapses.
 * A named-breakpoint overlay (a mode), not an absolute px: media-query thresholds
 * cannot read a CSS custom property. Default `md` (the former hardcoded 768px).
 */
export const NAV_COLLAPSE_DIAL = ['none', 'sm', 'md', 'lg', 'xl'] as const

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
 * every spacing/size dial (spacing, gap, logo size, offset, inset, panel pad). A
 * named step (`lg`) maps through the module's `steps` overlay to its token
 * (`var(--space-16)`); an ABSOLUTE value (a px number, or any length literal —
 * `80px`, `5rem`, `fit-content`) passes straight through, so a reproduction lands
 * the exact captured value instead of snapping to the nearest step. `fallback` is
 * used when the value is absent. Unknown/malformed → the fallback's resolution.
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
 * Hero legibility scrim (REQ-32) — an opacity step of a dark neutral tint
 * painted over the background image so overlaid text stays legible. `none`
 * (default) paints nothing; `light`/`medium`/`strong`/`heavy` step up the opacity.
 */
export const SCRIM_DIAL = ['none', 'light', 'medium', 'strong', 'heavy'] as const

/**
 * Hero CTA corner shape (REQ-36). `round` (default) keeps the token-backed
 * `--radius-md` pill; `square` removes the radius for a hard-cornered button;
 * `soft` is a barely-rounded 2px button. Default-preserving.
 */
export const CTA_SHAPE_DIAL = ['round', 'square', 'soft'] as const

/**
 * CTA / panel corner RADIUS overlays (REQ-58) — the named shape steps map to a
 * radius token; an absolute px (`8px`) bypasses them (absolute-or-overlay, via
 * {@link resolveStep}). Completes the value-type audit: colour, length, radius.
 */
export const CTA_RADIUS_STEPS: Record<string, string> = {
  round: 'var(--radius-md)',
  square: '0',
  soft: '2px',
}
export const PANEL_CORNER_STEPS: Record<string, string> = {
  rounded: 'var(--radius-lg)',
  square: '0',
}

/**
 * Hero top-of-band gradient scrim (REQ-36). `none` (default) omits it; `top`
 * layers a downward dark gradient (keyed to `--color-scrim`) over the flat scrim,
 * darkening the top edge behind the nav for legibility and fading out ~40% down.
 */
export const SCRIM_GRADIENT_DIAL = ['none', 'top'] as const

/**
 * Header logo backdrop (REQ-36). `none` (default) renders the logo bare; `card`
 * sets it on a padded, rounded, shadowed plate; `shadow` applies a drop-shadow to
 * the logo glyphs (no plate); `frame` a wide translucent bordered plate.
 */
export const LOGO_CARD_DIAL = ['none', 'card', 'shadow', 'frame'] as const

/**
 * Text-block contained-panel treatment (REQ-36). `none` (default) fills the whole
 * band. A role value turns the inner content column into a contained *card* — a
 * padded, rounded, inset panel filled with that palette role, floating on the
 * band background: `subtle`, `inverse`, `secondary`, `accent`.
 */
export const PANEL_DIAL = ['none', 'subtle', 'inverse', 'secondary', 'accent'] as const

/**
 * Text-block list marker (REQ-36). `bullet` (default) keeps the browser's list
 * bullets; `check` replaces them with an accent-coloured ✓. A content-level
 * treatment on the markdown list, so the body stays authored as a plain list.
 */
export const LIST_MARKER_DIAL = ['bullet', 'check'] as const

/**
 * Contact-form field labelling (REQ-58). `above` (default) renders a visible
 * `<label>` stacked over each input; `placeholder` moves the label text into the
 * field's `placeholder` and visually hides the `<label>` (kept for a11y / the
 * accessibility tree) — the compact single-column form gigabytealchemy uses.
 */
export const FIELD_LABELS_DIAL = ['above', 'placeholder'] as const

/**
 * Services-grid card veil (REQ-58). A frosted card is a translucent WHITE fill
 * over the band, not a solid surface — gigabytealchemy's cards are `bg-white/50`
 * (Mission, over the subtle band) and `bg-white/70` (Building, over the default
 * band), each compositing to a different rendered tint. `none` (default) keeps
 * the solid `--color-surface`; a percentage paints `rgba(255,255,255,.NN)` so the
 * browser composites it over whatever band the grid sits on — and the capture's
 * alpha compositing makes both sides agree at the same value.
 */
export const CARD_VEIL_DIAL = ['none', '40', '50', '60', '70', '80', '90'] as const

/**
 * Services-grid card border (REQ-58). `default` keeps the 1px hairline; `none`
 * drops it — the frosted-card look (gigabytealchemy's cards are `bg-white/NN
 * rounded-lg` with no border, only an optional `border-l-4` accent). Distinct
 * from `card-surface-bare`, which also strips the fill/radius/padding.
 */
export const CARD_BORDER_DIAL = ['default', 'none'] as const

/**
 * text-block contained-panel vertical padding (REQ-36). `md` (default) is the
 * base 48px; `lg`/`xl` deepen it so a panel reads taller/airier.
 */
export const PANEL_PAD_DIAL = ['md', 'lg', 'xl'] as const

/**
 * Contained-panel corner shape (REQ-36) — `rounded` (default) keeps the panel's
 * soft radius; `square` hard-corners it.
 */
export const PANEL_CORNER_DIAL = ['rounded', 'square'] as const

/**
 * Services-grid icon rendering (REQ-36). `default` renders a string icon as plain
 * text (or an image icon as a small thumbnail); `icon-font` renders a string icon
 * as a glyph in a site-declared icon font, coloured with the accent and sized up.
 */
export const ICON_FONT_DIAL = ['default', 'icon-font'] as const

/**
 * services-grid card icon layout (REQ-36). `top` (default) stacks the icon above
 * the title; `left` sets the icon beside the title on a header row with the body
 * spanning full width below.
 */
export const ICON_LAYOUT_DIAL = ['top', 'left'] as const

/**
 * Vertical anchor of a hero's content within a `fold`-height band (REQ-32).
 * `center` (default) matches the prior behaviour; `top`/`bottom` push the
 * content to the band's start/end.
 */
export const CONTENT_ANCHOR_DIAL = ['top', 'center', 'bottom'] as const

/**
 * Fixed top inset for a `fold`-height hero's content (REQ-49). A separate axis
 * from `contentAnchor`: the anchor picks *where in the flex* the content sits,
 * while this pins it a deliberate token-backed distance from the band's top edge.
 * `none` (default) applies no inset. Steps map to the extended `--space-*` scale:
 * `sm` 4rem, `md` 8rem, `lg` 12rem, `xl` 20rem.
 */
export const CONTENT_OFFSET_TOP_DIAL = ['none', 'sm', 'md', 'lg', 'xl'] as const

/**
 * Hero content horizontal inset (gutter) dial (REQ-49 cap 5). Sets the
 * `padding-inline` on `.hero__inner` as a token-backed step. `sm` (default) is
 * the prior 16px; `md` 24px, `lg` 32px. Maps to `--space-4`/`--space-6`/`--space-8`.
 */
export const CONTENT_INSET_DIAL = ['sm', 'md', 'lg'] as const

/**
 * Heading letter-case treatment (REQ-36), shared by hero / text-block /
 * services-grid. `normal` (default) renders the heading as authored; `upper`
 * applies `text-transform: uppercase` at render time. The DOM text node is left
 * **literal** — text-transform is not a report field, so it stays a treatment and
 * a faithful-repro values-diff still pairs on the literal text while the rendered
 * result matches the uppercased reference.
 */
export const HEADING_CASE_DIAL = ['normal', 'upper'] as const

/**
 * Hero divider rule (REQ-36) — a thin horizontal rule between the heading and
 * subhead. `none` (default) renders nothing; `rule` draws a short rule inheriting
 * the surface text colour.
 */
export const HERO_DIVIDER_DIAL = ['none', 'rule'] as const

/**
 * Hero content-column horizontal placement (REQ-36) — where the capped
 * `.hero__inner` column sits within the band, distinct from `align` (which sets
 * text alignment *inside* the column). `center` (default) keeps the centring;
 * `left` drops the start margin so the column hugs the band's left gutter.
 */
export const CONTENT_COLUMN_DIAL = ['center', 'left'] as const
