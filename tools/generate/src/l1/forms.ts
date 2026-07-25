/**
 * REQ-93 — captured form controls → a **behavior-module binding**.
 *
 * A captured marketing page is routinely 100% L1 layout plus one behaviour. The
 * fold is right to refuse to synthesize raw `<input>` leaves — a form control
 * belongs to a vetted behavior module, not to L1 (DOC-25/26) — but that left the
 * behavioural half of every reproduction stranded as a `field` residual.
 *
 * This module closes that gap on the *derivation* side: it groups the captured
 * controls into the forms they visibly belong to, and derives each form's
 * `contact-form` config from what the capture already carries — the a11y tree's
 * `accessibleName` (the field label), the control's type where the capture
 * recorded it, and the enclosing form's `action`. The fold turns each group into
 * a `slot` node at the group's union rect; the page binds a module instance to
 * that slot by name.
 *
 * **Nothing is invented.** Where the capture does not carry a fact — an
 * endpoint, an input type — the derivation records a residual and falls back to
 * an honest default rather than fabricating one.
 */
import { isSafeUrl, type L1Node } from '@1stcontact/site-schema'
import type { ValueElement } from '../cli/capture'

/** A captured box, as the capture records it. */
interface Box {
  x: number
  y: number
  width: number
  height: number
}

/** One control at one sampled width. */
export interface ControlSample {
  /** The sampled viewport width. */
  at: number
  element: ValueElement
  box: Box
}

/** One control across the ladder — a responsive-table row that classified as a control. */
export interface ControlRow {
  /** Ascending by width; every sample carries a box. */
  samples: ControlSample[]
}

/** One derived field of a form's `contact-form` config. */
export interface FoldedFormField {
  /** Submission key — slugified from the label, unique within the form. */
  name: string
  /** Human label — the a11y tree's accessible name for the control. */
  label: string
  type: 'text' | 'email' | 'tel' | 'textarea'
  /**
   * Where the reference renders this control's label. The a11y tree's
   * `nameSource` is the only witness to the difference between a label ABOVE the
   * box and the same words INSIDE it as a placeholder — no painted axis can hold
   * it, because in both cases the pixels are just text near a box.
   *
   * Ignoring it does more than mis-style: a label row the reference never had
   * pushes every field below it down, so the whole form drifts.
   */
  labelMode: 'visible' | 'placeholder'
}

/** A form the fold recovered: the slot it mounts at, plus its derived config. */
export interface FoldedForm {
  /** The `slot` node name the fold emitted for this group. */
  slot: string
  /** The behavior module this form binds ( `contact-form`). */
  behavior: 'contact-form'
  fields: FoldedFormField[]
  /**
   * The captured submission endpoint. Absent when the capture carries none — the
   * form then posts to its own URL (the browser default), which is what a page
   * whose endpoint we never saw honestly does. See {@link residuals}.
   */
  action?: string
  /**
   * The captured submit affordance, as the L1 subtree that gives the module's
   * button its look — bound to the behavior's `submit` slot (DOC-25 §2).
   *
   * A reference's submit control is captured as a *painted run* (text + pill), so
   * the fold emits it as an ordinary text leaf. Left there it is a page-level
   * decoration sitting next to a form that renders its own default button —
   * two buttons, one of them inert. Lifting it into the slot makes the captured
   * chip **be** the form's button: one control, the reference's look, and the
   * module's submit behaviour intact.
   *
   * Absolute geometry is deliberately dropped on the way in. The module places
   * its own button, and page-absolute keyframes inside the slot would resolve
   * against the slot's origin rather than the page's.
   */
  submit?: L1Node
  /**
   * What the capture could not tell us about this form. These are *derivation*
   * gaps (a missing endpoint, an unrecorded input type) — deliberately NOT
   * {@link FoldResidual}s, which name gaps in L1's expressive power. Conflating
   * the two would make a form the fold successfully mounted still read as an
   * un-foldable field.
   */
  residuals: string[]
}

/**
 * How near two controls must be to belong to the same form, as a multiple of the
 * median control height at the clustering width.
 *
 * The capture reads painted geometry, not the DOM's `<form>` boundaries, so
 * grouping is geometric. A form's own fields sit a small gutter apart (one
 * `gap`), while two *different* forms are separated by a column break or a
 * section's worth of vertical rhythm — on the reference page, 16px within a form
 * against 263px (side-by-side columns) or 108px (stacked at mobile) between them.
 * 1.5x the median control height sits an order of magnitude clear of both edges.
 */
const CLUSTER_GAP_FACTOR = 1.5

/** Shortest distance between two rects (0 when they touch or overlap). */
function rectDistance(a: Box, b: Box): number {
  const dx = Math.max(0, Math.max(a.x, b.x) - Math.min(a.x + a.width, b.x + b.width))
  const dy = Math.max(0, Math.max(a.y, b.y) - Math.min(a.y + a.height, b.y + b.height))
  return Math.hypot(dx, dy)
}

function median(ns: number[]): number {
  const sorted = [...ns].sort((a, b) => a - b)
  return sorted.length === 0 ? 0 : sorted[Math.floor(sorted.length / 2)]
}

/** The sample of `row` at the widest width it appears at. */
function widestSample(row: ControlRow): ControlSample | undefined {
  return row.samples[row.samples.length - 1]
}

/**
 * Group control rows into the forms they visibly belong to, clustering at the
 * **widest** sampled width — the width at which a multi-column layout is most
 * separated, so two side-by-side forms are furthest from being confused for one.
 * Groups come back in document order (top-to-bottom, then left-to-right).
 */
