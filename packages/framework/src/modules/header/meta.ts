import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  GRADIENT_DIRECTION_DIAL,
  LOGO_FONT_DIAL,
  LOGO_SIZE_DIAL,
  LOGO_TREATMENT_DIAL,
  SPACING_DIAL,
  SURFACE_DIAL,
  TREATMENT_ROLE_DIAL,
} from '../dials'

/** `header` — top navigation chrome (DOC-7 §5 `top-tabs`-style nav). */
export const headerMeta = {
  id: 'header',
  version: 1,
  // `overlay` (REQ-25) renders transparent chrome the render pipeline floats
  // over the following section's band, so header + hero share one image band.
  variants: ['top-nav', 'overlay'],
  dials: {
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    // Horizontal placement of the wordmark/nav within the header band (REQ-29).
    // `center` groups the content centrally (e.g. a centered wordmark).
    align: ALIGN_DIAL,
    // Wordmark font-family + colour treatment (REQ-24). Apply only when the
    // logo is a text wordmark, not an image.
    logoFont: LOGO_FONT_DIAL,
    logoTreatment: LOGO_TREATMENT_DIAL,
    // Wordmark size (REQ-20 import) — `xl` reads at display/hero scale.
    logoSize: LOGO_SIZE_DIAL,
  },
  contentSchema: {
    // AssetRef for an image logo, or a plain string for a wordmark.
    logo: { type: 'asset-ref', required: false },
    // List of NavEntry ({ label, target }).
    entries: { type: 'list', required: true },
    // Structured gradient for the `gradient` logoTreatment (REQ-32): a direction
    // plus ≥2 palette-role stops. Read only when `logoTreatment` is `gradient`.
    logoGradient: {
      type: 'object',
      required: false,
      itemSchema: {
        direction: { type: 'enum', required: true, values: GRADIENT_DIRECTION_DIAL },
        stops: {
          type: 'list',
          required: true,
          minItems: 2,
          itemSchema: {
            role: { type: 'enum', required: true, values: TREATMENT_ROLE_DIAL },
          },
        },
      },
    },
  },
} as const satisfies ModuleMeta
