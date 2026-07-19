import type { ModuleMeta } from '../types'
import {
  ALIGN_DIAL,
  FIELD_LABELS_DIAL,
  SPACING_DIAL,
  SUBMIT_INLINE_DIAL,
  SUBMIT_TREATMENT_DIAL,
  SURFACE_DIAL,
  TREATMENT_ROLE_DIAL,
  WIDTH_DIAL,
} from '../dials'

/**
 * `contact-form` — lead-capture form. Server-rendered and fully functional
 * without JS (submits to `action` and reloads); progressively enhanced to a
 * JSON `fetch` when JS runs (see `enhance.ts`).
 *
 * REQ-50: the `heading` and `submitLabel` are flat styled runs (the button
 * label's colour now lives on `submitLabel.color`, replacing the old
 * `submitForeground` dial); the markdown `subhead`/`caption` stay prose and take
 * their typography from style-only `subheadStyle`/`captionStyle` runs. The button
 * *fill* stays a structural `submitTreatment` dial (a surface, not a text axis).
 */
export const contactFormMeta = {
  id: 'contact-form',
  version: 2,
  variants: ['inline'],
  dials: {
    spacingTop: SPACING_DIAL,
    spacingBottom: SPACING_DIAL,
    surface: SURFACE_DIAL,
    align: ALIGN_DIAL,
    // `half` flexes the band into one of two columns (REQ-20).
    width: WIDTH_DIAL,
    // Submit-button *fill* treatment (REQ-33) — `primary` (brand) or dark
    // `neutral`. The button surface, not a text axis, so it stays a dial.
    submitTreatment: SUBMIT_TREATMENT_DIAL,
    // Submit-button fill colour (REQ-58) — the absolute-or-overlay escape hatch
    // over `submitTreatment`: a palette role (listed here) OR an absolute #hex.
    submitColor: TREATMENT_ROLE_DIAL,
    // Submit layout (REQ-58) — `inline` lays a single field + button on one row;
    // `stacked` (default) stacks the button below the fields.
    submitInline: SUBMIT_INLINE_DIAL,
    // Field labelling (REQ-58) — `above` (default) stacks a visible <label>;
    // `placeholder` moves the label into the input placeholder and visually
    // hides the <label> (kept for a11y). The compact single-column form motif.
    fieldLabels: FIELD_LABELS_DIAL,
  },
  contentSchema: {
    // Discrete styled run (REQ-50).
    heading: { type: 'styled-text', required: false },
    // Prose intro (REQ-50) — markdown + a style-only style run.
    subhead: { type: 'markdown', required: false },
    subheadStyle: { type: 'styled-text', required: false },
    action: { type: 'url', required: true },
    // Each field: { name, label, type: text|email|tel|textarea, required }.
    fields: { type: 'list', required: true, minItems: 1, maxItems: 8 },
    // Submit button label (REQ-50) — a styled run; its `color` paints the label
    // (replacing the former `submitForeground` dial).
    submitLabel: { type: 'styled-text', required: false },
    successMessage: { type: 'markdown', required: false },
    // Small caption below the form (REQ-45) — markdown + a style-only style run.
    caption: { type: 'markdown', required: false },
    captionStyle: { type: 'styled-text', required: false },
  },
} as const satisfies ModuleMeta
