/**
 * The **edit bridge's definition half** (REQ-117; DOC-28 §5.2, §9.1).
 *
 * REQ-116 gave the renderer the *stamping* half: walking the L1 tree, it writes
 * each editable region's render-scoped address onto the element it emits. This
 * module is everything the other side of that stamp needs, and deliberately
 * nothing else — it is pure data, so the same code serves the client that reads
 * a clicked element, the write path that applies the edit, and any future AI
 * tool that addresses a node the same way.
 *
 * Three things live here, and they are here rather than in the renderer because
 * they are the *contract*, not the rendering of it:
 *
 * - **The attribute names.** One definition site, imported by the emitter that
 *   writes them and the client that reads them, so the two cannot drift.
 * - **The address**, and the single rule that resolves it: index the render's
 *   root node LIST, then `children` at every later step. That one rule covers a
 *   document (`[doc.root]`) and a behavior module's slot (the subtree array)
 *   alike, which is why a slot's copy needs no second addressing scheme.
 * - **The exposed fields of a segment.** DOC-28 §3's exposure rule in code: the
 *   user sees copy and which image goes here, and the derivation is what decides
 *   that. Phase 1 exposes the words and the choice of asset and nothing else —
 *   no axis, no dial, no token name — so there is no path through this module
 *   that can produce anything but a plain string or a pick from a closed list.
 */
import type { L1FontFace, L1Node, L1ScalarTrack } from './types'

// ── the stamp ────────────────────────────────────────────────────────────────

/** The render-scoped address of an editable region, as child indices. */
export const L1_EDIT_PATH_ATTR = 'data-l1-path'
/** Which kind of region it is, so the client knows which editor to open. */
export const L1_EDIT_SEGMENT_ATTR = 'data-l1-segment'
/** Set on `<body>` in the edit channel — the client's "am I in edit mode?" test. */
export const L1_EDIT_MARKER_ATTR = 'data-fc-edit'
/**
 * REQ-117 — the definition `id` of the page this document was rendered from.
 *
 * An address is only half a coordinate: `copy get`/`copy set` need the page too,
 * and the client cannot derive it from the URL. `index.html` is an ALIAS for the
 * home page, so the file name is not the id; resolving it would mean the client
 * re-implementing the renderer's home-page rule and drifting from it. The render
 * already carries every other part of the address, so it carries this part too.
 *
 * It is the `id`, never the `slug`: the slug names the file, the id is what
 * `findPageFile` matches, and the two are free to differ.
 */
export const L1_EDIT_PAGE_ATTR = 'data-fc-page'
/** Names the behavior-module instance an address is rooted in (CHAT-9 M1). */
export const L1_EDIT_MODULE_ATTR = 'data-fc-module'
/** Names the slot within that instance whose subtree array the address indexes. */
export const L1_EDIT_SLOT_ATTR = 'data-l1-slot'
/**
 * REQ-117 — the segment under the pointer. The client puts this class on; the
 * edit channel's stylesheet says what it looks like. Both need the name, and
 * neither owns it, so it lives with the rest of the stamp's vocabulary.
 */
export const L1_EDIT_HOT_CLASS = 'l1-edit-hot'

/** The kinds of region the editor exposes controls for (DOC-28 §6.2). */
export type L1SegmentKind = 'copy' | 'image' | 'container' | 'module'

// ── the address ──────────────────────────────────────────────────────────────

/**
 * Where an edit lands. `moduleId`/`slot` are absent for a node in the page's own
 * L1 document, and present together for one inside a behavior module's slot —
 * the two are separate address spaces that reuse the same short paths by design
 * (REQ-116), so a path without its scope is ambiguous.
 */
export interface L1EditTarget {
  moduleId?: string
  slot?: string
  path: readonly number[]
}

/**
 * Parse a stamped path. Returns `null` for anything that is not a dotted run of
 * non-negative integers — the client reads this off a DOM attribute, so it is
 * untrusted input and a malformed address must fail closed rather than resolve
 * to some neighbouring node.
 */
