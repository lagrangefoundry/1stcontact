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
import type { L1Color, L1Palette, L1PaletteRef } from './palette'
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
 * REQ-140's `'color'` is the first entry whose value is not a scalar. It is
 * still closed, and closed by the same argument: the only value it admits is a
 * reference into a palette THIS SITE declares ({@link colorError}), so the
 * control cannot name a colour the site does not already have, and a hex — the
 * one shape that could smuggle an arbitrary value in — is refused outright.
 * Inventing a colour is a palette edit, which is a different command.
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
  type: 'string' | 'enum' | 'integer' | 'boolean' | 'color'
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
   * REQ-135 — shown, but not editable, because this element cannot honour it.
   *
   * The case it was introduced for is italic on a family that declares no italic
   * face: setting it would get a synthetic oblique from whichever engine happens
   * to render the page. Dropping the field instead would be worse than useless —
   * the absence would read as "this build has no italics" rather than "this
   * site's font has none", and the two have very different fixes. `mountFields`
   * honours `locked` by rendering the row read-only.
   *
   * REQ-139 generalises the one trigger to the rule behind it: **a control is
   * offered only when it is FAITHFUL** — the value it shows is the whole truth
   * about what the element holds, and setting it produces exactly the change the
   * operator expects. Three ways that breaks, one treatment:
   *
   * - **inert** — another axis overrides the one the control writes, so setting
   *   it paints nothing (`gradientFill` emits `color: transparent`);
   * - **lossy** — the node holds a structure where the control offers a scalar,
   *   so showing it is a projection and writing it a flattening;
   * - **unsupported** — expressible, but the site cannot honour it (the italic
   *   face above).
   *
   * The test is "is the write observable and complete?", NOT "is another axis
   * present". A scrim over a background image tints the photograph rather than
   * hiding it, so a sibling axis is not occlusion and the picker stays open.
   *
   * Always accompanied by {@link L1FieldDescriptor.reason}, which is what makes
   * a disabled control read as a statement about THIS element rather than as a
   * bug in the editor.
   */
  locked?: boolean
  /**
   * REQ-139 — why {@link L1FieldDescriptor.locked} is set, in the operator's own
   * words, naming the way round it.
   *
   * PLAIN ENGLISH, NEVER AN AXIS NAME. The surface that reads this is a
   * non-technical operator (DOC-28 §2), and "gradientFill overrides color" tells
   * them nothing they can act on. It says what the element is doing and that the
   * AI can change it — which is true, and is the only route they have.
   *
   * It also travels to the CLI and the AI's own tool surface, because both read
   * these descriptors, and it is the message {@link applyCopyFields} refuses a
   * change with — so the reason a control is unavailable and the reason a write
   * is refused can never be two different stories.
   */
  reason?: string
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

/**
 * What a control on this surface can produce.
 *
 * `L1Color` (REQ-140) is the one member that is not a scalar, and it is a typed
 * object for the reason `palette.ts` chose one: a reference is `{ ref, shade? }`,
 * and flattening it into a magic string here would put a parser between the
 * control and the axis — a parser being exactly the free-form surface the rest
 * of this vocabulary exists to avoid. Values already travel as JSON, so the
 * object needs no transport it does not have.
 *
 * A colour field REPORTS whatever the axis holds, which on a folded site is a
 * hex literal; it only ever WRITES a reference. The asymmetry is deliberate —
 * see {@link colorError}.
 */
export type L1FieldValue = string | number | boolean | L1Color

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
  /**
   * REQ-140 — the site's palette (`site.palette`), which is what makes a colour
   * a CLOSED list in the same sense `fonts` and `assets` are.
   *
   * It is the SITE's, not the page's: a palette entry is site-wide by
   * construction (REQ-114), which is the whole point of editing one and having
   * every use follow. Absent or empty is a legitimate state — most folded sites
   * hold literals and no palette — and it does NOT withdraw the field, because
   * the picker it opens is also where the first entry gets added. Withdrawing it
   * would make the palette unreachable from the only surface that wants one.
   */
  palette?: L1Palette
  /**
   * REQ-140 — whether this `box`/`container` PAINTS something, which is exactly
   * when the renderer stamps it as a segment (`l1PaintsSurface`).
   *
   * Supplied rather than derived, and for the reason the renderer states beside
   * that predicate: the rule lives in the emitter, because "is a segment" and
   * "is stamped" have to be the same question or the modal starts offering
   * controls on nodes nobody can click. Re-deriving it here would mean a second
   * list of paint axes, drifting the first time one is added — and this module
   * cannot import the first list, because it is served to the browser
   * type-stripped and holds no runtime imports at all.
   *
   * Absent means NOT painted, which is the honest reading of "the caller did not
   * say": an unpainted container is not a segment, exposes nothing, and must
   * stay invisible to the modal rather than opening an empty form (REQ-129's
   * invariant 2). A caller that knows better says so.
   */
  paints?: boolean
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

