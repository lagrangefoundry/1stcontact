/**
 * REQ-350 — named and inherited type: **literal base, named overlay**, the
 * palette's model (REQ-114) one axis group over.
 *
 * | | absolute base | overlay |
 * |---|---|---|
 * | colour | hex literal | palette reference |
 * | **type** | **a run's own `fontFamily`/`fontSizePx`/…** | **a named style, and what a container sets for what it contains** |
 *
 * A run's own literal values are always valid, so a reproduction stays lossless
 * and nothing is gated on a style existing. A style is a value a run could have
 * carried literally, so resolving one is a substitution: the rendered output is
 * identical either way, and converting literals to styles is pixel-identical by
 * construction.
 *
 * **One resolution pass, at the boundary.** {@link resolveL1TextStyles} turns
 * every name and every inherited value back into the literals a run would have
 * carried, wherever the palette is resolved — so the renderer, the analytic
 * evaluator, the round-trip gate and values-diff all read a run's type as the
 * value it paints, and none of them learns that styles exist.
 *
 * Precedence, nearest first: the run's own value; the run's own style; the
 * nearest container's own value; that container's style; outward the same way;
 * and last the site's default style. A per-width track and a single value are
 * two forms of ONE axis, so whichever is nearer wins the axis outright.
 */
import type { L1ScalarTrack, L1TextResponsive, L1TextStyle, L1TextStyles, L1Type } from './types'

/** The five axes a style sets. */
export const L1_TYPE_AXES = ['fontFamily', 'fontSizePx', 'fontWeight', 'lineHeightPx', 'letterSpacingPx'] as const
type TypeAxis = (typeof L1_TYPE_AXES)[number]
/** The three that may vary by width (`responsive`). */
const TRACKED: ReadonlySet<string> = new Set(['fontSizePx', 'lineHeightPx', 'letterSpacingPx'])

type Value = { value: string | number } | { track: L1ScalarTrack }
type Bag = Partial<Record<TypeAxis, Value>>

/** Lay `source`'s axes over `bag`: each axis it sets replaces the one below, in whichever form it sets it. */
function layer(bag: Bag, source: Partial<L1TextStyle> | undefined): Bag {
  if (!source) return bag
  const out: Bag = { ...bag }
  const responsive = source.responsive as L1TextResponsive | undefined
  for (const axis of L1_TYPE_AXES) {
    const track = TRACKED.has(axis) ? responsive?.[axis as keyof L1TextResponsive] : undefined
    if (track) out[axis] = { track }
    else if (source[axis] !== undefined) out[axis] = { value: source[axis] as string | number }
  }
  return out
}

/** A track's representative value: its widest keyframe, the convention a run's own axes follow. */
const widest = (track: L1ScalarTrack): number => track.keyframes[track.keyframes.length - 1].value

/** Does anything under `input` name a style or set inherited type? */
function usesStyles(input: unknown): boolean {
  let found = false
  forEachTypeSite(input, () => {
    found = true
  })
  return found
}

/**
 * Visit every place type is named or set: a run's `axes.textStyle`, and a
 * box's or container's `type`. Structural, like the palette's walk, so a node
 * kind that gains the axis tomorrow is visited the day it lands.
 */
function forEachTypeSite(
  input: unknown,
  fn: (site: { path: string; kind: 'run' | 'container'; name?: string }) => void,
): void {
  const walk = (v: unknown, path: string): void => {
    if (Array.isArray(v)) {
      v.forEach((item, i) => walk(item, `${path}/${i}`))
      return
    }
    if (typeof v !== 'object' || v === null) return
    const node = v as Record<string, unknown>
    if (typeof node.kind === 'string') {
      const axes = node.axes as { textStyle?: unknown } | undefined
      if (axes && typeof axes.textStyle === 'string') fn({ path, kind: 'run', name: axes.textStyle })
      const type = node.type as { style?: unknown } | undefined
      if (type && typeof type === 'object') {
        fn({ path, kind: 'container', name: typeof type.style === 'string' ? type.style : undefined })
      }
    }
    for (const [key, item] of Object.entries(node)) walk(item, `${path}/${key}`)
  }
  walk(input, '')
}