export function parseL1Path(raw: string): number[] | null {
  if (raw === '') return null
  const parts = raw.split('.')
  const out: number[] = []
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null
    out.push(Number(part))
  }
  return out
}

/** Render the address back to its attribute form. */
export function formatL1Path(path: readonly number[]): string {
  return path.join('.')
}

/**
 * The **one** resolution rule (REQ-116): index the render's root node list, then
 * walk `children` at each later step. `roots` is `[doc.root]` for a document and
 * the slot's subtree array for a behavior module's fragment.
 */
export function resolveL1Node(
  roots: readonly L1Node[],
  path: readonly number[],
): L1Node | undefined {
  if (path.length === 0) return undefined
  let node: L1Node | undefined = roots[path[0]]
  for (const i of path.slice(1)) {
    const kids: L1Node[] | undefined = (node as { children?: L1Node[] } | undefined)?.children
    node = kids?.[i]
    if (!node) return undefined
  }
  return node
}

/**
 * The write counterpart of {@link resolveL1Node} (REQ-129): put `replacement`
 * where that address resolves, mutating `roots` in place, and report whether the
 * address existed.
 *
 * It lives beside the read rule rather than in the caller precisely because the
 * addressing contract is "the address a listing hands out is the address a write
 * resolves". Two implementations of the walk are two chances for that to stop
 * being true, so the rule stays stated once: index the root list, then walk
 * `children`, and swap at the last step.
 *
 * `replacement` is deliberately untyped-at-the-edge (`L1Node` by declaration,
 * arbitrary JSON in practice). Nothing is checked here — the envelope validator
 * runs over the whole assembled site before a byte is written, which is both the
 * stronger check and the only one whose paths point at the right place.
 */
export function replaceL1Node(
  roots: L1Node[],
  path: readonly number[],
  replacement: L1Node,
): boolean {
  if (path.length === 0) return false
  if (path.length === 1) {
    if (roots[path[0]] === undefined) return false
    roots[path[0]] = replacement
    return true
  }
  const parent = resolveL1Node(roots, path.slice(0, -1))
  const kids: L1Node[] | undefined = (parent as { children?: L1Node[] } | undefined)?.children
  const last = path[path.length - 1]
  if (!kids || kids[last] === undefined) return false
  kids[last] = replacement
  return true
}

// ── the exposed fields ───────────────────────────────────────────────────────

/**
 * One field descriptor, in the shape `mountFields` consumes (DOC-8 §9.3). The
 * modal is that widget, not a hand-rolled form, so this module's whole job is to
 * produce this list — deriving it is the work; rendering it is not ours.
 *
 * `type` is drawn from a closed set, and every member of it is a control that
 * CANNOT produce raw HTML or CSS. That is the exposure rule (DOC-28 §3)
 * expressed as a type: a string control writes plain text, which the renderer
 * escapes (DOC-2); an enum control can only return one of the options this
 * module put in front of the user; and REQ-135's `'integer'`/`'boolean'` are
 * narrower still — a bounded number and a bit. There is no free-form control on
 * this surface, so widening the vocabulary along this axis never widens the
 * *attack* surface, only the expressive one.
 *
 * REQ-135 is the first entry that describes an **axis** rather than content, and
 * the two differ in a way the write side has to respect: an axis can be
 * responsive (`l1TextResponsiveSchema`), so what the user sets is a
 * representative value and what gets written is a whole track. See
 * {@link applyCopyFields}.
 */
