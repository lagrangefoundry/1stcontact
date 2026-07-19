import type { ModuleMeta } from '../types'
import { FOOTER_LAYOUT_DIAL, FOOTER_SURFACE_DIAL, SPACING_DIAL, TREATMENT_ROLE_DIAL } from '../dials'

/** `footer` — minimal site footer. */
export const footerMeta = {
  id: 'footer',
  version: 1,
  variants: ['minimal'],
  dials: {
    surface: FOOTER_SURFACE_DIAL,
    // `spread` justifies copyright / links to opposite ends (vs centred stack).
    layout: FOOTER_LAYOUT_DIAL,
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    // Footer body/copyright colour (REQ-58) — absolute-or-overlay: a palette role
    // (listed here) OR an absolute #hex; unset keeps the surface default.
    textColor: TREATMENT_ROLE_DIAL,
    // Footer link colour (REQ-58) — a palette role OR an absolute #hex; unset
    // inherits the footer text colour.
    linkColor: TREATMENT_ROLE_DIAL,
  },
  contentSchema: {
    logo: { type: 'asset-ref', required: false },
    tagline: { type: 'string', required: false },
    copyrightHolder: { type: 'string', required: true },
    // Verbatim copyright line (REQ-58) — overrides the generated `© {year}
    // {holder}` when a site's format/year differs.
    copyright: { type: 'string', required: false },
    // List of NavEntry ({ label, target }).
    links: { type: 'list', required: false },
    // Social links (REQ-36) — { icon, href, label } rendered as bordered icon
    // circles; `icon` is a glyph in the site's brand icon font.
    social: { type: 'list', required: false },
  },
} as const satisfies ModuleMeta