/** Every reference to a named style under `input`, with a JSON-pointer-style path to the node. */
export function collectL1TextStyleRefs(input: unknown): { path: string; name: string }[] {
  const out: { path: string; name: string }[] = []
  forEachTypeSite(input, (site) => {
    if (site.name !== undefined) out.push({ path: site.path, name: site.name })
  })
  return out
}

/** Every reference to `from` re-pointed at `to`; the same set {@link collectL1TextStyleRefs} counts. */
export function renameL1TextStyleRef<T>(input: T, from: string, to: string): T {
  const walk = (v: unknown): unknown => {
    if (Array.isArray(v)) return v.map(walk)
    if (typeof v !== 'object' || v === null) return v
    const node = { ...(v as Record<string, unknown>) }
    if (typeof node.kind === 'string') {
      const axes = node.axes as { textStyle?: unknown } | undefined
      if (axes?.textStyle === from) node.axes = { ...axes, textStyle: to }
      const type = node.type as { style?: unknown } | undefined
      if (type?.style === from) node.type = { ...type, style: to }
    }
    for (const [key, item] of Object.entries(node)) {
      if (key !== 'axes' && key !== 'type') node[key] = walk(item)
    }
    return node
  }
  return walk(input) as T
}

/**
 * Replace every named style and every inherited value under `input` with the
 * literals it resolves to, returning a structurally identical copy whose runs
 * carry their type the way a reproduction writes it. Pure. A document that names
 * no style and inherits nothing is returned by identity unless a site default
 * applies.
 *
 * Validation runs first, so every name is known to resolve; a name that does not
 * is skipped rather than guessed at, exactly as nothing else here invents a value.
 */
export function resolveL1TextStyles<T>(input: T, styles?: L1TextStyles, defaultStyle?: string): T {
  const base: Bag = layer({}, defaultStyle !== undefined ? styles?.[defaultStyle] : undefined)
  if (Object.keys(base).length === 0 && !usesStyles(input)) return input
  const walk = (v: unknown, bag: Bag): unknown => {
    if (Array.isArray(v)) return v.map((item) => walk(item, bag))
    if (typeof v !== 'object' || v === null) return v
    const node = { ...(v as Record<string, unknown>) }
    if (node.kind === 'text' || node.kind === 'control') return applyToRun(node, bag, styles)
    let inner = bag
    if (typeof node.kind === 'string' && node.type && typeof node.type === 'object') {
      const type = node.type as L1Type
      inner = layer(layer(bag, type.style !== undefined ? styles?.[type.style] : undefined), type)
      delete node.type
    }
    for (const [key, item] of Object.entries(node)) node[key] = walk(item, typeof node.kind === 'string' ? inner : bag)
    return node
  }
  return walk(input, base) as T
}

function applyToRun(node: Record<string, unknown>, bag: Bag, styles?: L1TextStyles): Record<string, unknown> {
  const axes = { ...((node.axes as Record<string, unknown> | undefined) ?? {}) }
  const name = typeof axes.textStyle === 'string' ? axes.textStyle : undefined
  delete axes.textStyle
  const own = { ...axes, responsive: node.responsive } as Partial<L1TextStyle>
  const resolved = layer(layer(bag, name !== undefined ? styles?.[name] : undefined), own)
  const responsive: Record<string, L1ScalarTrack> = {
    ...((node.responsive as Record<string, L1ScalarTrack> | undefined) ?? {}),
  }
  for (const axis of L1_TYPE_AXES) {
    const v = resolved[axis]
    if (!v) continue
    if ('track' in v) {
      responsive[axis] = v.track
      axes[axis] = widest(v.track)
    } else {
      axes[axis] = v.value
      delete responsive[axis]
    }
  }
  const out: Record<string, unknown> = { ...node }
  if (Object.keys(axes).length > 0) out.axes = axes
  else delete out.axes
  if (Object.keys(responsive).length > 0) out.responsive = responsive
  else delete out.responsive
  return out
}