export interface L1FieldDescriptor {
  /** Value key — also the key of the change map a Save produces. */
  name: string
  label: string
  type: 'string' | 'enum' | 'integer' | 'boolean'
  /**
   * The closed option list, present iff `type === 'enum'`. `mountFields` renders
   * it as a select and refuses anything outside it; {@link applyCopyFields}
   * enforces the same membership on the write side, so a stale client cannot
   * post an option the segment never offered.
   */
  enum?: readonly string[]
  /**
   * What the options *are*, when knowing that changes how they should be shown
   * (REQ-132). `'image'` says every option is an image handle, which is what
   * lets the client draw the closed list as thumbnails carrying file names
   * instead of a dropdown of paths — a path being a poor thing to choose a
   * picture by, and a meaningless one once assets stop living in a filesystem.
   *
   * A HINT, NEVER A CONSTRAINT. The closed list is `enum` and the write side
   * enforces membership against it ({@link applyCopyFields}); this changes what
   * the same options look like and nothing about which of them may be chosen.
   * The name and shape mirror `mountFields`' own `enum` + `format: 'color'`
   * pairing (its swatch grid), so the descriptor already speaks the vocabulary a
   * thumbnail control would need if it ever moves into the component — and an
   * unrecognised `format` is inert there today, so nothing depends on the move.
   */
  format?: 'image'
  /** Suppresses the widget's empty option — the field must hold a value. */
  required?: boolean
  /** `'textarea'` selects `mountFields`' multi-line control. */
  widget?: 'textarea'
  /**
   * REQ-135 — the inclusive bounds of an `'integer'` field.
   *
   * Advisory in the widget (an unrecognised key is inert there, exactly as
   * `format: 'image'` is) and ENFORCED by {@link applyCopyFields}, which is the
   * only side that has to be right: the client is a second producer of edits, not
   * the authority on them.
   */
  min?: number
  max?: number
  /**
   * REQ-135 — shown, but not editable, because the *site* cannot honour it.
   *
   * The case it exists for is italic on a family that declares no italic face:
   * setting it would get a synthetic oblique from whichever engine happens to
   * render the page. Dropping the field instead would be worse than useless —
   * the absence would read as "this build has no italics" rather than "this
   * site's font has none", and the two have very different fixes. `mountFields`
   * honours `locked` by rendering the row read-only.
   */
  locked?: boolean
}

/**
 * The descriptors for one segment, with the draft's current values.
 *
 * The value type is no longer `string` (REQ-135): a size is a number and italic
 * is a bit, and stringifying them here would mean parsing them back on the write
 * side against a descriptor that already says exactly what they are. They travel
 * as JSON over `/api/copy`, so the types survive the wire unaided.
 */
export interface L1SegmentFields {
  fields: L1FieldDescriptor[]
  values: Record<string, L1FieldValue>
}

/** What a control on this surface can produce. */
export type L1FieldValue = string | number | boolean

/**
 * What the derivation needs that the node itself cannot supply (REQ-118).
 *
 * A `text` run carries its whole editable state; an `image` node carries only
 * the handle it currently points at, and the *choices* are a property of the
 * site, not of the node. Passing them in keeps this module pure data — it never
 * reads a directory — while still letting the picker be a closed list.
 */
export interface L1SegmentFieldOptions {
  /**
   * The site-local image handles a picker may offer, in the exact form an L1
   * `image.src` or a surface's `backgroundImageUrl` holds them (`/assets/<name>`
   * — the same vocabulary the capture fold writes, never a parallel one;
   * DOC-28 §13 Q5). One listing serves both pickers, so the image a segment can
   * sit in front of and the image it can sit *behind* can never disagree about
   * what the site has.
   */
  assets?: readonly string[]
  /**
   * REQ-135 — the document's declared font faces (`l1Document.resources.fonts`),
   * which is what makes weight and italic a CLOSED list rather than a wish.
   *
   * A face binds a family to served glyphs at one weight and style. Offering a
   * weight the site declares no face for does not fail — it gets a *synthetic*
   * one, smeared by the rasteriser, differently in every engine — so the option
   * list is the faces that exist, and nothing else. Passed in for the same reason
   * `assets` is: it is a property of the document, and this module reads no files.
   */
  fonts?: readonly L1FontFace[]
}

/**
 * A run wide enough that a single-line control would hide most of it. The full
 * string is present either way — a form field never truncates its value — but
 * DOC-28 §9.1's guard is that the user can *see* what they typed, and a textarea
 * is what makes that true for copy that overruns its box.
 */
const MULTILINE_AT = 80

/** `widget: 'textarea'` for a value a single-line control would hide most of. */
function widgetFor(value: string): { widget?: 'textarea' } {
  return value.length > MULTILINE_AT || value.includes('\n') ? { widget: 'textarea' } : {}
}

