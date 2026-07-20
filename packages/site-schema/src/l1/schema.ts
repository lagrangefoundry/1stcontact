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
  })
  .strict()

/** Box axes — a painted surface with optional rounding / opacity. */
export const l1BoxAxesSchema = z
  .object({
    surfaceFill: l1Color.optional(),
    borderRadiusPx: finite.nonnegative().optional(),
    opacity: finite.min(0).max(1).optional(),
  })
  .strict()

/** Image axes — how the media fills its box. */
export const l1ImageAxesSchema = z
  .object({
    objectFit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
    borderRadiusPx: finite.nonnegative().optional(),
    opacity: finite.min(0).max(1).optional(),
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
    geometry: l1GeometrySchema.optional(),
    visibility: l1VisibilitySchema.optional(),
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
  })
  .strict()

/**
 * A named presentation slot — the seam where a capability module (payments,
 * auth, carousel, …) mounts inside an L1 tree (Phase D). In B1 it renders as an
 * empty, labelled placeholder; `capability` records the intended module id.
 */
export const l1SlotSchema = z
  .object({
    kind: z.literal('slot'),
    id: z.string().optional(),
    name: z.string().min(1),
    capability: z.string().optional(),
    geometry: l1GeometrySchema.optional(),
    visibility: l1VisibilitySchema.optional(),
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
      children: z.array(l1NodeSchema),
    })
    .strict(),
)

export const l1NodeSchema: z.ZodType<L1NodeUnion> = z.lazy(() =>
  z.union([l1TextSchema, l1ImageSchema, l1SlotSchema, l1BoxSchema, l1ContainerSchema]),
)

// ── Document ──────────────────────────────────────────────────────────────────

/**
 * An L1 document: the viewport ladder it is authored against, an optional page
 * background colour, and the root node.
 */
export const l1DocumentSchema = z
  .object({
    widths: z.array(finite.positive()).min(1),
    background: l1Color.optional(),
    root: l1NodeSchema,
  })
  .strict()
