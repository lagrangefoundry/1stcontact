import type { L1Node } from '@1stcontact/site-schema'

/**
 * L2 — the optional library of **vetted L1 designs** ([[DOC-24]]).
 *
 * REQ-96 deleted `contact-form`'s stylesheet, because a module that paints its
 * own controls can never be layout-agnostic. That has a real cost: a form
 * authored without a capture to transcribe would have no look at all, so every
 * site would pay authoring cost for something that used to be drop-in.
 *
 * The stylesheet is therefore **relocated, not deleted** — here, as an L1
 * subtree a caller can drop straight into the module's `form` slot. The default
 * look becomes a *starting point* instead of a *ceiling*: it is ordinary L1, so
 * an author edits, replaces, or ignores it exactly as they would any other
 * subtree. This is the same move the pivot already made for layout modules
 * ([[DOC-14]] → [[DOC-23]]).
 */

/** The subset of a `contact-form` field the preset needs to lay one out. */
export interface ContactFormPresetField {
  name: string
  label: string
  labelMode?: 'visible' | 'placeholder'
  type?: 'text' | 'email' | 'tel' | 'textarea'
}

/** Overrides for the preset's few design constants. */
export interface ContactFormPresetOptions {
  /** Body/label text colour. */
  color?: string
  /** Field surface fill. */
  fieldFill?: string
  /** Field border colour. */
  borderColor?: string
  /** Corner rounding of fields and the submit button. */
  radiusPx?: number
  /** Submit button fill. */
  submitFill?: string
  /** Submit button label colour. */
  submitColor?: string
  /** Single-line control height; a textarea gets three times the content box. */
  fieldHeightPx?: number
  /** Vertical rhythm between fields. */
  gapPx?: number
}

const DEFAULTS = {
  color: '#0f172b',
  fieldFill: '#ffffff',
  borderColor: '#e5e7eb',
  radiusPx: 8,
  submitFill: '#0f172b',
  submitColor: '#ffffff',
  fieldHeightPx: 44,
  gapPx: 16,
} satisfies Required<ContactFormPresetOptions>

/**
 * A vetted default presentation for a `contact-form` instance: a stacked column
 * of labelled fields with a submit button, as plain L1.
 *
 * Flowed rather than keyframed — a preset has no capture behind it, so it has no
 * per-width geometry to pin and must lay itself out from sizing and gaps like any
 * hand-authored L1. A field labelled by its placeholder gets no text run (the
 * module puts the words in the box); a visibly-labelled one gets a run above it.
 */
export function contactFormPreset(
  fields: readonly ContactFormPresetField[],
  opts: ContactFormPresetOptions = {},
): L1Node {
  const o = { ...DEFAULTS, ...opts }
  const children: L1Node[] = []

  for (const field of fields) {
    const control: L1Node = {
      kind: 'control',
      control: field.name,
      axes: {
        color: o.color,
        fontSizePx: 16,
        surfaceFill: o.fieldFill,
        borderRadiusPx: o.radiusPx,
        border: { widthPx: 1, color: o.borderColor },
      },
      // REQ-99 — the preset is a *vetted* default, so it authors the interaction
      // treatment too: a field that only responds when the user agent decides to
      // is exactly the ceiling the ticket names. The ring colour is the field's
      // own accent rather than the UA's, and the border warms on hover.
      interaction: {
        transition: { durationMs: 120, easing: 'ease-out' },
        hover: { border: { widthPx: 1, color: o.color } },
        focus: { ring: { widthPx: 2, color: o.submitFill, offsetPx: 2 } },
      },
      padding: { topPx: 12, rightPx: 12, bottomPx: 12, leftPx: 12 },
      sizing: {
        width: { mode: 'fluid' },
        height: {
          mode: 'fixed',
          px: field.type === 'textarea' ? o.fieldHeightPx * 3 : o.fieldHeightPx,
        },
      },
    }
    if (field.labelMode === 'placeholder') {
      children.push(control)
      continue
    }
    children.push({
      kind: 'container',
      layout: 'stack',
      gapPx: 8,
      children: [
        { kind: 'text', text: field.label, axes: { color: o.color, fontSizePx: 14, fontWeight: 500 } },
        control,
      ],
    })
  }

  children.push({
    kind: 'control',
    control: 'submit',
    axes: {
      color: o.submitColor,
      fontSizePx: 16,
      fontWeight: 600,
      textAlign: 'center',
      surfaceFill: o.submitFill,
      borderRadiusPx: o.radiusPx,
    },
    interaction: {
      transition: { durationMs: 120, easing: 'ease-out' },
      hover: { opacity: 0.9, motion: { offsetYPx: -1 } },
      focus: { ring: { widthPx: 2, color: o.submitFill, offsetPx: 2 } },
    },
    padding: { topPx: 12, rightPx: 24, bottomPx: 12, leftPx: 24 },
    sizing: { width: { mode: 'hug' } },
  })

  return { kind: 'container', layout: 'stack', gapPx: o.gapPx, children }
}
