import type { ModuleMeta } from '../types'
import { LOGO_FONT_DIAL, LOGO_TREATMENT_DIAL, SPACING_DIAL, SURFACE_DIAL } from '../dials'

/** `header` — top navigation chrome (DOC-7 §5 `top-tabs`-style nav). */
export const headerMeta = {
  id: 'header',
  version: 1,
  variants: ['top-nav'],
  dials: {
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    // Wordmark font-family + colour treatment (REQ-24). Apply only when the
    // logo is a text wordmark, not an image.
    logoFont: LOGO_FONT_DIAL,
    logoTreatment: LOGO_TREATMENT_DIAL,
  },
  contentSchema: {
    // AssetRef for an image logo, or a plain string for a wordmark.
    logo: { type: 'asset-ref', required: false },
    // List of NavEntry ({ label, target }).
    entries: { type: 'list', required: true },
  },
} as const satisfies ModuleMeta
