/**
 * Re-expressing a node's geometry inside a parent's frame — the arithmetic a
 * structure change rests on.
 *
 * Shared by the two writers of nested structure: the fold, which nests captured
 * content inside the surface that backs it (BUG-142), and `group_l1` (REQ-350),
 * which nests existing page elements inside a new container. One definition,
 * because both must agree with the renderer about what a child's coordinates
 * mean, and a second copy is a second thing to keep in agreement with it.
 */
import type {
  L1Geometry,
  L1Keyframe,
  L1Node,
  L1SurfaceAxes,
  L1ViewportResponse,
} from '@1stcontact/site-schema'

/** The four numbers a keyframe resolves to. */
export interface GeometryRect {
  x: number
  y: number
  width: number
  height: number
}

const round2 = (n: number): number => Math.round(n * 100) / 100

/**
 * REQ-351 (issue 4) — the response governing a geometry track at `at`.
 *
 * The keyframe at that width when there is one, else the keyframe whose segment
 * covers it — the same half-open `[a.at, b.at)` resolution the renderer's stacked
 * `min-width` rules produce and `evalGeometry` mirrors. Used wherever one node's
 * response has to be read against another's (a child rebased into its parent, a
 * flow track re-sampled onto a coarser ladder), so the two are always compared at
 * the same width.
 *
 * ONE definition, exported, because the fold and the L1 oracle both resolve it and
 * a second copy is a second thing to keep in agreement with the renderer.
 */
export function responseAt(geo: L1Geometry, at: number): L1ViewportResponse | undefined {
  const f = geo.keyframes
  if (at <= f[0].at) return f[0].viewportResponse
  for (let i = 0; i < f.length - 1; i++) {
    if (at >= f[i].at && at < f[i + 1].at) return f[i].viewportResponse
  }
  return f[f.length - 1].viewportResponse
}

/**
 * A geometry track resolved at `at`, mirroring the renderer's cascade exactly:
 * hold the base below the first keyframe, interpolate (or hold, on a `snap`)
 * inside a segment, hold the final keyframe above the last. At a sampled width
 * the result IS that width's keyframe, so a rebase against it is exact wherever
 * the capture measured.
 */
export function frameAt(geo: L1Geometry, at: number): GeometryRect {
  const f = geo.keyframes
  const rect = (k: L1Keyframe): GeometryRect => ({ x: k.x, y: k.y, width: k.width, height: k.height ?? 0 })
  if (at <= f[0].at) return rect(f[0])
  for (let i = 0; i < f.length - 1; i++) {
    const a = f[i]
    const b = f[i + 1]
    if (at >= a.at && at < b.at) {
      if ((geo.segments?.[i] ?? 'interpolate') === 'snap') return rect(a)
      const t = b.at === a.at ? 0 : (at - a.at) / (b.at - a.at)
      const mix = (u: number, v: number): number => u + (v - u) * t
      return {
        x: mix(a.x, b.x),
        y: mix(a.y, b.y),
        width: mix(a.width, b.width),
        height: mix(a.height ?? 0, b.height ?? 0),
      }
    }
  }
  return rect(f[f.length - 1])
}

/**
 * BUG-142 — the inset a painted surface puts between its border box and the
 * corner its absolutely-placed descendants are positioned from.
 *
 * The renderer emits real CSS borders (`border`, then `border-left` for a card's
 * accent rule, which wins on that side) and sets `box-sizing: border-box`, so the
 * padding box a descendant is placed from is the captured rect inset by the
 * border. A 4px accent left un-subtracted would shift every word on the card.
 */
export function surfaceBorderInset(axes: L1SurfaceAxes | undefined): {
  top: number
  right: number
  bottom: number
  left: number
} {
  const b = typeof axes?.border?.widthPx === 'number' ? axes.border.widthPx : 0
  const l = typeof axes?.borderLeft?.widthPx === 'number' ? axes.borderLeft.widthPx : b
  return { top: b, right: b, bottom: b, left: l }
}

/**
 * BUG-142 — re-express `node`'s track inside `parent`'s content box.
 *
 * Three things travel with the origin:
 *
 *  - the KEYFRAMES, which become parent-relative (that is the whole change);
 *  - the COLUMN ANCHOR (REQ-88), whose `x = origin + px + fraction * extent` is
 *    read against the page. It survives intact inside a full-bleed panel, where
 *    parent-relative and page-relative are the same thing, and is dropped inside
 *    one that is not — the keyframes it was fitted to remain, and they are now a
 *    small offset INSIDE a panel that is itself anchored, which is the better
 *    reading of the same geometry;
 *  - the VIEWPORT-HEIGHT RESPONSE (REQ-88), which composes: a child inside a
 *    panel that travels keeps the difference, so the pair still resolves to the
 *    response the capture measured. A child the capture measured as not
 *    responding stays that way — a counter-response to its panel would be a
 *    number nothing measured.
 */
export function rebaseInto(node: L1Node, parentGeo: L1Geometry, axes: L1SurfaceAxes | undefined): L1Node {
  const geo = 'geometry' in node ? node.geometry : undefined
  if (!geo) return node
  const inset = surfaceBorderInset(axes)
  const keyframes = geo.keyframes.map((kf) => {
    const origin = frameAt(parentGeo, kf.at)
    const next: L1Keyframe = {
      ...kf,
      x: round2(kf.x - origin.x - inset.left),
      y: round2(kf.y - origin.y - inset.top),
    }
    // REQ-351 (issue 4) — composed AT THIS WIDTH, against the parent's response at
    // the same width. Node-level, the pair could be composed against a factor the
    // parent only has somewhere else on the ladder.
    const parentY = responseAt(parentGeo, kf.at)?.yFactor
    if (parentY !== undefined && next.viewportResponse) {
      const y = (next.viewportResponse.yFactor ?? 0) - parentY
      const response: L1ViewportResponse = {}
      if (Math.abs(y) >= 0.005) response.yFactor = y
      if (next.viewportResponse.heightFactor !== undefined) {
        response.heightFactor = next.viewportResponse.heightFactor
      }
      if (response.yFactor !== undefined || response.heightFactor !== undefined) {
        next.viewportResponse = response
      } else delete next.viewportResponse
    }
    return next
  })
  const next: L1Geometry = { ...geo, keyframes }
  const fullBleed = inset.left === 0 && parentGeo.keyframes.every((k) => Math.abs(k.x) < 0.5)
  if (next.anchor && !fullBleed) delete next.anchor
  return { ...node, geometry: next } as L1Node
}
