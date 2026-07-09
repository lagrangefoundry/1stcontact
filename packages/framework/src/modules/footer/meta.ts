import type { ModuleMeta } from '../types'
import { FOOTER_LAYOUT_DIAL, SPACING_DIAL, SURFACE_DIAL } from '../dials'

/** `footer` — minimal site footer. */
export const footerMeta = {
  id: 'footer',
  version: 1,
  variants: ['minimal'],
  dials: {
    surface: SURFACE_DIAL,
    // `spread` justifies copyright / links to opposite ends (vs centred stack).
    layout: FOOTER_LAYOUT_DIAL,
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
  },
  contentSchema: {
    logo: { type: 'asset-ref', required: false },
    tagline: { type: 'string', required: false },
    copyrightHolder: { type: 'string', required: true },
    // List of NavEntry ({ label, target }).
    links: { type: 'list', required: false },
    // Social links (REQ-36) — { icon, href, label } rendered as bordered icon
    // circles; `icon` is a glyph in the site's brand icon font.
    social: { type: 'list', required: false },
  },
} as const satisfies ModuleMeta
