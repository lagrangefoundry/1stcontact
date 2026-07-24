/**
 * L1 layout substrate — the typed element tree (REQ-82 / REQ-79 D1/D2).
 *
 * L1 is the *one* low-level, CSS-faithful layout substrate that replaces the
 * semantic layout modules. A document is a tree of positioned/flowed leaves —
 * `box` / `text` / `image` / `slot` — each carrying a subset of the ~48 captured
 * style axes as **typed literals** (never a freeform CSS/HTML/JS string), plus a
 * per-viewport geometry keyframe track. Structure primitives (containers, per-axis
 * sizing, distribution, visibility) are the fields capture leaves empty and the AI
 * recovers.
 *
 * **Safe by construction:** every field here is a typed scalar or a closed enum;
 * every object is `.strict()` (unknown keys rejected). Numeric bounds + a colour
 * regex + a URL-scheme allowlist are enforced by {@link module:validate}; this
 * file is the shape, `validate.ts` is the envelope.
 */
import { z } from 'zod'

/** A painted colour — hex only. No `url()`, no `rgb(var(--…))`, no keywords. */
const l1Color = z
  .string()
  .regex(
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/,
    'must be a hex color (#rgb, #rrggbb, or #rrggbbaa)',
  )

/** Finite number guard — rejects NaN / ±Infinity that `z.number()` alone admits. */
const finite = z.number().refine((n) => Number.isFinite(n), 'must be a finite number')

// ── Geometry: per-viewport keyframes + per-segment interpolate|snap ───────────

/**
 * One geometry keyframe: absolute band-coordinate placement at a captured
 * viewport width. `height` is optional — a text leaf's height is natural (from
 * flow), so its keyframes pin only `x`/`y`/`width` and leave height to the glyph
 * box. A box/image leaf gives all four.
 */
export const l1KeyframeSchema = z
  .object({
    at: finite.nonnegative(),
    x: finite,
    y: finite,
    width: finite.nonnegative(),
    height: finite.nonnegative().optional(),
  })
  .strict()

/** Between two adjacent keyframes, either linearly interpolate or hold-then-snap. */
export const l1SegmentSchema = z.enum(['interpolate', 'snap'])

/**
 * A geometry track: keyframes sorted ascending by `at`, plus an optional
 * per-segment interpolation flag (length `keyframes.length - 1`). Absent segment
 * flags default to `interpolate` for every segment.
 */
export const l1GeometrySchema = z
  .object({
    keyframes: z.array(l1KeyframeSchema).min(1),
    segments: z.array(l1SegmentSchema).optional(),
  })
  .strict()

// ── Responsive scalar-axis tracks (BUG-18) ────────────────────────────────────
//
// Geometry is not the only property that varies with width: a text run's type
// scales down at narrow widths (font-size 72→36, etc.). A responsive scalar
// track keyframes a single numeric CSS property across the ladder exactly the way
// geometry keyframes position — an axis that *does not* vary stays a plain scalar
// in `axes` (don't bloat static axes into tracks).

/** One responsive scalar keyframe: an axis value at a captured viewport width. */
export const l1ScalarKeyframeSchema = z
  .object({
    at: finite.nonnegative(),
    value: finite,
  })
  .strict()

/**
 * A responsive scalar-axis track: keyframes ascending by `at` plus an optional
 * per-segment `interpolate|snap` flag (length `keyframes.length - 1`). Mirrors
 * {@link l1GeometrySchema} for one numeric CSS property; absent segment flags
 * default to `interpolate` (fluid), so type scales smoothly between the captured
 * widths and hits each sampled width exactly.
 */
export const l1ScalarTrackSchema = z
  .object({
    keyframes: z.array(l1ScalarKeyframeSchema).min(1),
    segments: z.array(l1SegmentSchema).optional(),
  })
  .strict()

/**
 * Per-axis responsive tracks for a text leaf (BUG-18). Only the numeric,
 * interpolatable type axes that actually vary across the ladder get a track;
 * every other axis stays single-valued in {@link l1TextAxesSchema}. When present,
 * the track owns the axis at render time (base rule = smallest-width keyframe,
 * media overrides above), while `axes.<name>` remains the representative
 * (widest) value for non-responsive consumers.
 */
export const l1TextResponsiveSchema = z
  .object({
    fontSizePx: l1ScalarTrackSchema.optional(),
    lineHeightPx: l1ScalarTrackSchema.optional(),
    letterSpacingPx: l1ScalarTrackSchema.optional(),
  })
  .strict()

