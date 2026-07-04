import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  SPACING_DIAL,
  SUBHEAD_SIZE_DIAL,
  SUBMIT_FOREGROUND_DIAL,
  SUBMIT_TREATMENT_DIAL,
  SURFACE_DIAL,
  WIDTH_DIAL,
} from '../dials'

/**
 * `contact-form` — lead-capture form. Server-rendered and fully functional
 * without JS (submits to `action` and reloads); progressively enhanced to a
 * JSON `fetch` when JS runs (see `enhance.ts`).
 *
 * This REQ renders the form and its mount points only. The real handler
 * (D1 INSERT + email) and the Turnstile widget are wired in REQ-7 — the form
 * carries a `data-turnstile-target` mount point and a honeypot field so that
 * later work has somewhere to attach without re-touching the module.
 */
export const contactFormMeta = {
  id: 'contact-form',
  version: 1,
  variants: ['inline'],
  dials: {
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    align: ALIGN_DIAL,
    // `half` flexes the band into one of two columns (REQ-20) — consecutive
    // half-width bands are grouped into a shared row by the render pipeline.
    width: WIDTH_DIAL,
    // Submit-button colour treatment (REQ-33) — `primary` (default) or a dark
    // `neutral` button.
    submitTreatment: SUBMIT_TREATMENT_DIAL,
    // Submit-label foreground (REQ-45) — `auto` (default) keeps the label colour
    // the treatment derives from its surface; any palette role (e.g. `bg` for a
    // legible white on-primary label) paints the label instead of inheriting a
    // surface tint that renders cream.
    submitForeground: SUBMIT_FOREGROUND_DIAL,
    // Subhead size (REQ-45) — sizes the "Join our mailing list…" intro; `md`
    // (default) preserves the prior size, `sm`/`lg` step it down/up.
    subheadSize: SUBHEAD_SIZE_DIAL,
    // Caption size (REQ-45) — sizes the small caption slot (e.g. "More to
    // come…") independently of the subhead; `sm` reads as fine print.
    captionSize: SUBHEAD_SIZE_DIAL,
  },
  contentSchema: {
    heading: { type: 'string', required: false },
    subhead: { type: 'markdown', required: false },
    action: { type: 'url', required: true },
    // Each field: { name, label, type: text|email|tel|textarea, required }.
    fields: { type: 'list', required: true, minItems: 1, maxItems: 8 },
    submitLabel: { type: 'string', required: false },
    successMessage: { type: 'markdown', required: false },
    // Small caption below the form (REQ-45) — e.g. "More to come…"; sized by the
    // `captionSize` dial. Optional, so a form without one renders as before.
    caption: { type: 'markdown', required: false },
  },
} as const satisfies ModuleMeta