/**
 * The options an image picker offers: the site's assets, plus whatever the node
 * points at now.
 *
 * Including the current handle is not a convenience — it is what stops the modal
 * changing the image behind the user's back. A folded reproduction can hold a
 * handle that is not in `draft/assets/` (a remote URL the fold could not
 * mirror), and a select whose options omit its own value renders with the FIRST
 * option selected. Saving would then silently swap the image for an unrelated
 * one, with the user having touched only the alt text.
 */
function imageChoices(assets: readonly string[], current: string): string[] {
  const seen = new Set(assets)
  if (current !== '') seen.add(current)
  return [...seen].sort()
}

// ── typography (REQ-135) ─────────────────────────────────────────────────────

/**
 * The bounds of the size control, in **pixels**.
 *
 * One control has to reach from a footnote to a full-bleed hero, so the range is
 * wide by intent rather than by omission. It is px because the axis is
 * (`fontSizePx`); the request was phrased in points, and converting would put the
 * control in a unit nothing else in L1 speaks.
 */
const TEXT_SIZE_MIN_PX = 6
const TEXT_SIZE_MAX_PX = 128

/**
 * The family a run actually asks for: the FIRST family of its stack.
 *
 * `axes.fontFamily` holds a full CSS stack as captured
 * (`"Satoshi, Helvetica Neue, Arial, sans-serif"`), while a declared face names
 * one family (`"Satoshi"`). Comparing the two whole is not a near-miss, it is a
 * guaranteed miss — every run on `xgd/home` carries a stack and every face names
 * a bare family, so a naive equality would find no faces anywhere and silently
 * withdraw the weight control from the entire site.
 */