// ── Structure primitives (capture leaves empty; the AI recovers) ──────────────

/** Per-axis sizing intent: a fixed px, fluid (fill), or hug (fit-content). */
export const l1SizingSchema = z
  .object({
    mode: z.enum(['fixed', 'fluid', 'hug']),
    px: finite.nonnegative().optional(),
    minPx: finite.nonnegative().optional(),
    maxPx: finite.nonnegative().optional(),
  })
  .strict()

export const l1AxisSizingSchema = z
  .object({
    width: l1SizingSchema.optional(),
    height: l1SizingSchema.optional(),
  })
  .strict()

/** Main-axis distribution for a container (maps to flex `justify-content`). */
export const l1DistributionSchema = z.enum(['start', 'center', 'end', 'between', 'around'])

/** Cross-axis alignment for a container (maps to flex `align-items`). */
export const l1AlignSchema = z.enum(['start', 'center', 'end', 'stretch'])

/** A node is visible only within `[from, until)` viewport widths (both optional). */
export const l1VisibilitySchema = z
  .object({
    fromPx: finite.nonnegative().optional(),
    untilPx: finite.nonnegative().optional(),
  })
  .strict()

// ── Shared structured axis forms (REQ-91) ─────────────────────────────────────
//
// Each captured pixel-mover that is not a plain scalar (gradient, shadow, border,
// mask, transform) gets a *typed structured* form here — never a passthrough CSS
// string. The renderer re-derives the CSS from these numeric/enum/hex fields, so
// no instance value ever becomes raw CSS.

/** A gradient colour stop — a hex colour at an optional 0..100% offset. */
export const l1GradientStopSchema = z
  .object({
    color: l1Color,
    position: finite.min(0).max(100).optional(),
  })
  .strict()

/**
 * A linear gradient — typed structured form (mirrors the capture `TextGradient`).
 * `angleDeg` is a CSS angle (0 = to-top, 90 = to-right); absent → default `180deg`.
 * Used for text-fill gradients and surface/panel gradients alike.
 */
export const l1GradientSchema = z
  .object({
    angleDeg: finite.optional(),
    stops: z.array(l1GradientStopSchema).min(2),
  })
  .strict()

/** A drop shadow — structured (offset / blur / spread / colour / inset), never raw CSS. */
export const l1ShadowSchema = z
  .object({
    offsetXPx: finite,
    offsetYPx: finite,
    blurPx: finite.nonnegative().optional(),
    spreadPx: finite.optional(),
    color: l1Color,
    inset: z.boolean().optional(),
  })
  .strict()

/** A box border — width + colour + line style. */
export const l1BorderSchema = z
  .object({
    widthPx: finite.nonnegative(),
    color: l1Color,
    style: z.enum(['solid', 'dashed', 'dotted', 'double']).optional(),
  })
  .strict()

/**
 * A typed mask / clip edge treatment — never a raw `mask-image` / `clip-path`
 * string. `shape` names the geometry (circular crop, a feathered edge); `featherPx`
 * is the soft-edge width where relevant.
 */
export const l1MaskSchema = z
  .object({
    shape: z.enum(['circle', 'ellipse', 'featherRadial', 'featherTop', 'featherBottom']),
    featherPx: finite.nonnegative().optional(),
  })
  .strict()

/** A node-level 2D transform — rotation (deg) + uniform scale (decomposed from the matrix). */
export const l1TransformSchema = z
  .object({
    rotateDeg: finite.optional(),
    scale: finite.positive().optional(),
  })
  .strict()

/** CSS `mix-blend-mode` values — a closed enum, never a freeform string. */
export const l1BlendModeSchema = z.enum([
  'normal',
  'multiply',
  'screen',
  'overlay',
  'darken',
  'lighten',
  'color-dodge',
  'color-burn',
  'hard-light',
  'soft-light',
  'difference',
  'exclusion',
  'hue',
  'saturation',
  'color',
  'luminosity',
])

/** A full-bleed translucent scrim painted over a box's background (hero overlay). */
export const l1OverlaySchema = z
  .object({
    color: l1Color,
    opacity: finite.min(0).max(1).optional(),
  })
  .strict()

