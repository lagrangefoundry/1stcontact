/**
 * CHAT-7 — unified spec ⇄ diff typography vocabulary.
 *
 * A text run's style is expressed in the *same* field names and units the
 * fidelity diff (`ValueElement` in `values-diff.ts`) reports: `fontFamily`,
 * `fontSizePx`, `fontWeight`, `color`, `letterSpacingPx`, `lineHeightPx`,
 * `paddingLeftPx`. Each field accepts EITHER a literal in the diff's unit (a px
 * integer, a weight integer, a `#rrggbb` colour, a real family name) OR a theme
 * *alias* — a named token step (`fontWeight: "medium"`, `color: "primary"`).
 * Both resolve to the same painted value, so reproduction pastes the diff's
 * exact numbers while design can reach for named steps. There is no enum
 * indirection between the two: the diff's "expected" column is a valid run.
 *
 * Resolution is theme-free by construction: an alias resolves to the `var(--…)`
 * custom property that {@link generateThemeCss} always emits, so a module (which
 * receives only `variant`/`dials`/`content`, never the theme) can resolve a run
 * with no theme in hand. A literal is emitted verbatim in its diff unit.
 */
import type { Position } from '@1stcontact/site-schema'

/** The finite alias step-sets, mirroring the token contract (site-schema). */
const FAMILY_ROLES = ['heading', 'body', 'display', 'label'] as const
const SCALE_STEPS = ['xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'] as const
const WEIGHT_STEPS = ['extralight', 'light', 'regular', 'medium', 'semibold', 'bold', 'black'] as const
const LINE_HEIGHT_STEPS = ['tight', 'snug', 'normal', 'relaxed'] as const
const TRACKING_STEPS = ['normal', 'tight', 'tighter'] as const

export const TEXT_STYLE_ALIASES = {
  fontFamily: FAMILY_ROLES,
  fontSizePx: SCALE_STEPS,
  fontWeight: WEIGHT_STEPS,
  lineHeightPx: LINE_HEIGHT_STEPS,
  letterSpacingPx: TRACKING_STEPS,
} as const

/**
 * Gradient-direction aliases → the CSS `linear-gradient` direction keyword.
 * These are the `angleDeg` field's *alias* form: a run may set `angleDeg` to a
 * literal degrees number (the report's unit — 0 = to-top, 90 = to-right, 180 =
 * to-bottom) OR to one of these eight principal-direction names. Both emit a
 * valid sweep direction; the literal pastes the report's number verbatim.
 */
const GRADIENT_DIRECTIONS = {
  'to-top': 'to top',
  'to-bottom': 'to bottom',
  'to-left': 'to left',
  'to-right': 'to right',
  'to-tr': 'to top right',
  'to-tl': 'to top left',
  'to-br': 'to bottom right',
  'to-bl': 'to bottom left',
} as const

/** The permitted `angleDeg` direction aliases (validation reads this set). */
export const GRADIENT_DIRECTION_ALIASES = Object.keys(
  GRADIENT_DIRECTIONS,
) as readonly (keyof typeof GRADIENT_DIRECTIONS)[]

/**
 * The palette-role aliases a `color` (or gradient stop) may name — the closed
 * kebab-case set the token CSS emits as `--color-<role>`. A `color` value is
 * therefore either a `#rrggbb`/`#rgb`/`#rrggbbaa` literal (the report's unit) or
 * one of these roles. Mirrors the site-schema palette + layer-role contract;
 * kept here so validation and resolution share one source of truth.
 */
export const PALETTE_ROLE_ALIASES = [
  'bg',
  'surface',
  'surface-subtle',
  'surface-inverse',
  'text',
  'muted',
  'border',
  'primary',
  'accent',
  'secondary',
  'neutral-cool',
  'accent-light',
  'accent-mid',
  'accent-deep',
  'scrim',
] as const

/** True when `value` is a `#hex` colour literal (the report's `color` unit). */
export function isColorLiteral(value: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(value)
}

/** True when `value` is a known palette-role alias (camelCase or kebab accepted). */
export function isPaletteRole(value: string): boolean {
  return (PALETTE_ROLE_ALIASES as readonly string[]).includes(kebab(value))
}

