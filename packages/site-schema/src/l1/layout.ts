/**
 * REQ-104 — resolving a container's layout mode at a viewport width.
 *
 * Lives in site-schema rather than in either consumer because BOTH have to agree
 * on it: the renderer compiles the track to a base rule plus `@media` overrides,
 * and the analytic evaluator (`tools/generate/src/l1/probes.ts`) has to model the
 * same flow it emits. Two copies of this three-line cascade is exactly the kind of
 * drift that makes the analytic gate report phantom findings — the model must
 * mirror the renderer, not approximate it.
 */
import type { L1Container, L1LayoutMode } from './types'

/**
 * The layout mode in force at `viewportWidth`.
 *
 * The first keyframe's mode is the base — in force below its own `at`, exactly as
 * the renderer's base rule is — and each later keyframe takes over from its `at`
 * upward (`min-width` semantics: inclusive). With no track the static `layout`
 * stands at every width.
 */
export function resolveLayoutMode(node: L1Container, viewportWidth: number): L1LayoutMode {
  const keyframes = node.responsiveLayout?.keyframes
  if (!keyframes || keyframes.length === 0) return node.layout
  let mode = keyframes[0].value
  for (const kf of keyframes) {
    if (viewportWidth >= kf.at) mode = kf.value
  }
  return mode
}