/**
 * BUG-17 — box-model padding: a per-side inset (px) between a leaf's border-box
 * geometry and its content. A node-level structured axis (like {@link
 * l1TransformSchema}/{@link l1MaskSchema}), so it applies to any leaf/box kind.
 * Because the renderer sets `box-sizing: border-box`, padding insets the content
 * *inside* the pinned keyframe box (a pill badge's glyphs sit off its edge; a
 * button gains its click-target height) without inflating the geometry the fold
 * already pinned — so it is round-trip-safe. Sides default to 0 when absent.
 */
export const l1PaddingSchema = z
  .object({
    topPx: finite.nonnegative().optional(),
    rightPx: finite.nonnegative().optional(),
    bottomPx: finite.nonnegative().optional(),
    leftPx: finite.nonnegative().optional(),
  })
  .strict()

// ── Leaf axis bags (typed subset of the ~48 captured ValueElement axes) ───────

/** Text-run axes — literal values transcribed straight from a capture. */
export const l1TextAxesSchema = z
  .object({
    color: l1Color.optional(),
    fontFamily: z.string().min(1).optional(),
    fontSizePx: finite.optional(),
    fontWeight: finite.optional(),
    lineHeightPx: finite.optional(),
    letterSpacingPx: finite.optional(),
    textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
    textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
    fontStyle: z.enum(['normal', 'italic']).optional(),
    // ── REQ-91 text pixel-movers ──────────────────────────────────────────────
    /** Text-fill gradient (a `background-clip: text` paint) — replaces the flat `color`. */
    gradientFill: l1GradientSchema.optional(),
    /** Painted decoration line (underline / strike / overline). */
    textDecoration: z.enum(['none', 'underline', 'line-through', 'overline']).optional(),
    /** A glow / drop shadow on the glyphs. */
    textShadow: l1ShadowSchema.optional(),
    /** Small-caps rendering. */
    fontVariantCaps: z.enum(['normal', 'small-caps', 'all-small-caps']).optional(),
    /** A painted list marker (a bullet / number the eye reads but no text node holds). */
    listMarker: z
      .enum([
        'none',
        'disc',
        'circle',
        'square',
        'decimal',
        'decimal-leading-zero',
        'lower-alpha',
        'upper-alpha',
        'lower-roman',
        'upper-roman',
      ])
      .optional(),
    // ── BUG-20 self-surface axes (the chip/badge fusion) ──────────────────────
    /**
     * BUG-20 — a run whose OWN element paints a self-contained chip (a
     * `rounded-full` "Coming soon" badge, a tag pill, a button-shaped link). The
     * DOM routinely fuses "a styled run" and "a painted surface" into one element,
     * but L1 previously forced them into disjoint `text` / `box` leaves — so a
     * badge folded to a text leaf lost its pill entirely (radius 0, no shadow).
     * These four axes let a text leaf paint its own surface, exactly as the
     * capture reads them (own computed style, never an ancestor walk — that is
     * the enclosing card's treatment, which stays on the card box).
     */
    surfaceFill: l1Color.optional(),
    /** The chip's corner rounding. A pill saturates at half its painted height. */
    borderRadiusPx: finite.nonnegative().optional(),
    /** A drop shadow cast by the chip. */
    boxShadow: l1ShadowSchema.optional(),
    /** A painted border framing the chip (uniform, all four sides). */
    border: l1BorderSchema.optional(),
  })
  .strict()

/** Box axes — a painted surface with optional rounding / opacity / effects. */
export const l1BoxAxesSchema = z
  .object({
    surfaceFill: l1Color.optional(),
    borderRadiusPx: finite.nonnegative().optional(),
    opacity: finite.min(0).max(1).optional(),
    // ── REQ-91 surface pixel-movers ───────────────────────────────────────────
    /** A gradient panel fill (a `background-image` gradient over the surface). */
    surfaceGradient: l1GradientSchema.optional(),
    /** A background image (scheme-checked by the envelope, like `image.src`). */
    backgroundImageUrl: z.string().optional(),
    /** A full-bleed translucent scrim painted over the background (hero overlay). */
    overlay: l1OverlaySchema.optional(),
    /** A drop shadow cast by the box. */
    boxShadow: l1ShadowSchema.optional(),
    /** A painted box border (uniform, all four sides). */
    border: l1BorderSchema.optional(),
    /**
     * BUG-14 — a coloured left-accent border (a card's orange/blue rule), distinct
     * from the uniform {@link border}: a card frequently carries only a thick
     * `border-left` as its accent, and drawing that as a full box outline is the
     * wrong look. A typed left-border primitive (never raw CSS) keeps the accent
     * faithful while the substrate stays safe by construction.
     */
    borderLeft: l1BorderSchema.optional(),
    /** Frosted-glass blur of whatever sits behind the box (backdrop-filter). */
    backdropBlurPx: finite.nonnegative().optional(),
    /** How the box composites with what is behind it. */
    blendMode: l1BlendModeSchema.optional(),
  })
  .strict()