/**
 * One gradient colour-stop. `color` is a `#rrggbb` literal (the report's unit)
 * or a palette-role alias (`accent` → `var(--color-accent)`) — the same
 * literal-or-alias rule as {@link TextRun.color}. `position` is an optional
 * 0..100 percentage; stops are evenly distributed across the sweep when omitted.
 * The report's `TextGradient.stops` are bare `#rrggbb` strings, so a reproduction
 * pastes them straight into the `color` field.
 */
export interface GradientStop {
  color: string
  position?: number
}

/**
 * A text-fill gradient clipped to a run's glyphs (`background-clip: text`),
 * mirroring the fidelity report's `TextGradient` field-for-field so a captured
 * gradient reproduces verbatim. `angleDeg` is a literal degrees number (the
 * report's unit) or a principal-direction alias ({@link GRADIENT_DIRECTIONS});
 * `stops` are ≥2 {@link GradientStop}s (a bare `#rrggbb`/role string is accepted
 * as a positionless stop). Under two stops → no gradient (the run keeps `color`).
 */
export interface TextRunGradient {
  angleDeg: number | string
  stops: readonly (string | GradientStop)[]
}

/**
 * One styled text run. `text`/`label`/`href` carry the content; the remaining
 * fields are the intrinsic style, each a diff-unit literal or a theme alias.
 * The style fields are the exact `ValueElement` names/units, so a diff row's
 * `expected` value drops straight into the matching field.
 */
export interface TextRun {
  /** Verbatim run text (heading / subhead / body / label slots). */
  text?: string
  /** CTA label (button slots use `label` + `href` instead of `text`). */
  label?: string
  /** CTA target. */
  href?: string
  /** Real family name (`"Oswald"`) or a family role alias (`heading`/`body`/`display`/`label`). */
  fontFamily?: string
  /** Literal px (`65`) or a scale step alias (`"5xl"`). */
  fontSizePx?: number | string
  /** Literal weight (`500`) or a weight step alias (`"medium"`). */
  fontWeight?: number | string
  /** `#rrggbb` literal or a palette-role alias (`"primary"`). */
  color?: string
  /** Literal px (`0`) or a tracking step alias (`"tight"`). */
  letterSpacingPx?: number | string
  /** Literal px (`75`) or a line-height step alias (`"snug"`). */
  lineHeightPx?: number | string
  /** Literal px indent (`0`). No alias — indent is always a measured length. */
  paddingLeftPx?: number | string
  /**
   * Text-fill gradient (`background-clip: text`). When present with ≥2 stops it
   * paints the glyphs and forces `color: transparent`, so it supersedes any
   * `color` on the same run — matching how the report reports a gradient run
   * (a `gradient` value, not a flat colour).
   */
  gradient?: TextRunGradient
  /**
   * Optional free position within the host band (REQ-52). When present the run
   * is placed by the framework's `--fc-*` coordinate model (shared with layer
   * children) instead of flowing normally — used to art-direct the hero segment
   * (the overlay wordmark + eyebrow/heading/subhead/cta). `x`/`y`/`w` are band
   * percentages, `z` unitless, `rotate` degrees.
   */
  position?: Position
}

/** camelCase palette role → kebab CSS-var segment (`surfaceInverse` → `surface-inverse`). */
function kebab(role: string): string {
  return role.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase()
}

/** A px length: a number → `<n>px`; a string is assumed already a length. */
function px(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value
}

/** Resolve a length field: literal px number, else an alias → `var(--<prefix>-<step>)`. */
function lengthOrVar(value: number | string, varPrefix: string): string {
  return typeof value === 'number' ? `${value}px` : `var(--${varPrefix}-${value})`
}

/** Resolve a unitless numeric field (weight): literal number, else `var(--<prefix>-<step>)`. */
function numberOrVar(value: number | string, varPrefix: string): string {
  return typeof value === 'number' ? `${value}` : `var(--${varPrefix}-${value})`
}

/**
 * Resolve a colour VALUE to CSS: a `#rrggbb` literal (an absolute value) is used
 * as-is; anything else is a palette-role alias (the overlay of constants) →
 * `var(--color-<kebab(role)>)`. This is the absolute-or-overlay seam every colour
 * dial should route through, so a site can be reproduced with exact absolute
 * values, not just the restricted role vocabulary. Exported for reuse by any
 * module's colour dial (card accent, checklist tick, footer link, …).
 */
