import type { ModuleMeta } from '../types'
import { ALIGN_DIAL, SPACING_DIAL, SURFACE_DIAL, WIDTH_DIAL } from '../dials'

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
  },
  contentSchema: {
    heading: { type: 'string', required: false },
    subhead: { type: 'markdown', required: false },
    action: { type: 'url', required: true },
    // Each field: { name, label, type: text|email|tel|textarea, required }.
    fields: { type: 'list', required: true, minItems: 1, maxItems: 8 },
    submitLabel: { type: 'string', required: false },
    successMessage: { type: 'markdown', required: false },
  },
} as const satisfies ModuleMeta
