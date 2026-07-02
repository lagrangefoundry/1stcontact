import type { ModuleMeta } from '../types'

/**
 * `layer` — a standalone art-directed section (REQ-15). The module itself is a
 * bare positioning host with no content of its own; its freely-positioned
 * children live in the instance's structured `layer` field, composited over the
 * host by the framework's `wrapWithLayer`. Use `{ type: 'layer', layer: {…} }`
 * for a pure art-directed band; attach a `layer` field to any other module to
 * composite a layer over that module instead.
 */
export const layerMeta = {
  id: 'layer',
  version: 1,
  variants: ['default', 'full'],
  dials: {},
  contentSchema: {},
} as const satisfies ModuleMeta