export function resolveColor(value: string): string {
  return value.startsWith('#') ? value : `var(--color-${kebab(value)})`
}

/** Family role alias → `var(--font-family-<role>)`, else a literal family name. */
function resolveFamily(value: string): string {
  return (FAMILY_ROLES as readonly string[]).includes(value)
    ? `var(--font-family-${value})`
    : `"${value}", sans-serif`
}

/** A gradient sweep direction: a literal degrees number → `<n>deg`, else a direction alias keyword. */
function resolveDirection(angleDeg: number | string): string {
  if (typeof angleDeg === 'number') return `${angleDeg}deg`
  return GRADIENT_DIRECTIONS[angleDeg as keyof typeof GRADIENT_DIRECTIONS] ?? `${angleDeg}`
}

/**
 * Resolve a {@link TextRunGradient} to the `background-clip: text` declaration
 * block that clips the sweep to a run's glyphs, or `''` when under-specified
 * (fewer than two stops) so the caller keeps the run's flat `color`. Each stop's
 * colour resolves literal-or-alias exactly like `color`; positions are emitted
 * verbatim, else evenly distributed across 0..100 so the sweep spans the run.
 */
function gradientImage(gradient: TextRunGradient): string {
  const stops = gradient.stops
  if (stops.length < 2) return ''
  const last = stops.length - 1
  const rendered = stops
    .map((stop, i) => {
      const color = typeof stop === 'string' ? stop : stop.color
      const position = typeof stop === 'string' ? undefined : stop.position
      const pct = position ?? Math.round((i / last) * 100)
      return `${resolveColor(color)} ${pct}%`
    })
    .join(', ')
  return `linear-gradient(${resolveDirection(gradient.angleDeg)}, ${rendered})`
}

function resolveGradient(gradient: TextRunGradient): string {
  const image = gradientImage(gradient)
  if (!image) return ''
  return `background-image: ${image}; -webkit-background-clip: text; background-clip: text; color: transparent`
}

/**
 * Resolve a {@link TextRunGradient} to a panel/card `background-image` declaration
 * (REQ-62) — the SAME `angleDeg` + literal-or-alias stops as the text-fill
 * gradient, but painted as the element's *surface* (no `background-clip: text`, no
 * forced transparent text). `''` when under-specified (fewer than two stops), so
 * the caller keeps its solid fill. Exported so any module with a panel/card
 * surface can take a gradient fill, reproduced from a captured `surfaceGradient`.
 */
export function resolveSurfaceGradient(gradient: TextRunGradient): string {
  const image = gradientImage(gradient)
  return image ? `background-image: ${image}` : ''
}

/**
 * Resolve a {@link TextRun}'s style fields to an inline-`style` declaration
 * string (`font-family: …; font-size: 65px; …`). Content fields
 * (`text`/`label`/`href`) are ignored; only fields that are present emit a
 * declaration, so a run that sets just `fontWeight` leaves every other axis to
 * inherit. Returns `''` for an absent run.
 */
export function resolveTextStyle(run: TextRun | undefined | null): string {
  if (!run) return ''
  const decls: string[] = []
  if (run.fontFamily !== undefined) decls.push(`font-family: ${resolveFamily(run.fontFamily)}`)
  if (run.fontSizePx !== undefined) decls.push(`font-size: ${lengthOrVar(run.fontSizePx, 'font-size')}`)
  if (run.fontWeight !== undefined) decls.push(`font-weight: ${numberOrVar(run.fontWeight, 'font-weight')}`)
  // A gradient fill paints the glyphs and forces `color: transparent`, so it
  // supersedes a flat `color` on the same run (the run keeps `color` only when
  // the gradient is absent or under-specified).
  const gradientDecl = run.gradient ? resolveGradient(run.gradient) : ''
  if (gradientDecl) decls.push(gradientDecl)
  else if (run.color !== undefined) decls.push(`color: ${resolveColor(run.color)}`)
  if (run.letterSpacingPx !== undefined)
    decls.push(`letter-spacing: ${lengthOrVar(run.letterSpacingPx, 'tracking')}`)
  if (run.lineHeightPx !== undefined)
    decls.push(`line-height: ${lengthOrVar(run.lineHeightPx, 'line-height')}`)
  if (run.paddingLeftPx !== undefined) decls.push(`padding-left: ${px(run.paddingLeftPx)}`)
  return decls.join('; ')
}