/** Image axes — how the media fills its box, plus painted effects. */
export const l1ImageAxesSchema = z
  .object({
    objectFit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
    borderRadiusPx: finite.nonnegative().optional(),
    opacity: finite.min(0).max(1).optional(),
    // ── REQ-91 image pixel-movers ─────────────────────────────────────────────
    /** How the image composites with what is behind it. */
    blendMode: l1BlendModeSchema.optional(),
    /** A painted border framing the image. */
    border: l1BorderSchema.optional(),
    /** A drop shadow cast by the image. */
    boxShadow: l1ShadowSchema.optional(),
  })
  .strict()

// ── Nodes — a discriminated union on `kind` ───────────────────────────────────
//
// `container` and `box` are recursive; Zod v4 handles this with a lazy getter on
// the `children` field (the schema is still a ZodObject, so it remains a legal
// discriminated-union option and its inferred type recurses automatically).

/** A leaf of styled, escaped text. */
export const l1TextSchema = z
  .object({
    kind: z.literal('text'),
    id: z.string().optional(),
    text: z.string(),
    axes: l1TextAxesSchema.optional(),
    /** BUG-18 — per-width tracks for the numeric type axes that vary across the ladder. */
    responsive: l1TextResponsiveSchema.optional(),
    geometry: l1GeometrySchema.optional(),
    visibility: l1VisibilitySchema.optional(),
    transform: l1TransformSchema.optional(),
    mask: l1MaskSchema.optional(),
    padding: l1PaddingSchema.optional(),
  })
  .strict()

/** A media leaf. `src` is scheme-checked by the envelope validator. */
export const l1ImageSchema = z
  .object({
    kind: z.literal('image'),
    id: z.string().optional(),
    src: z.string(),
    alt: z.string(),
    axes: l1ImageAxesSchema.optional(),
    geometry: l1GeometrySchema.optional(),
    sizing: l1AxisSizingSchema.optional(),
    visibility: l1VisibilitySchema.optional(),
    transform: l1TransformSchema.optional(),
    mask: l1MaskSchema.optional(),
    padding: l1PaddingSchema.optional(),
  })
  .strict()

/**
 * A named presentation slot — the seam where a behavior module (payments,
 * auth, carousel, …) mounts inside an L1 tree (Phase D). In B1 it renders as an
 * empty, labelled placeholder; `behavior` records the intended module id.
 */
export const l1SlotSchema = z
  .object({
    kind: z.literal('slot'),
    id: z.string().optional(),
    name: z.string().min(1),
    behavior: z.string().optional(),
    geometry: l1GeometrySchema.optional(),
    visibility: l1VisibilitySchema.optional(),
    transform: l1TransformSchema.optional(),
    mask: l1MaskSchema.optional(),
    padding: l1PaddingSchema.optional(),
  })
  .strict()

// The box and container leaves are recursive (they nest children). Zod cannot
// self-infer a recursive schema, so the tree type is written by hand and the
// schemas are annotated `z.ZodType<…>` + wrapped in `z.lazy` (the leaf axes are
// still Zod-inferred; only the recursion is manual).

/** A painted box that may nest children. */
export interface L1BoxNode {
  kind: 'box'
  id?: string
  axes?: z.infer<typeof l1BoxAxesSchema>
  geometry?: z.infer<typeof l1GeometrySchema>
  sizing?: z.infer<typeof l1AxisSizingSchema>
  visibility?: z.infer<typeof l1VisibilitySchema>
  transform?: z.infer<typeof l1TransformSchema>
  mask?: z.infer<typeof l1MaskSchema>
  padding?: z.infer<typeof l1PaddingSchema>
  children?: L1NodeUnion[]
}