// ── locked controls (REQ-139) ────────────────────────────────────────────────
//
// A lock is a pair, never a flag on its own: the descriptor says the control is
// unavailable, and it says why. The two are one value here so that a lock cannot
// be derived without its sentence — a greyed-out row with no cause is read as a
// broken editor, and the operator's only next move (ask the AI) is precisely the
// thing the sentence has to name.
//
// Spread into the descriptor rather than assigned, so a field with no lock
// carries neither key and the wire shape of an ordinary control is unchanged.

/** A control this element cannot honour, and what to tell the operator. */
interface L1FieldLock {
  locked: true
  reason: string
}

/**
 * The colour control is INERT on a run whose glyphs are painted by a gradient.
 *
 * The renderer paints a `gradientFill` by repurposing the background layers and
 * clipping them to the text, which requires the flat colour to be transparent —
 * `-webkit-text-fill-color: transparent; color: transparent` (see `render.ts`).
 * So the axis the picker writes is still there, still valid, and paints nothing:
 * the operator picks a colour, saves, and the words do not move. That is the
 * worst failure available to this surface, because it looks like the editor
 * lost the edit.
 *
 * Measured: one run across every stored site — the Gigabyte Alchemy wordmark,
 * which carries `color: {ref: 'neutral'}` UNDER its gradient, so the row it
 * withdraws is one that today shows a real, editable, meaningless colour.
 *
 * A gradient is also the lossy case in the same breath: it is four stops and an
 * angle, and the swatch beside the row can only show one of them. Even a picker
 * that painted something would be flattening a structure into a scalar.
 */
const GLYPH_GRADIENT_LOCK: L1FieldLock = {
  locked: true,
  reason:
    'These words are painted with a colour gradient, which this control cannot show or change. Ask me in chat to change it.',
}

/**
 * Italic is UNSUPPORTED where the site's own font declares no italic face
 * (REQ-135).
 *
 * The reason names the font rather than the build, because that is the fix: a
 * face has to be added to the site, and the AI is the surface that does it.
 */