function primaryFamily(stack: string | undefined): string | undefined {
  const first = stack?.split(',')[0]?.trim().replace(/^['"]|['"]$/g, '')
  return first === undefined || first === '' ? undefined : first.toLowerCase()
}

/** Every declared face for the family this run asks for. */
function facesFor(fonts: readonly L1FontFace[], stack: string | undefined): L1FontFace[] {
  const family = primaryFamily(stack)
  if (family === undefined) return []
  return fonts.filter((face) => face.family.trim().toLowerCase() === family)
}

/**
 * The weights offered: every declared weight for the run's family, plus the one
 * the run already carries.
 *
 * The union is the same rule {@link imageChoices} states for handles, and it is
 * not a corner case here either: 10 of the 62 runs on `xgd/home` are set in
 * weight 600, which that site declares no face for. Offering only the declared
 * weights would leave those runs' own value out of their own option list, and a
 * select whose options omit its value renders with the FIRST option selected —
 * so merely opening the modal and saving an unrelated field would re-weight the
 * heading.
 *
 * A face with no `weight` declares nothing about weight (CSS defaults it to 400,
 * but the fold writes what it measured), so it contributes no option.
 */
function weightChoices(faces: readonly L1FontFace[], current: number | undefined): number[] {
  const seen = new Set<number>()
  for (const face of faces) if (face.weight !== undefined) seen.add(face.weight)
  if (current !== undefined) seen.add(current)
  return [...seen].sort((a, b) => a - b)
}

/**
 * The size control's fields, or none when the run declares no size.
 *
 * A run that inherits its size has no base to scale and no honest number to show
 * — the rendered value lives in the browser, not in the node — so it gets no
 * control rather than a fabricated one. Every text run on the measured folds
 * declares a size, so this is a guard, not a hole.
 */
function sizeField(px: number | undefined): L1FieldDescriptor[] {
  if (px === undefined) return []
  return [
    {
      name: 'fontSizePx',
      label: 'Size (px)',
      type: 'integer',
      min: TEXT_SIZE_MIN_PX,
      max: TEXT_SIZE_MAX_PX,
    },
  ]
}

/**
 * The exposed typography of a text run (REQ-135).
 *
 * WHY A BOOLEAN FOR ITALIC AND AN ENUM FOR TRANSFORM. The rule is that a boolean
 * is offered only where the axis is two-valued. `fontStyle` is
 * `normal | italic`, so a checkbox is lossless. `textTransform` is
 * `none | uppercase | lowercase | capitalize`; a checkbox over four values would
 * have to answer "is this uppercase?" for a run set in `capitalize`, and
 * un-ticking it would destroy a setting the user never looked at.
 *
 * The names differ from the axes on purpose where the control is a PROJECTION
 * rather than the axis itself: `italic` is a bit, `fontStyle` is a keyword, and
 * naming the field for the axis would imply the user is choosing the keyword.
 * Where the control *is* the axis (`fontSizePx`, `fontWeight`, `textTransform`)
 * the names match, and {@link applyCopyFields} is the single place that knows
 * which is which.
 */
function typographyFields(
  axes: L1TextAxesView,
  fonts: readonly L1FontFace[],
): { fields: L1FieldDescriptor[]; values: Record<string, L1FieldValue> } {
  const faces = facesFor(fonts, axes.fontFamily)
  const weights = weightChoices(faces, axes.fontWeight)
  const fields: L1FieldDescriptor[] = [...sizeField(axes.fontSizePx)]
  const values: Record<string, L1FieldValue> = {}

  if (axes.fontSizePx !== undefined) values.fontSizePx = axes.fontSizePx

  // A select holding the only value it offers is not a control — it is a label
  // that looks like one. Below two options the field is withdrawn.
  if (weights.length > 1) {
    fields.push({
      name: 'fontWeight',
      label: 'Weight',
      type: 'enum',
      enum: weights.map(String),
      required: true,
    })
    values.fontWeight = String(axes.fontWeight ?? weights[0])
  }

  // Locked ONLY ON POSITIVE EVIDENCE OF ABSENCE: the family declares faces, and
  // none of them is italic. A family that declares no faces at all is being
  // painted by the reader's own system font — which has real italics — so
  // claiming otherwise would disable a control that works. The lock is a
  // statement about a webfont the site ships, and it needs the webfont to be
  // true.
  const lockedItalic = faces.length > 0 && !faces.some((face) => face.style === 'italic')
  fields.push({
    name: 'italic',
    label: 'Italic',
    type: 'boolean',
    ...(lockedItalic ? { locked: true } : {}),
  })
  values.italic = axes.fontStyle === 'italic'

  fields.push({
    name: 'textTransform',
    label: 'Capitalisation',
    type: 'enum',
    enum: TEXT_TRANSFORMS,
    required: true,
  })
  values.textTransform = axes.textTransform ?? 'none'

  return { fields, values }
}

/** The `textTransform` axis's own vocabulary, mirrored as the closed list. */
const TEXT_TRANSFORMS = ['none', 'uppercase', 'lowercase', 'capitalize'] as const

/** The slice of a text run's axes this surface reads and writes. */
interface L1TextAxesView {
  color?: unknown
  fontFamily?: string
  fontSizePx?: number
  fontWeight?: number
  fontStyle?: 'normal' | 'italic'
  textTransform?: (typeof TEXT_TRANSFORMS)[number]
}

/**
 * The background handle a painted surface currently carries, or `undefined` when
 * it carries none (REQ-128).
 *
 * The empty string is deliberately *not* a background: the renderer's `cssUrl`
 * emits nothing for it, so the box paints no image and offering a picker there
 * would be offering to *add* one. Adding is out of scope and unreachable by
 * construction — an unpainted box is not a segment, so it has no address to
 * click — and this is the same rule seen from the other side.
 */
function backgroundHandleOf(node: L1Node): string | undefined {
  if (node.kind !== 'box' && node.kind !== 'container') return undefined
  const url = (node.axes as { backgroundImageUrl?: string } | undefined)?.backgroundImageUrl
  return typeof url === 'string' && url !== '' ? url : undefined
}

/**
 * The exposed fields of a segment, or `null` when it has none — which is what
 * makes "clicking a segment with no editable fields opens nothing" a property of
 * the derivation rather than a check the client has to remember.
 *
 * Phase 1 is copy (REQ-117), image selection (REQ-118) and the container's
 * background image (REQ-128). REQ-135 adds a text run's *typography* — size,
 * weight, italic, capitalisation — which is the first thing this surface exposes
 * that is an **axis** rather than content. Colour (a run's `color`, a panel's
 * `surfaceFill`) is the half still waiting on REQ-133's palette control; it
 * arrives by extending this one function too, so every editor surface keeps
 * deriving from the node rather than accumulating its own idea of what is
 * editable.
 *
 * A text run exposes its words and its type, and neither its colour nor its
 * position: DOC-28 §3's rule is friendly parameters, so geometry stays with the
 * AI. What makes the type controls safe to hand over is that each is closed —
 * a bounded integer, the faces the site actually declares, and the axis's own
 * keyword list — rather than a number a user can type anything into.
 *
 * An image exposes *which image* and its alt text — and deliberately nothing
 * else. Framing (crop, scale, scrim, rotation) is blocked on DOC-28 §13 Q5:
 * the capture fold already writes those fields, and the editor must write the
 * same ones rather than inventing a parallel vocabulary, so they wait until that
 * is confirmed. Everything here is a structured field on the node; no control on
 * this surface touches a file, so choosing an asset can never bake a new one.
 *
 * A painted `box`/`container` exposes its background image and nothing else of
 * its paint. The rest of the surface group (`pattern`, `overlay`,
 * `surfaceGradient`, the fill) is phase 2 for colour's reasons; the background
 * *handle* is a pick from a closed list of the site's assets, which is exactly
 * the control REQ-118 already built. The axis is offered on the segment the user
 * clicks to mean "this panel" — a `text` or `image` node can carry
 * `backgroundImageUrl` too (REQ-98), but exposing it there would make the copy
 * modal a paint surface and blur DOC-28 §6.2's kind→segment map.
 */
export function copyFieldsOf(
  node: L1Node,
  opts: L1SegmentFieldOptions = {},
): L1SegmentFields | null {
  if (node.kind === 'text') {
    const text = node.text
    const type = typographyFields((node.axes ?? {}) as L1TextAxesView, opts.fonts ?? [])
    return {
      // The copy field stays FIRST, and the client keys on it rather than on
      // "the only field" — clicking words has to put the cursor in the words,
      // and it did that by counting fields until this list stopped being one
      // long.
      fields: [{ name: 'text', label: 'Text', type: 'string', ...widgetFor(text) }, ...type.fields],
      values: { text, ...type.values },
    }
  }
  if (node.kind === 'image') {
    const { src, alt } = node
    return {
      fields: [
        {
          name: 'src',
          label: 'Image',
          type: 'enum',
          format: 'image',
          enum: imageChoices(opts.assets ?? [], src),
          required: true,
        },
        { name: 'alt', label: 'Alt text', type: 'string', ...widgetFor(alt) },
      ],
      values: { src, alt },
    }
  }
  const background = backgroundHandleOf(node)
  if (background !== undefined) {
    return {
      fields: [
        {
          name: 'backgroundImageUrl',
          label: 'Background image',
          type: 'enum',
          format: 'image',
          enum: imageChoices(opts.assets ?? [], background),
          // No empty option, and not merely as a nicety. If a box's only paint IS
          // its background image, removing it drops `surfaceDecls` to zero on the
          // next render, the node stops being a segment, and it vanishes from the
          // editor with no way to re-add it. `required` makes that unreachable by
          // construction rather than by a special case; removal stays the AI's
          // job, which addresses the axis directly.
          required: true,
        },
      ],
      values: { backgroundImageUrl: background },
    }
  }
  return null
}

/** Applying an edit either succeeds, naming what changed, or explains why not. */
export type L1CopyEditResult =
  | { ok: true; changed: string[] }
  | { ok: false; field?: string; message: string }

/**
 * Why `value` is not of `field`'s type, or `null` when it is.
 *
 * The descriptor is the authority on both sides — the widget picks a control
 * from `type` and this picks the check from the same key — so a control can
 * never produce a value this refuses, and anything that does came from something
 * other than the control.
 */
function typeError(field: L1FieldDescriptor, value: unknown): string | null {
  if (field.type === 'boolean') {
    return typeof value === 'boolean' ? null : `Field '${field.name}' must be true or false.`
  }
  if (field.type === 'integer') {
    return typeof value === 'number' && Number.isInteger(value)
      ? null
      : `Field '${field.name}' must be a whole number.`
  }
  if (typeof value !== 'string') return `Field '${field.name}' must be a string.`
  if (field.type === 'enum' && !field.enum?.includes(value)) {
    return `'${value}' is not one of this segment's ${field.name} options.`
  }
  return null
}

/**
 * Why `value` is outside `field`'s bounds, or `null` when it is not.
 *
 * **The bound binds a change, never the status quo.** `current` is what the
 * derivation just reported, and a value equal to it is passed regardless: the
 * modal posts every staged field, not only the touched ones, so a run the fold
 * captured at 160px would otherwise be refused — or worse, silently clamped —
 * because someone opened it and edited the words. A range is a statement about
 * what the user may newly ask for, not a claim that every page already complies.
 */
function rangeError(
  field: L1FieldDescriptor,
  value: unknown,
  current: L1FieldValue | undefined,
): string | null {
  if (typeof value !== 'number' || value === current) return null
  if (field.min !== undefined && value < field.min) {
    return `${field.label} must be at least ${field.min} (got ${value}).`
  }
  if (field.max !== undefined && value > field.max) {
    return `${field.label} must be at most ${field.max} (got ${value}).`
  }
  return null
}

/** The field names {@link writeTypography} owns on a `text` node (REQ-135). */
const TYPOGRAPHY_FIELDS: ReadonlySet<string> = new Set([
  'fontSizePx',
  'fontWeight',
  'italic',
  'textTransform',
])

/**
 * Rescale a responsive track so its widest keyframe becomes `to`.
 *
 * THE POINT OF THE WHOLE SIZE CONTROL. A track is a rule sampled at N widths
 * (BUG-18) — 72px at 1440 down to 36px at 320 — and `axes.fontSizePx` is only
 * its representative value. Writing the axis alone would leave the track
 * untouched and therefore *win at every width the track covers*, so a heading
 * taken to 96 would still render at 72 on desktop and 36 on mobile; writing the
 * axis and flattening the track would delete the mobile keyframe. Scaling every
 * keyframe by one ratio keeps the shape of the rule the fold measured and moves
 * the whole thing, which is what a user asking for "bigger" means.
 *
 * `segments` are the interpolate/snap flags BETWEEN keyframes, and a uniform
 * scale changes no boundary, so they are carried through untouched.
 */
function scaleTrack(track: L1ScalarTrack, from: number, to: number): L1ScalarTrack {
  const ratio = to / from
  return {
    ...track,
    keyframes: track.keyframes.map((kf) => ({ ...kf, value: round2(kf.value * ratio) })),
  }
}

/**
 * Two decimal places. A scaled keyframe is a real number and a font size is
 * measured in fractions of a pixel at most; letting `72 * (17 / 34)` land as
 * `35.99999999999999` in the definition would put float noise in a file a human
 * reads and a diff compares.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100
}

/**
 * Write one typography field, reporting whether anything changed.
 *
 * Assignment into the EXISTING axes bag for the same reason REQ-128's background
 * write is: the run's other 40-odd axes are none of this control's business, and
 * replacing the object would quietly drop whichever of them the derivation does
 * not know about.
 */
function writeTypography(node: L1Node, name: string, value: unknown): boolean {
  const target = node as { axes?: Record<string, unknown>; responsive?: Record<string, unknown> }
  const axes = (target.axes ??= {})

  if (name === 'fontSizePx') {
    const next = value as number
    const current = axes.fontSizePx as number | undefined
    if (current === next || current === undefined || next <= 0) return false
    axes.fontSizePx = next
    // The track, if the run has one, moves with the axis — never independently
    // of it, and never after it (a second write path is a second chance to
    // disagree about which value is representative).
    const track = target.responsive?.fontSizePx as L1ScalarTrack | undefined
    if (track) target.responsive!.fontSizePx = scaleTrack(track, current, next)
    return true
  }
  if (name === 'fontWeight') {
    const next = Number(value)
    if (axes.fontWeight === next) return false
    axes.fontWeight = next
    return true
  }
  if (name === 'italic') {
    const next = value === true ? 'italic' : 'normal'
    // `normal` is the CSS initial value, so an un-ticked box on a run that never
    // declared a style must leave the axis ABSENT rather than writing the
    // default in. Writing it would grow the definition on every save and make a
    // no-op edit produce a diff.
    if ((axes.fontStyle ?? 'normal') === next) return false
    if (next === 'normal') delete axes.fontStyle
    else axes.fontStyle = next
    return true
  }
  // textTransform — same absent-is-the-default rule as italic.
  const next = value as string
  if ((axes.textTransform ?? 'none') === next) return false
  if (next === 'none') delete axes.textTransform
  else axes.textTransform = next
  return true
}

/**
 * Apply one modal's worth of changes to `node`, in place.
 *
 * Whole-or-nothing: every value is checked before any is written, so a rejected
 * change map leaves the node byte-identical. The caller holds a clone of the
 * page, validates the *result* against the shared site validator, and only then
 * writes — which is what keeps a failed edit from ever reaching disk.
 *
 * Unknown keys are refused rather than ignored. A change map naming a field this
 * segment does not have means the client resolved against a different node than
 * the one it is now writing to; silently dropping it would land a partial edit.
 *
 * An `enum` field's value must be one of the options the derivation offered
 * (REQ-118). The shared validator would already refuse an unsafe handle, but it
 * cannot refuse a *safe* one the site does not have — a client holding a stale
 * asset listing would otherwise point the node at a file that is not there and
 * get a broken image with no error. Checking membership here fails it at the
 * field, naming what was refused.
 *
 * A `locked` field is refused outright (REQ-135). The widget renders it
 * read-only, so a value for it can only come from a client that ignored the
 * descriptor — and the reason it is locked (no italic face exists) is a fact
 * about the site that a post cannot change.
 */
export function applyCopyFields(
  node: L1Node,
  values: Record<string, unknown>,
  opts: L1SegmentFieldOptions = {},
): L1CopyEditResult {
  const derived = copyFieldsOf(node, opts)
  if (!derived) {
    return { ok: false, message: `Node of kind '${node.kind}' has no editable fields.` }
  }
  const known = new Map(derived.fields.map((f) => [f.name, f]))
  for (const [name, value] of Object.entries(values)) {
    const field = known.get(name)
    if (!field) {
      return { ok: false, field: name, message: `Unknown field '${name}' for this segment.` }
    }
    if (field.locked) {
      return {
        ok: false,
        field: name,
        message: `Field '${name}' is not editable on this segment.`,
      }
    }
    const refusal = typeError(field, value) ?? rangeError(field, value, derived.values[name])
    if (refusal) return { ok: false, field: name, message: refusal }
  }
  const changed: string[] = []
  for (const [name, value] of Object.entries(values)) {
    const next = value as string
    if (node.kind === 'text' && TYPOGRAPHY_FIELDS.has(name)) {
      if (writeTypography(node, name, value)) changed.push(name)
    } else if (node.kind === 'text' && name === 'text' && node.text !== next) {
      node.text = next
      changed.push(name)
    } else if (node.kind === 'image' && name === 'src' && node.src !== next) {
      node.src = next
      changed.push(name)
    } else if (node.kind === 'image' && name === 'alt' && node.alt !== next) {
      node.alt = next
      changed.push(name)
    } else if (name === 'backgroundImageUrl' && backgroundHandleOf(node) !== next) {
      // Assignment into the EXISTING axes object, never a replacement of it. The
      // field is only ever derived for a node that already carries a background,
      // so `axes` is present; writing one key leaves every other axis — including
      // wherever framing parameters eventually live — byte-identical, which is
      // what makes "choosing a background bakes nothing and disturbs nothing"
      // true of the whole node rather than just of the asset store.
      const axes = (node as { axes?: Record<string, unknown> }).axes
      if (axes) {
        axes.backgroundImageUrl = next
        changed.push(name)
      }
    }
  }
  return { ok: true, changed }
}