/** A layout container: stack / row / grid over its children. */
export interface L1ContainerNode {
  kind: 'container'
  id?: string
  layout: 'stack' | 'row' | 'grid'
  gapPx?: number
  columns?: number
  distribution?: z.infer<typeof l1DistributionSchema>
  align?: z.infer<typeof l1AlignSchema>
  sizing?: z.infer<typeof l1AxisSizingSchema>
  geometry?: z.infer<typeof l1GeometrySchema>
  visibility?: z.infer<typeof l1VisibilitySchema>
  transform?: z.infer<typeof l1TransformSchema>
  mask?: z.infer<typeof l1MaskSchema>
  padding?: z.infer<typeof l1PaddingSchema>
  children: L1NodeUnion[]
}

/** Any L1 node — the recursive tree element type. */
export type L1NodeUnion =
  | z.infer<typeof l1TextSchema>
  | z.infer<typeof l1ImageSchema>
  | z.infer<typeof l1SlotSchema>
  | L1BoxNode
  | L1ContainerNode

export const l1BoxSchema: z.ZodType<L1BoxNode> = z.lazy(() =>
  z
    .object({
      kind: z.literal('box'),
      id: z.string().optional(),
      axes: l1BoxAxesSchema.optional(),
      geometry: l1GeometrySchema.optional(),
      sizing: l1AxisSizingSchema.optional(),
      visibility: l1VisibilitySchema.optional(),
      transform: l1TransformSchema.optional(),
      mask: l1MaskSchema.optional(),
      padding: l1PaddingSchema.optional(),
      children: z.array(l1NodeSchema).optional(),
    })
    .strict(),
)

export const l1ContainerSchema: z.ZodType<L1ContainerNode> = z.lazy(() =>
  z
    .object({
      kind: z.literal('container'),
      id: z.string().optional(),
      layout: z.enum(['stack', 'row', 'grid']),
      gapPx: finite.nonnegative().optional(),
      columns: z.number().int().positive().optional(),
      distribution: l1DistributionSchema.optional(),
      align: l1AlignSchema.optional(),
      sizing: l1AxisSizingSchema.optional(),
      geometry: l1GeometrySchema.optional(),
      visibility: l1VisibilitySchema.optional(),
      transform: l1TransformSchema.optional(),
      mask: l1MaskSchema.optional(),
      padding: l1PaddingSchema.optional(),
      children: z.array(l1NodeSchema),
    })
    .strict(),
)

export const l1NodeSchema: z.ZodType<L1NodeUnion> = z.lazy(() =>
  z.union([l1TextSchema, l1ImageSchema, l1SlotSchema, l1BoxSchema, l1ContainerSchema]),
)

// ── Document-level resource table (handle → substance; DOC-27 / REQ-90) ───────

/**
 * A font-face resource: binds a `fontFamily` *handle* (a name carried in a text
 * leaf's `axes.fontFamily`) to its pixel-determining *substance* — a served
 * `.woff2`/`.woff`/`.ttf`/`.otf` asset. Without it `fontFamily: "Poppins"`
 * paints a serif fallback, because nothing serves or links the face. `src` is
 * scheme-checked by the envelope validator (served asset / http(s) only — no
 * remote fetch, no `data:`); the renderer is the sole `@font-face { src: url(…) }`
 * sink, so the substance can never smuggle raw CSS.
 */
export const l1FontFaceSchema = z
  .object({
    family: z.string().min(1),
    src: z.string().min(1),
    weight: finite.optional(),
    style: z.enum(['normal', 'italic']).optional(),
  })
  .strict()

/**
 * The document-level resource table — handles bound to their served substance
 * (DOC-27). Fonts today: the pixel-moving gap where a named face must resolve to
 * its real glyphs rather than a fallback. Images already carry `src` inline on the
 * `image` leaf, so they need no table entry (an entry earns its place iff it moves
 * a pixel the leaf axes cannot).
 */
export const l1ResourcesSchema = z
  .object({
    fonts: z.array(l1FontFaceSchema).optional(),
  })
  .strict()

// ── Document ──────────────────────────────────────────────────────────────────

/**
 * An L1 document: the viewport ladder it is authored against, an optional page
 * background colour, an optional resource table (handle→substance), and the root
 * node.
 */
export const l1DocumentSchema = z
  .object({
    widths: z.array(finite.positive()).min(1),
    background: l1Color.optional(),
    resources: l1ResourcesSchema.optional(),
    root: l1NodeSchema,
  })
  .strict()