const NO_ITALIC_FACE_LOCK: L1FieldLock = {
  locked: true,
  reason:
    'The font these words are set in has no italic version, so italics here would be faked by the browser. Ask me in chat if you need one.',
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
    ...(lockedItalic ? NO_ITALIC_FACE_LOCK : {}),
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

// ── colour (REQ-140 — REQ-135 phase B) ───────────────────────────────────────
//
// Two axes, one control: a run's `color` and a painted surface's `surfaceFill`.
// REQ-135 §3 is the rule both obey — **the surface writes a palette reference,
// never a hex** — and it is what bounds the ugliness risk of handing colour to a
// non-designer: from a segment you can only pick a colour the site already has.
// Inventing one is a palette edit (REQ-133), a deliberate and separate act.
//
// REQ-135 §3.1 described a grid of named palette STEPS. REQ-137 deleted steps in
// favour of a continuous `shade` carried on the reference, so both the control it
// specified and the `{ref, step}` value it wrote are gone. What replaced them is
// not described here at all: the picker is REQ-133's popup, which already
// resolves to `{ref, shade}`. This module only says which axes offer one and what
// it may write.

/**
 * The field names this section owns, by the axis each writes.
 *
 * Two entries rather than one shared name because they are genuinely different
 * axes on different kinds — and naming the field after the axis is what lets
 * {@link applyCopyFields} write it without a second table saying which is which.
 */
const COLOR_FIELDS: ReadonlyMap<string, string> = new Map([
  ['color', 'Text colour'],
  ['surfaceFill', 'Background colour'],
])

/**
 * The colour field for `axis`, plus its current value when the node holds one.
 *
 * An ABSENT axis is reported as an absent value, exactly as `fontSizePx` is: a
 * run with no `color` inherits one, and reporting a resolved inherited colour
 * would make the modal claim the node holds something it does not — and then
 * write that claim back on the next Save.
 *
 * `lock` (REQ-139) is how the caller says this element cannot honour a pick. The
 * field is still derived, still reports what the axis holds, and is still in the
 * same position in the sheet — withdrawing it would say the editor has no colour
 * control, which is a different and wrong claim.
 */
function colorField(
  name: string,
  held: unknown,
  lock: L1FieldLock | null = null,
): { fields: L1FieldDescriptor[]; values: Record<string, L1FieldValue> } {
  const fields: L1FieldDescriptor[] = [
    { name, label: COLOR_FIELDS.get(name) as string, type: 'color', ...(lock ?? {}) },
  ]
  const values: Record<string, L1FieldValue> = {}
  if (isL1ColorValue(held)) values[name] = held
  return { fields, values }
}

/**
 * True for something shaped like an L1 colour — a hex literal or a reference.
 *
 * Structural rather than schema-driven, and deliberately so: this module has NO
 * runtime imports. The builder origin serves it to the browser type-stripped
 * per-file (`/framework/site-schema-edit.js`), rewriting only the package
 * specifier, so a relative `import { … } from './palette'` would emit a path
 * that 404s in the browser and take the whole edit bridge down with it. Type-only
 * imports erase, which is why the types above are free.
 *
 * The check is safe to restate because the shapes are disjoint by construction:
 * `ref` is the only key any L1 colour object carries, and every L1 object is
 * `.strict()`. The AUTHORITY on a colour is still the envelope validator, which
 * runs over the whole assembled site before a byte is written; this is the check
 * that names the field.
 */
function isL1ColorValue(v: unknown): v is L1Color {
  if (typeof v === 'string') return v.startsWith('#')
  return isPaletteRefValue(v)
}

/** The reference half of {@link isL1ColorValue}. */
function isPaletteRefValue(v: unknown): v is L1PaletteRef {
  return (
    typeof v === 'object' &&
    v !== null &&
    !Array.isArray(v) &&
    typeof (v as { ref?: unknown }).ref === 'string'
  )
}

/** True when two colour values are the same colour — the change gate for an axis. */
function sameColor(a: unknown, b: unknown): boolean {
  if (typeof a === 'string' || typeof b === 'string') return a === b
  if (!isPaletteRefValue(a) || !isPaletteRefValue(b)) return a === b
  return (
    a.ref === b.ref && shadeOf(a) === shadeOf(b) && alphaOf(a) === alphaOf(b)
  )
}

/** A reference's shade, with absent and `0` being the same position. */
function shadeOf(ref: L1PaletteRef): number {
  return ref.shade ?? 0
}

/** A reference's alpha, with absent and `1` being the same opacity. */
function alphaOf(ref: L1PaletteRef): number {
  return ref.alpha ?? 1
}

/** The keys a reference may carry — anything else is refused rather than dropped. */
const PALETTE_REF_KEYS: ReadonlySet<string> = new Set(['ref', 'shade', 'alpha'])

// ── image framing, shape and colour adjustment (REQ-136) ─────────────────────
//
// The editor could choose WHICH picture; it could not change how that picture is
// seen. Every control below writes a typed L1 axis and NOTHING touches a file —
// which is the whole design (DOC-28 §9.2): one uploaded asset serves many
// framings, an adjustment is an ordinary structured diff with the same validator
// and the same undo as any other, no image-decoding pipeline joins the attack
// surface (DOC-2), and the adjustment stays legible to the AI, which can read
// `saturate: 0.4` and cannot read pixels.
//
// The named cost is bytes on the wire: a 4000px hero cropped to a thumbnail still
// ships 4000px. That is performance, not correctness, and its fix is additive — a
// derived-render cache keyed on (asset, adjustment) — so it is deliberately not
// solved here.
//
// EDITOR/PAGE PARITY IS STRUCTURAL, NOT A FEATURE. The editor's preview *is* the
// edit render channel (DOC-28 §5.1) — same renderer, same document — so an
// adjustment expressed as an axis appears in the editor exactly as it appears on
// the page, unavoidably, with nothing to keep in step.

/** The `objectFit` axis's own vocabulary, mirrored as the closed list. */
const OBJECT_FITS = ['cover', 'contain', 'fill', 'none', 'scale-down'] as const

/**
 * The CSS initial value of `object-fit`. An image that declares no fit is
 * rendered `fill` by every engine, so `fill` is what the control must show for an
 * absent axis — and writing `fill` must REMOVE the axis rather than record the
 * default, on the same absent-is-the-default rule as `italic` and `textTransform`.
 */
const OBJECT_FIT_DEFAULT = 'fill'

/** Where an unset `object-position` puts the picture: dead centre, per CSS. */
const OBJECT_POSITION_DEFAULT = 50

/**
 * The shapes the editor offers, in the axis's own vocabulary plus the one word
 * for "no mask".
 *
 * GEOMETRIC SHAPES ONLY. `l1MaskSchema` also carries the feathered edges
 * (`featherRadial` / `featherTop` / `featherBottom`), which are an edge treatment
 * rather than an answer to "what shape is this picture" — and whose names are the
 * substrate's, not a word any non-technical operator would recognise in a
 * dropdown (DOC-28 §3). They stay with the AI, which addresses the axis directly.
 * A node that already carries one keeps it: see {@link shapeChoices}.
 */
const IMAGE_SHAPES = ['rectangle', 'circle', 'ellipse', 'parallelogram', 'blob'] as const

/** The word for "this picture carries no mask at all". Never written as a mask. */
const SHAPE_NONE = 'rectangle'

/**
 * The shape options: the geometric set, plus whatever the node already carries.
 *
 * The union is the rule {@link imageChoices} and {@link weightChoices} both
 * state, and it bites here for the same reason: a select whose options omit its
 * own value renders with the FIRST option selected, so opening an image the AI
 * had given a feathered edge and saving its alt text would silently square it off.
 */
function shapeChoices(current: string): string[] {
  const seen: string[] = [...IMAGE_SHAPES]
  if (!seen.includes(current)) seen.push(current)
  return seen
}

/** The bounds of the framing controls. Wide by intent — one control per axis. */
const CORNER_RADIUS_MAX_PX = 400
const ROTATE_MAX_DEG = 180
const SCALE_MIN_PCT = 25
const SCALE_MAX_PCT = 400
const BLUR_MAX_PX = 20

/**
 * The colour-adjustment controls, as **percentage projections** over the
 * fractional `filter` axes.
 *
 * WHY A PROJECTION. `l1FilterSchema` holds CSS-canonical fractions, because that
 * is what a browser reports and therefore what the capture fold can write without
 * a conversion. "Saturation 140%" is what an operator means; `saturate: 1.4` is
 * what the substrate holds. REQ-135 set the precedent with `italic` over
 * `fontStyle`: where the control is a projection rather than the axis, the names
 * differ on purpose, and this module is the single place that knows which is which.
 *
 * `identity` is the value at which the function paints nothing — 100% for the
 * scaling functions, 0 for the rest — and it is what an ABSENT axis reads back as,
 * and what removes the axis when written. So a control returned to its identity
 * leaves the definition exactly as it found it rather than recording a no-op.
 *
 * `sepia` and `invert` are in L1 (the fold may measure either) but are not offered
 * here: they are stylisation rather than adjustment, and thirteen rows is already
 * a full control panel. The AI addresses them directly.
 */
const FILTER_CONTROLS = [
  { name: 'brightnessPct', label: 'Brightness (%)', axis: 'brightness', identity: 100, scale: 100, max: 400 },
  { name: 'contrastPct', label: 'Contrast (%)', axis: 'contrast', identity: 100, scale: 100, max: 400 },
  { name: 'saturatePct', label: 'Saturation (%)', axis: 'saturate', identity: 100, scale: 100, max: 400 },
  { name: 'grayscalePct', label: 'Black & white (%)', axis: 'grayscale', identity: 0, scale: 100, max: 100 },
  { name: 'hueRotateDeg', label: 'Hue shift (°)', axis: 'hueRotateDeg', identity: 0, scale: 1, max: 360 },
  { name: 'blurPx', label: 'Blur (px)', axis: 'blurPx', identity: 0, scale: 1, max: BLUR_MAX_PX },
] as const

/** The slice of an image node this surface reads and writes. */
interface L1ImageFramingView {
  axes?: {
    objectFit?: string
    objectPosition?: { xPct: number; yPct: number }
    borderRadiusPx?: number
    filter?: Record<string, number | undefined>
  }
  mask?: { shape: string }
  transform?: { rotateDeg?: number; scale?: number }
}

/**
 * How a picture is framed, shaped and colour-adjusted (REQ-136).
 *
 * Every control is CLOSED — a bounded integer or the axis's own keyword list —
 * which is what makes handing them to a non-technical operator safe: there is no
 * control here that can express a length, a colour function or a path, so
 * widening this surface never widens the attack surface (DOC-28 §3).
 */
function imageFramingFields(node: L1ImageFramingView): {
  fields: L1FieldDescriptor[]
  values: Record<string, L1FieldValue>
} {
  const axes = node.axes ?? {}
  const position = axes.objectPosition
  const shape = node.mask?.shape ?? SHAPE_NONE
  const filter = axes.filter ?? {}

  const fields: L1FieldDescriptor[] = [
    { name: 'objectFit', label: 'Fill mode', type: 'enum', enum: OBJECT_FITS, required: true },
    { name: 'objectPositionXPct', label: 'Pan across (%)', type: 'integer', min: 0, max: 100 },
    { name: 'objectPositionYPct', label: 'Pan down (%)', type: 'integer', min: 0, max: 100 },
    { name: 'shape', label: 'Shape', type: 'enum', enum: shapeChoices(shape), required: true },
    {
      name: 'cornerRadiusPx',
      label: 'Corner rounding (px)',
      type: 'integer',
      min: 0,
      max: CORNER_RADIUS_MAX_PX,
    },
    {
      name: 'rotateDeg',
      label: 'Rotate (°)',
      type: 'integer',
      min: -ROTATE_MAX_DEG,
      max: ROTATE_MAX_DEG,
    },
    { name: 'scalePct', label: 'Scale (%)', type: 'integer', min: SCALE_MIN_PCT, max: SCALE_MAX_PCT },
    ...FILTER_CONTROLS.map(
      (control): L1FieldDescriptor => ({
        name: control.name,
        label: control.label,
        type: 'integer',
        min: 0,
        max: control.max,
      }),
    ),
  ]

  const values: Record<string, L1FieldValue> = {
    objectFit: axes.objectFit ?? OBJECT_FIT_DEFAULT,
    objectPositionXPct: Math.round(position?.xPct ?? OBJECT_POSITION_DEFAULT),
    objectPositionYPct: Math.round(position?.yPct ?? OBJECT_POSITION_DEFAULT),
    shape,
    cornerRadiusPx: Math.round(axes.borderRadiusPx ?? 0),
    rotateDeg: Math.round(node.transform?.rotateDeg ?? 0),
    scalePct: Math.round((node.transform?.scale ?? 1) * 100),
  }
  for (const control of FILTER_CONTROLS) {
    const held = filter[control.axis]
    values[control.name] = held === undefined ? control.identity : Math.round(held * control.scale)
  }
  return { fields, values }
}

/** The slice of a text run's axes this surface reads and writes. */
interface L1TextAxesView {
  color?: unknown
  /**
   * REQ-139 — READ but never written: its presence is what makes the colour
   * control inert (see {@link GLYPH_GRADIENT_LOCK}). Typed loosely because this
   * surface never looks inside it; the gradient itself stays with the AI.
   */
  gradientFill?: unknown
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
 * that is an **axis** rather than content. REQ-140 completes it with **colour**:
 * a run's `color` and a panel's `surfaceFill`. Every one of them arrives by
 * extending this one function, so every editor surface keeps deriving from the
 * node rather than accumulating its own idea of what is editable.
 *
 * A text run exposes its words, its colour and its type — and NOT its position:
 * DOC-28 §3's rule is friendly parameters, so geometry stays with the AI. What
 * makes these safe to hand over is that each is closed — a bounded integer, the
 * faces the site actually declares, the axis's own keyword list, and the entries
 * of the site's own palette — rather than a value a user can type anything into.
 *
 * An image exposes *which image*, its alt text, and — REQ-136 — how that picture
 * is framed, shaped and colour-adjusted. DOC-28 §13 Q5 asked that the editor
 * write the SAME fields the capture fold writes rather than a parallel
 * vocabulary, and that is what settles the shape of these controls: they are
 * projections over `objectFit` / `objectPosition` / `filter` / `mask` /
 * `transform`, which is exactly what the fold measures. Everything here is a
 * structured field on the node; no control on this surface touches a file, so
 * neither choosing an asset nor cropping one can ever bake a new one.
 *
 * Framing is offered on the `image` leaf ONLY. A painted surface's background is
 * still pinned to `cover / center / no-repeat` (BUG-13), so the same intent
 * lands on a different CSS family there and unpinning it is its own change.
 *
 * A `box`/`container` exposes its **fill** and, when it carries one, its
 * background image. Both are picks from a closed list the site itself declares —
 * its palette and its assets — which is what keeps a paint surface inside
 * DOC-28 §3's rule. The rest of the surface group (`pattern`, `overlay`,
 * `surfaceGradient`) stays with the AI: each is a composition rather than a
 * choice, and no closed list makes one friendly.
 *
 * Both are offered on the segment the user clicks to mean "this panel". A `text`
 * or `image` node can carry `surfaceFill` and `backgroundImageUrl` too (REQ-98),
 * but exposing either there would make the copy modal a paint surface and blur
 * DOC-28 §6.2's kind→segment map — and for a fill it would be actively wrong: a
 * folded run's box is glyph-tight, so filling it paints a rectangle behind the
 * words rather than the background anyone means (REQ-135 §2). The panel that
 * holds the words is a segment in its own right, and the escalation row in the
 * text modal is what routes there.
 */
export function copyFieldsOf(
  node: L1Node,
  opts: L1SegmentFieldOptions = {},
): L1SegmentFields | null {
  if (node.kind === 'text') {
    const text = node.text
    const axes = (node.axes ?? {}) as L1TextAxesView
    const type = typographyFields(axes, opts.fonts ?? [])
    // REQ-139 — the colour row is derived either way; the gradient decides
    // whether it can be used. See {@link GLYPH_GRADIENT_LOCK}.
    const colour = colorField(
      'color',
      axes.color,
      axes.gradientFill === undefined ? null : GLYPH_GRADIENT_LOCK,
    )
    return {
      // The copy field stays FIRST, and the client keys on it rather than on
      // "the only field" — clicking words has to put the cursor in the words,
      // and it did that by counting fields until this list stopped being one
      // long.
      fields: [
        { name: 'text', label: 'Text', type: 'string', ...widgetFor(text) },
        ...colour.fields,
        ...type.fields,
      ],
      values: { text, ...colour.values, ...type.values },
    }
  }
  if (node.kind === 'image') {
    const { src, alt } = node
    const framing = imageFramingFields(node as L1ImageFramingView)
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
        ...framing.fields,
      ],
      values: { src, alt, ...framing.values },
    }
  }
  // A PAINTED SURFACE (REQ-128 + REQ-140). Two fields now, and the fill is the
  // one that always appears: a box/container is a segment exactly when it paints
  // something (`opts.paints`, the renderer's own verdict), and every such segment
  // can be re-coloured, while only some of them carry a background image to swap.
  //
  // That is also why the fill is derived even when the node holds none. Before
  // REQ-140 a container painting only a radius or an image returned `null` here
  // and read as "nothing to edit" — a segment the user could click, outline and
  // open to be told there was nothing inside it. The axis it was missing is
  // precisely the one REQ-135 §2 puts here.
  //
  // An UNPAINTED box or container is a different thing entirely and still
  // returns `null`. The AI authors rows, boxes and plain wrappers freely; none
  // of them is stamped, none of them can be clicked, and offering a paint
  // control on one would put a field on a node with no way to reach it
  // (REQ-129's invariant 2). "Paints nothing" is not "paints no colour".
  if ((node.kind === 'box' || node.kind === 'container') && opts.paints) {
    const background = backgroundHandleOf(node)
    const fill = colorField('surfaceFill', (node.axes as { surfaceFill?: unknown })?.surfaceFill)
    const fields: L1FieldDescriptor[] = []
    const values: Record<string, L1FieldValue> = {}
    if (background !== undefined) {
      fields.push({
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
      })
      values.backgroundImageUrl = background
    }
    fields.push(...fill.fields)
    Object.assign(values, fill.values)
    return { fields, values }
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
  // A colour is the one value that is not a scalar, so the string check below
  // would refuse every legitimate one. What it may actually hold is
  // {@link colorError}'s question, and it needs the palette to answer it.
  if (field.type === 'color') return null
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

/**
 * Why `field` cannot be changed, or `null` when it can — or when nothing is
 * being changed (REQ-139).
 *
 * **A lock refuses a CHANGE, never the status quo**, which is the same rule
 * {@link rangeError} and {@link colorError} already state and it bites harder
 * here than in either. The modal posts every staged field, not only the touched
 * ones, so a run whose colour is locked because its glyphs are painted by a
 * gradient posts that colour back on any Save — including a Save that only
 * rewrote the words. Refusing the status quo would make a locked control
 * *disable the whole segment*: the one node on the measured folds that carries a
 * gradient is a headline, and its words would have become uneditable the moment
 * its colour became unavailable. A lock says "you may not move this", not "you
 * may not save while this exists".
 *
 * The refusal message is the descriptor's own {@link L1FieldDescriptor.reason},
 * so the sentence a greyed-out control shows and the sentence a refused write
 * returns are one string with one definition site. The fallback covers a
 * descriptor locked without a reason — which our derivation cannot produce, the
 * two being one value there, but the interface admits.
 */
function lockError(
  field: L1FieldDescriptor,
  value: unknown,
  current: L1FieldValue | undefined,
): string | null {
  if (!field.locked) return null
  const unchanged = field.type === 'color' ? sameColor(value, current) : value === current
  if (unchanged) return null
  return field.reason ?? `${field.label} cannot be changed on this element.`
}

/**
 * Why `value` is not a colour this site can paint, or `null` when it is.
 *
 * **The status quo always passes, and it is the reason this function exists.**
 * The modal posts every staged field, not only the touched ones, and a folded
 * site's axes hold hex LITERALS — so a run whose colour nobody touched arrives
 * back here as `#0f172b`, which the rule below otherwise refuses outright.
 * Comparing against what the derivation just reported is what keeps "edit the
 * words of a run that has a literal colour" from failing on the colour. Same
 * argument as {@link rangeError}, same shape.
 *
 * Otherwise the value must be a REFERENCE into this site's palette (REQ-135 §3):
 *
 * - A hex is refused even though it is a valid `L1Color`. That is the whole
 *   point — the picker offers entries, so a hex arriving here came from
 *   something other than the picker, and honouring it would put an off-system
 *   colour on the page by the one route the design closes.
 * - An unknown `ref` is refused HERE rather than left to the envelope validator,
 *   which would also catch it but could not say which field. A client holding a
 *   stale palette listing is the case: the entry was renamed or deleted while
 *   the modal was open, and "'brand' is not one of this site's palette colours"
 *   is the only message that says what to do about it.
 * - `shade` and `alpha` are bounded, and an unknown key is refused rather than
 *   dropped, because `l1PaletteRefSchema` is `.strict()` and a value this
 *   function admits must be one the envelope validator will too.
 */
function colorError(
  field: L1FieldDescriptor,
  value: unknown,
  current: L1FieldValue | undefined,
  palette: L1Palette | undefined,
): string | null {
  if (field.type !== 'color') return null
  if (sameColor(value, current)) return null
  if (!isPaletteRefValue(value)) {
    return `${field.label} must be a colour chosen from the site's palette.`
  }
  const extra = Object.keys(value).find((k) => !PALETTE_REF_KEYS.has(k))
  if (extra !== undefined) {
    return `A palette colour carries no '${extra}'.`
  }
  if (!palette || !Object.hasOwn(palette, value.ref)) {
    const names = palette ? Object.keys(palette) : []
    return names.length
      ? `'${value.ref}' is not one of this site's palette colours (${names.join(', ')}).`
      : `This site has no palette yet, so '${value.ref}' names nothing.`
  }
  if (value.shade !== undefined && !(value.shade >= -1 && value.shade <= 1)) {
    return `${field.label}'s shade must be between -1 and 1 (got ${value.shade}).`
  }
  if (value.alpha !== undefined && !(value.alpha >= 0 && value.alpha <= 1)) {
    return `${field.label}'s opacity must be between 0 and 1 (got ${value.alpha}).`
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
 * Write a colour axis, reporting whether anything changed (REQ-140).
 *
 * The value has already been checked against the site's palette, so the only
 * work left is the CANONICAL form: `shade: 0` and `alpha: 1` are the identities
 * the resolver treats as absent, and a picker that always sends its slider
 * position would otherwise write `{ref:'slate', shade:0}` where the document
 * means `{ref:'slate'}`. Pruning them keeps a colour that did not move out of
 * the diff entirely — the same reason {@link applyFraming} deletes an axis at its
 * identity rather than storing it.
 *
 * Assignment into the EXISTING axes bag, for {@link writeTypography}'s reason.
 */
function writeColor(
  node: L1Node,
  name: string,
  value: unknown,
  reported: L1FieldValue | undefined,
): boolean {
  if (sameColor(value, reported)) return false
  if (!isPaletteRefValue(value)) return false
  const next: L1PaletteRef = { ref: value.ref }
  if (shadeOf(value) !== 0) next.shade = value.shade
  if (alphaOf(value) !== 1) next.alpha = value.alpha
  const target = node as unknown as { axes?: Record<string, unknown> }
  const axes = (target.axes ??= {})
  axes[name] = next
  return true
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

/** The field names {@link writeImageFraming} owns on an `image` node (REQ-136). */
const IMAGE_FRAMING_FIELDS: ReadonlySet<string> = new Set([
  'objectFit',
  'objectPositionXPct',
  'objectPositionYPct',
  'shape',
  'cornerRadiusPx',
  'rotateDeg',
  'scalePct',
  ...FILTER_CONTROLS.map((control) => control.name),
])

/**
 * Drop a key and, if that empties its container, drop the container too.
 *
 * THE POINT IS THAT A NO-OP LEAVES NO TRACE. Every framing control has an
 * identity value, and returning one to its identity has to restore the node to
 * the shape it had before — not leave `transform: {}` or `filter: {}` behind. An
 * empty container is not merely untidy: it is a diff on every save, it renders as
 * nothing while reading as something, and it is what makes "did this edit change
 * anything" un-answerable by looking at the file.
 */
function clearKey(bag: Record<string, unknown> | undefined, key: string): void {
  if (!bag) return
  delete bag[key]
}

/** Assign or remove one key of a lazily-created sub-object, pruning it when empty. */
function setNested(
  owner: Record<string, unknown>,
  container: string,
  key: string,
  value: number | undefined,
): void {
  const bag = owner[container] as Record<string, unknown> | undefined
  if (value === undefined) {
    clearKey(bag, key)
    if (bag && Object.keys(bag).length === 0) delete owner[container]
    return
  }
  if (bag) bag[key] = value
  else owner[container] = { [key]: value }
}

/**
 * Two decimal places on a fraction the operator expressed as a percentage.
 * `140 / 100` is exact, but `33 / 100 * 1` is not always, and float noise in a
 * file a human reads and a diff compares is the same problem {@link round2}
 * already solves for a scaled type track.
 */
function fraction(pct: number, scale: number): number {
  return scale === 1 ? pct : Math.round((pct / scale) * 1e4) / 1e4
}

/**
 * Write one image-framing field, reporting whether anything changed (REQ-136).
 *
 * Assignment into the EXISTING bags, never replacement of them — the same rule
 * REQ-128's background write and REQ-135's typography write both state. An image
 * node carries a full surface group (fill, border, shadow, overlay…), and
 * replacing `axes` to set a filter would quietly drop whichever of those the
 * derivation does not know about.
 *
 * IDENTITY REMOVES THE AXIS. `fill` is the CSS initial `object-fit`, 50/50 is the
 * initial `object-position`, 1 is the identity of every scaling filter, and 0 is
 * the identity of the rest. Writing any of them in would grow the definition on
 * every save and make a no-op edit produce a diff — and, for `objectFit`
 * specifically, would put a value in the file that the fold deliberately omits,
 * so a folded page and an edited page would disagree about what "unset" looks like.
 *
 * `reported` is what the derivation just showed the operator for this field, and
 * it — not the raw axis — is what an incoming value is judged against, exactly as
 * {@link writeTypography} is handed its current. The controls here are integers
 * while the axes they address are not (`foldObjectPosition` writes 2dp, `foldFilter`
 * 4dp), so a captured page routinely holds a value no integer control can express.
 * Judged against the axis, the rounded value the operator was shown would differ
 * from it and a plain echo would overwrite it — and because the modal posts every
 * staged field rather than only the touched ones, editing the alt text alone would
 * quietly re-pan, re-saturate and re-rotate the picture. Judged against what was
 * reported, an echo compares equal by construction, whatever rounding was applied.
 */
function writeImageFraming(
  node: L1Node,
  name: string,
  value: unknown,
  reported: L1FieldValue | undefined,
): boolean {
  const target = node as unknown as { axes?: Record<string, unknown> }
  const changed = applyFraming(node, name, value, reported)
  // An identity write on a node that carried no axes at all must not leave an
  // empty bag behind — see {@link clearKey}. The creation is unconditional above
  // because every branch needs somewhere to look; the prune is what keeps a
  // no-op byte-identical.
  if (target.axes && Object.keys(target.axes).length === 0) delete target.axes
  return changed
}

/** {@link writeImageFraming}'s body, before the empty-bag prune. */
function applyFraming(
  node: L1Node,
  name: string,
  value: unknown,
  reported: L1FieldValue | undefined,
): boolean {
  // THE ONLY CHANGE GATE. Every branch below writes unconditionally, because an
  // echo of what the operator was shown has already been answered here — see
  // {@link writeImageFraming}. A branch re-deciding this against its own axis is
  // what let a rounded value read as a change; there is one comparison, and this
  // is it.
  if (value === reported) return false

  const target = node as unknown as {
    axes?: Record<string, unknown>
    mask?: { shape: string }
    transform?: Record<string, unknown>
  }
  const axes = (target.axes ??= {})

  if (name === 'objectFit') {
    const next = value as string
    if (next === OBJECT_FIT_DEFAULT) delete axes.objectFit
    else axes.objectFit = next
    return true
  }

  if (name === 'objectPositionXPct' || name === 'objectPositionYPct') {
    const held = axes.objectPosition as { xPct: number; yPct: number } | undefined
    // The component this field does NOT name is carried over from the HELD axis,
    // never from what was reported for it: the operator moved one slider, and the
    // other component's stored precision is not theirs to round away.
    const next = {
      xPct: held?.xPct ?? OBJECT_POSITION_DEFAULT,
      yPct: held?.yPct ?? OBJECT_POSITION_DEFAULT,
    }
    next[name === 'objectPositionXPct' ? 'xPct' : 'yPct'] = value as number
    // BOTH COMPONENTS OR NEITHER. CSS silently defaults an unspecified component
    // to 50%, so a half-written position is a 50% the document never said; the
    // axis is either absent (the browser's centre) or fully stated.
    if (next.xPct === OBJECT_POSITION_DEFAULT && next.yPct === OBJECT_POSITION_DEFAULT) {
      delete axes.objectPosition
    } else {
      axes.objectPosition = next
    }
    return true
  }

  if (name === 'shape') {
    const next = value as string
    if (next === SHAPE_NONE) delete target.mask
    // A bare shape, because the parameters a mask carries belong to the shape
    // that names them (`slantPct` to a parallelogram, `roughness`/`seed` to a
    // blob) and are meaningless on any other. The renderer's defaults are what a
    // shape chosen from this control gets; tuning them is the AI's, which
    // addresses the axis directly.
    else target.mask = { shape: next } as { shape: string }
    return true
  }

  if (name === 'cornerRadiusPx') {
    const next = value as number
    if (next === 0) delete axes.borderRadiusPx
    else axes.borderRadiusPx = next
    return true
  }

  if (name === 'rotateDeg' || name === 'scalePct') {
    const key = name === 'rotateDeg' ? 'rotateDeg' : 'scale'
    const identity = name === 'rotateDeg' ? 0 : 1
    const next = name === 'rotateDeg' ? (value as number) : fraction(value as number, 100)
    setNested(target as unknown as Record<string, unknown>, 'transform', key, next === identity ? undefined : next)
    return true
  }

  // Fail cleanly rather than throw on a field the set admits but the control table
  // does not describe: the two are built from one list today, and this is what
  // keeps them adding a field to only one of them a no-op instead of a crash.
  const control = FILTER_CONTROLS.find((c) => c.name === name)
  if (!control) return false
  const next = fraction(value as number, control.scale)
  setNested(
    axes,
    'filter',
    control.axis,
    next === fraction(control.identity, control.scale) ? undefined : next,
  )
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
 * A CHANGE to a `locked` field is refused, naming the reason the descriptor
 * carries (REQ-135, generalised by REQ-139). The control is rendered unavailable,
 * so a new value for it can only come from a client that ignored the descriptor —
 * and what makes it unavailable is a fact about the element that a post cannot
 * change. Re-posting the value the field already holds is not a change and
 * passes: see {@link lockError}.
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
    const refusal =
      lockError(field, value, derived.values[name]) ??
      typeError(field, value) ??
      rangeError(field, value, derived.values[name]) ??
      colorError(field, value, derived.values[name], opts.palette)
    if (refusal) return { ok: false, field: name, message: refusal }
  }
  const changed: string[] = []
  for (const [name, value] of Object.entries(values)) {
    const next = value as string
    if (COLOR_FIELDS.has(name)) {
      if (writeColor(node, name, value, derived.values[name])) changed.push(name)
    } else if (node.kind === 'text' && TYPOGRAPHY_FIELDS.has(name)) {
      if (writeTypography(node, name, value)) changed.push(name)
    } else if (node.kind === 'text' && name === 'text' && node.text !== next) {
      node.text = next
      changed.push(name)
    } else if (node.kind === 'image' && IMAGE_FRAMING_FIELDS.has(name)) {
      if (writeImageFraming(node, name, value, derived.values[name])) changed.push(name)
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
