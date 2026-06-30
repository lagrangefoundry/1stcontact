import type { ModuleMeta } from '../types'
import { SPACING_DIAL, SURFACE_DIAL } from '../dials'

/** `header` — top navigation chrome (DOC-7 §5 `top-tabs`-style nav). */
export const headerMeta = {
  id: 'header',
  version: 1,
  variants: ['top-nav'],
  dials: {
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
  },
  contentSchema: {
    // AssetRef for an image logo, or a plain string for a wordmark.
    logo: { type: 'asset-ref', required: false },
    // List of NavEntry ({ label, target }).
    entries: { type: 'list', required: true },
  },
} as const satisfies ModuleMeta