export function clusterControls(rows: ControlRow[]): ControlRow[][] {
  const boxes = rows.map((r) => widestSample(r)?.box)
  const indexed = rows.map((r, i) => ({ row: r, box: boxes[i] })).filter((e) => e.box) as Array<{
    row: ControlRow
    box: Box
  }>
  if (indexed.length === 0) return []
  const threshold = CLUSTER_GAP_FACTOR * median(indexed.map((e) => e.box.height))

  // Union-find over "near enough to be the same form".
  const parent = indexed.map((_, i) => i)
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])))
  for (let i = 0; i < indexed.length; i++) {
    for (let j = i + 1; j < indexed.length; j++) {
      if (rectDistance(indexed[i].box, indexed[j].box) <= threshold) parent[find(i)] = find(j)
    }
  }

  const groups = new Map<number, Array<{ row: ControlRow; box: Box }>>()
  indexed.forEach((entry, i) => {
    const key = find(i)
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(entry)
  })
  const order = (b: Box): number => b.y * 100_000 + b.x
  return [...groups.values()]
    .map((members) => members.sort((a, b) => order(a.box) - order(b.box)))
    .sort((a, b) => order(a[0].box) - order(b[0].box))
    .map((members) => members.map((m) => m.row))
}

/**
 * Reduce a captured button run to the subtree that belongs in a `submit` slot:
 * everything about how it *looks*, nothing about where the page put it.
 *
 * `geometry` and `visibility` are dropped because the module owns placement —
 * the keyframes are page-absolute and would resolve against the slot's own
 * origin. The type axes, the pill's fill and rounding, the padding and the
 * unbreakable-line pin all survive, because those are the button's appearance.
 */
export function submitSlotFrom(node: L1Node): L1Node {
  const rest: Record<string, unknown> = { ...(node as unknown as Record<string, unknown>) }
  delete rest.geometry
  delete rest.visibility
  return rest as unknown as L1Node
}

/** Shortest distance between two rects — exported for the fold's submit matching. */
export function boxDistance(a: Box, b: Box): number {
  return rectDistance(a, b)
}

/**
 * How near a captured button must sit to a form's fields to *be* that form's
 * submit control, on the same scale as {@link CLUSTER_GAP_FACTOR}. On the
 * reference page the gap is 22px (stacked) and 12px (inline) against a 75px
 * threshold, while the nearest *other* form's button is 128px and 263px away —
 * so the rule separates the two forms by an order of magnitude, not a hair.
 */
export function submitProximityThreshold(controlHeights: number[]): number {
  return CLUSTER_GAP_FACTOR * median(controlHeights)
}

/** Slugify a label into a submission key. */
function slugify(label: string): string {
  return label
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Map a captured input type onto the `contact-form` field-type enum. */
function typeFromControlType(controlType: string): FoldedFormField['type'] | undefined {
  const t = controlType.trim().toLowerCase()
  if (t === 'textarea') return 'textarea'
  if (t === 'email') return 'email'
  if (t === 'tel') return 'tel'
  if (t === 'text' || t === 'search' || t === 'url' || t === 'number') return 'text'
  return undefined
}

/**
 * Derive one form's `contact-form` config from its captured controls.
 *
 * - `label` is the a11y tree's accessible name, whatever named the control
 *   (placeholder, `<label>`, `aria-label`). An unnamed control still becomes a
 *   field — it is visibly there — under a positional label, with a residual.
 * - `type` comes from the control's captured input type when the bundle records
 *   one; otherwise from height, the only other evidence a resting capture holds:
 *   a control taller than a single-line box is a `textarea`.
 * - `action` is the captured form action. Absent, the form posts to its own URL
 *   (the browser default) and the gap is recorded — never a fabricated endpoint.
 */
export function foldedFormFor(slot: string, group: ControlRow[]): FoldedForm {
  const residuals: string[] = []
  const samples = group.map((row) => widestSample(row)!).filter(Boolean)
  const singleLineHeight = Math.min(...samples.map((s) => s.box.height))

  const used = new Set<string>()
  const fields: FoldedFormField[] = samples.map((sample, i) => {
    const el = sample.element
    const label = (el.accessibleName ?? '').trim()
    if (!label) residuals.push(`control ${i + 1} has no accessible name in the capture`)
    const captured = el.controlType ? typeFromControlType(el.controlType) : undefined
    if (!captured && !el.controlType) {
      residuals.push(
        `control ${i + 1} carries no input type — inferred from height ` +
          `(re-capture with \`1c capture page\` to record it)`,
      )
    }
    // A control materially taller than the form's shortest is a multi-line box.
    const type = captured ?? (sample.box.height >= 1.5 * singleLineHeight ? 'textarea' : 'text')
    let name = slugify(label) || `field-${i + 1}`
    while (used.has(name)) name = `${name}-${i + 1}`
    used.add(name)
    const labelMode = el.nameSource === 'placeholder' ? 'placeholder' : 'visible'
    return { name, label: label || `Field ${i + 1}`, type, labelMode }
  })

  const form: FoldedForm = { slot, behavior: 'contact-form', fields, residuals }
  const captured = samples.map((s) => s.element.formAction).find((a) => a && a.trim() !== '')
  if (captured && isSafeUrl(captured)) form.action = captured
  else if (captured) residuals.push(`captured form action '${captured}' is not a safe URL — dropped`)
  else {
    residuals.push(
      'no form action captured — the form posts to its own URL; ' +
        'set the endpoint on the reproduced site before it collects real leads',
    )
  }
  return form
}
