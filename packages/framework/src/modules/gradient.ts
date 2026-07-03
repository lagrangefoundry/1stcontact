import type { GRADIENT_DIRECTION_DIAL, TREATMENT_ROLE_DIAL } from './dials'

/**
 * Gradient text treatment (REQ-32).
 *
 * An arbitrary-direction, multi-stop gradient clipped to a text run's glyphs
 * (`background-clip: text`), for a wordmark / heading whose gradient the fixed
 * two-tone `gold` treatment can't express. It is *structured, token-backed
 * data* on the instance — the framework, never the instance, turns it into CSS,
 * exactly like a section background (see `background.ts`). Stops reference
 * palette **roles** only, so no raw colour and no raw CSS ever reaches the
 * output; an off-palette hue is a site's palette addition, not a gradient field.
 */

/** One gradient stop: a palette-role name plus an optional 0..100 position. */
export interface GradientStop {
  role: (typeof TREATMENT_ROLE_DIAL)[number]
  /** Colour-stop position as a percentage (0..100). Even-spaced when omitted. */
  position?: number
}

/** A structured gradient treatment: a direction plus two or more colour stops. */
export interface GradientTreatment {
  direction: (typeof GRADIENT_DIRECTION_DIAL)[number]
  stops: GradientStop[]
}

/** Direction enum → CSS `linear-gradient` direction keyword. */
const DIRECTION_CSS: Record<(typeof GRADIENT_DIRECTION_DIAL)[number], string> = {
  'to-top': 'to top',
  'to-bottom': 'to bottom',
  'to-left': 'to left',
  'to-right': 'to right',
  'to-tr': 'to top right',
  'to-tl': 'to top left',
  'to-br': 'to bottom right',
  'to-bl': 'to bottom left',
}

/** Palette-role name → the site's semantic colour custom property. */
function roleVar(role: string): string {
  return `var(--color-${role})`
}

/**
 * The `background-image` value for a gradient treatment, or `undefined` when the
 * treatment is missing or under-specified (fewer than two stops). Positions are
 * emitted verbatim when supplied; otherwise the stops are evenly distributed
 * across 0..100 so a two-stop sweep spans the full run.
 */
export function gradientImage(g: GradientTreatment | undefined): string | undefined {
  if (!g || !Array.isArray(g.stops) || g.stops.length < 2) return undefined
  const direction = DIRECTION_CSS[g.direction] ?? DIRECTION_CSS['to-right']
  const last = g.stops.length - 1
  const stops = g.stops
    .map((s, i) => {
      const pct = s.position ?? Math.round((i / last) * 100)
      return `${roleVar(s.role)} ${pct}%`
    })
    .join(', ')
  return `linear-gradient(${direction}, ${stops})`
}

/**
 * The full inline `style` declaration clipping a gradient to a text run's
 * glyphs, or `undefined` when the treatment is missing/under-specified so the
 * caller falls back to the element's inherited colour. Emitted as a
 * framework-computed inline style (never instance-supplied raw CSS).
 */
export function gradientTextStyle(g: GradientTreatment | undefined): string | undefined {
  const image = gradientImage(g)
  if (!image) return undefined
  return `background-image: ${image}; -webkit-background-clip: text; background-clip: text; color: transparent;`
}
