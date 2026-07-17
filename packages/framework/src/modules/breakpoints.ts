/**
 * Shared per-breakpoint override primitive (REQ-15 → REQ-61).
 *
 * The layer's position model (REQ-15) proved the pattern: a value carries a base
 * plus per-breakpoint overrides, emitted as `--fc-<key>` / `--fc-<key>-<bp>`
 * custom properties, and the consumed CSS property is re-pointed at each
 * breakpoint through an "override and up" fallback chain (a larger breakpoint
 * falls back through every smaller override to the base).
 *
 * REQ-61 lifts that pattern out of `layer.ts` into a shared primitive so ANY
 * length dial can be per-breakpoint — the reproduction mandate (REQ-58: every
 * parameter expressible as absolute values, named steps as a design overlay) now
 * extended across the breakpoint dimension. `layer.ts` consumes these too, so the
 * position model and the dial model share one breakpoint vocabulary.
 */

/** Ascending breakpoint token names — the per-breakpoint override cascade. */
export const BREAKPOINTS = ['sm', 'md', 'lg', 'xl'] as const
export type Breakpoint = (typeof BREAKPOINTS)[number]

/** Standard pixel widths for the breakpoint tokens (mirrors token defaults). */
export const BREAKPOINT_PX: Record<Breakpoint, number> = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
}

/**
 * Build the `var(--fc-<key>-<bp>, … , var(--fc-<key>))` fallback chain for one key
 * up to breakpoint index `upTo`: a larger breakpoint falls back through every
 * smaller override to the base value, giving "override and up" semantics.
 */
export function overrideChain(key: string, upTo: number): string {
  let chain = `var(--fc-${key})`
  for (let i = 0; i <= upTo; i += 1) {
    chain = `var(--fc-${key}-${BREAKPOINTS[i]}, ${chain})`
  }
  return chain
}

/**
 * Media-query blocks re-pointing one CSS property through the override chain of a
 * `--fc-<key>` var. The base rule (`<prop>: var(--fc-<key>)`) stays in the module's
 * own CSS; this adds only the per-breakpoint media queries, so a module opts a
 * property into per-breakpoint values with a single call — the dial analogue of
 * the layer's `breakpointRules()`.
 */
export function responsivePropertyRules(selector: string, cssProperty: string, key: string): string {
  return BREAKPOINTS.map(
    (bp, i) => `@media (min-width: ${BREAKPOINT_PX[bp]}px) { ${selector} { ${cssProperty}: ${overrideChain(key, i)}; } }`,
  ).join('\n')
}
