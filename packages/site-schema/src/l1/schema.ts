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
import { l1ColorSchema } from './palette'

/**
 * A painted colour — a hex literal or a palette reference (REQ-114 / DOC-23 §5).
 * Never a `url()`, an `rgb(var(--…))` or a keyword. One alias, used at every
 * colour axis, so the literal-base/palette-overlay model reaches all of them.
 */
const l1Color = l1ColorSchema

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
    /**
     * REQ-88 — the viewport HEIGHT this keyframe was captured at. Inert on its
     * own; it is the origin {@link l1ViewportResponseSchema} measures from, so a
     * height-responsive node still evaluates to exactly its captured geometry at
     * the size the capture used. Absent on documents folded before height probing.
     */
    atHeight: finite.positive().optional(),
  })
  .strict()

/** Between two adjacent keyframes, either linearly interpolate or hold-then-snap. */
export const l1SegmentSchema = z.enum(['interpolate', 'snap'])

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

// ── Viewport-relative extent (REQ-88 round 6) ─────────────────────────────────
//
// A keyframe track samples a *rule* at N widths and models everything between and
// beyond those samples as a straight line. That is exact at the samples and wrong
// wherever the underlying rule is not linear in width — and the two most common
// rules on a real page are not:
//
//   * `min-h-screen` / `100vh` — height depends on viewport HEIGHT, an axis the
//     width ladder cannot see at all. A pinned px height freezes the fold at
//     whatever height the capture happened to use.
//   * `mx-auto` + `max-w-*` — a centred column's left edge is
//     `max(0, (vw - container)/2) + inset`: FLAT while the viewport is narrower
//     than the container, then rising at half rate. Interpolating across that
//     knee overstates the margin everywhere in between, and holding the last
//     keyframe understates it above the widest sample.
//
// Both are expressible as typed, closed-form viewport functions. Where one fits
// every sample exactly it replaces the sampled axis outright — the reproduction
// then tracks the rule instead of approximating it, at every width and every
// height, not just at the six the capture happened to visit.

/**
 * How a node's vertical geometry responds to the viewport **height** — the axis a
 * width ladder cannot see at all.
 *
 * Expressed as a derivative rather than an absolute, because a `100vh` hero is
 * never a local fact: the hero's own height tracks the viewport, and *every node
 * below it* is pushed down by the same amount. One node's `height` response of 1
 * implies a `y` response of 1 for the whole rest of the page. Writing it as
 * `d/d(viewport height)` lets both say the same thing in the same units.
 *
 * Each axis is applied against its keyframe's own {@link l1KeyframeSchema.atHeight}:
 *
 *   y      = keyframe.y      + yFactor      * (100vh - keyframe.atHeight)
 *   height = keyframe.height + heightFactor * (100vh - keyframe.atHeight)
 *
 * so a keyframe evaluates back to exactly its captured value at the height it was
 * captured at, and the response only takes effect as the viewport departs from it.
 * A `min-h-screen` hero is `{heightFactor: 1}`; the sections below it are
 * `{yFactor: 1}`; a run centred within the hero is `{yFactor: 0.5}`.
 */
export const l1ViewportResponseSchema = z
  .object({
    yFactor: finite.min(-10).max(10).optional(),
    heightFactor: finite.min(-10).max(10).optional(),
  })
  .strict()

/**
 * A document's centred content column — the shared frame `mx-auto max-w-*`
 * describes. Document-level because it is ONE design constant every anchored node
 * refers to (change it once, the whole page re-columns), and because a per-node
 * copy would let two nodes disagree about a column they visibly share.
 *
 *   origin(vw) = max(0, (vw - containerPx) / 2) + insetPx
 *   extent(vw) = min(maxWidthPx, min(containerPx, vw) - 2 * insetPx)
 */
export const l1ColumnSchema = z
  .object({
    /** Max width of the centred container itself (Tailwind `max-w-6xl` → 1152). */
    containerPx: finite.positive(),
    /** Horizontal padding inside the container (`px-6` → 24). */
    insetPx: finite.nonnegative(),
    /** Optional cap on the content width inside the container (`max-w-4xl` → 896). */
    maxWidthPx: finite.positive().optional(),
  })
  .strict()

/**
 * One axis expressed against the column: `px + fraction * extent`, optionally
 * capped. The cap is what a nested `max-w-*` looks like — a run inside the column
 * that fills it until its own narrower maximum takes over.
 */
export const l1ColumnTermSchema = z
  .object({
    px: finite.optional(),
    fraction: finite.optional(),
    /** Upper bound on the result (`min(maxPx, px + fraction * extent)`). */
    maxPx: finite.positive().optional(),
    /**
     * A per-width track for the constant, superseding `px` — the offset *inside*
     * the column, keyframed.
     *
     * Needed because a page changes layout MODE across the ladder: a 3-up grid
     * stacks at mobile, and the hero title sits in a narrower gutter below `md`.
     * No single affine function of the column covers both regimes, so those nodes
     * would keep fully-absolute keyframes and drift away from their anchored
     * neighbours exactly where the column origin starts moving.
     *
     * Tracking the *residual* rather than the absolute position is strictly
     * better than keyframing `x`: the origin stays closed-form, so wherever the
     * inset is locally constant (the whole desktop range) the node tracks the
     * column exactly, and the interpolation that remains applies to a small local
     * offset instead of the whole position.
     */
    pxTrack: l1ScalarTrackSchema.optional(),
  })
  .strict()

/**
 * A node's placement within the document {@link l1ColumnSchema}:
 *
 *   x     = origin + x.px     + x.fraction     * extent
 *   width =         width.px + width.fraction * extent   (capped by width.maxPx)
 *
 * **The two axes are independent, and that independence is load-bearing.** They
 * were coupled at first — anchor both or neither — on the reasoning that the
 * renderer takes them together. The result was worse than not anchoring at all:
 * on the reference hero, one line's width happened to equal the column extent and
 * the other three did not, so one line followed the column while its neighbours
 * kept drifting keyframes. At 1150px they sat at 24px and 55.5px respectively —
 * a 31px split in text the reference keeps flush.
 *
 * Alignment is a *shared* property; width is a private one. A node whose left edge
 * follows the column must say so even when its width is its own business.
 *
 * Each axis is present only when its fit reproduces every captured sample;
 * otherwise that axis keeps its keyframes and nothing is invented.
 */
export const l1ColumnAnchorSchema = z
  .object({
    x: l1ColumnTermSchema.optional(),
    width: l1ColumnTermSchema.optional(),
  })
  .strict()

/**
 * A geometry track: keyframes sorted ascending by `at`, plus an optional
 * per-segment interpolation flag (length `keyframes.length - 1`). Absent segment
 * flags default to `interpolate` for every segment.
 */
export const l1GeometrySchema = z
  .object({
    keyframes: z.array(l1KeyframeSchema).min(1),
    segments: z.array(l1SegmentSchema).optional(),
    /** REQ-88 — how `y` / `height` track the viewport height (the `100vh` axis). */
    viewportResponse: l1ViewportResponseSchema.optional(),
    /**
     * REQ-88 — when present (and the document declares a `column`), `x` and
     * `width` come from the column function rather than the keyframe track. `y`
     * always stays keyframed: vertical position is the cumulative integral of
     * everything above it and has no closed form.
     */
    anchor: l1ColumnAnchorSchema.optional(),
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

/** A container's flow mode: stacked (column), row, or grid. */
export const l1LayoutModeSchema = z.enum(['stack', 'row', 'grid'])

/**
 * REQ-104 — one breakpoint of a container's layout mode: the mode in force from
 * `at` px upward. Discrete, so there is no `segments` companion — a layout mode
 * has nothing to interpolate, it snaps.
 */
export const l1LayoutKeyframeSchema = z
  .object({
    at: finite.nonnegative(),
    value: l1LayoutModeSchema,
  })
  .strict()

/**
 * REQ-104 — a per-width track for a container's layout mode: the axis that lets a
 * horizontal run of peers become a vertical one on a narrow screen, which is the
 * single most common responsive behaviour on the web.
 *
 * The first keyframe's mode is also the base (in force *below* its `at`), and each
 * subsequent keyframe overrides from its `at` upward — the same mobile-first
 * cascade {@link l1ScalarTrackSchema} compiles to. `container.layout` stays the
 * representative (widest) value for non-responsive consumers, and the envelope
 * requires the two to agree so they cannot drift apart.
 *
 * **`at` is a breakpoint, not a sample.** Geometry and scalar tracks keyframe at
 * the document's captured `widths` because they are *sampled* from a capture and
 * interpolated between samples. A layout mode is neither: it is an authored design
 * decision that snaps at a width the capture may never have visited (REQ-83's hint
 * pass reads a page's real `@media` breakpoints for exactly this reason). So `at`
 * is free, like {@link l1VisibilitySchema}'s `fromPx`.
 *
 * This exists because the only alternative was authoring the subtree **twice**
 * under paired `visibility.fromPx` / `untilPx` — which doubles the node count,
 * silently desynchronises when one copy is edited, feeds `staggerMs` phantom
 * peers, and for a {@link l1ControlSchema} leaf is not merely expensive but
 * *malformed*: duplicating a control duplicates a form field, so both copies share
 * one `name` and one `id`. `visibility` is CSS, not `disabled` — the hidden copy
 * still submits, and the duplicate id breaks the `for`↔`id` association the module
 * exists to guarantee. A control row that becomes a control column has to be ONE
 * subtree, and this is the axis that makes it one.
 */
export const l1ResponsiveLayoutSchema = z
  .object({
    keyframes: z.array(l1LayoutKeyframeSchema).min(1),
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
 * REQ-103 — where a radial gradient's centre sits. A closed set of the nine box
 * positions CSS names, never an `at 30% 40%` string: the author picks a corner or
 * an edge, and the renderer is the only thing that knows the syntax.
 */
export const l1GradientOriginSchema = z.enum([
  'center',
  'top',
  'bottom',
  'left',
  'right',
  'top-left',
  'top-right',
  'bottom-left',
  'bottom-right',
])

/** REQ-103 — how far a radial gradient's final stop reaches (CSS `<extent-keyword>`). */
export const l1GradientExtentSchema = z.enum([
  'closest-side',
  'closest-corner',
  'farthest-side',
  'farthest-corner',
])

/**
 * A linear gradient — typed structured form (mirrors the capture `TextGradient`).
 * `angleDeg` is a CSS angle (0 = to-top, 90 = to-right); absent → default `180deg`.
 * Used for text-fill gradients and surface/panel gradients alike.
 *
 * REQ-103 — `kind` is optional here and required on {@link l1RadialGradientSchema},
 * so linear is what a gradient is when it does not say otherwise. That is not a
 * compatibility shim: linear is the shape a capture folds to, and a discriminator
 * every folded gradient would have to restate is noise on the overwhelmingly
 * common case.
 */
export const l1LinearGradientSchema = z
  .object({
    kind: z.literal('linear').optional(),
    angleDeg: finite.optional(),
    stops: z.array(l1GradientStopSchema).min(2),
  })
  .strict()

/**
 * REQ-103 — a radial gradient: the soft glow behind a headline, which is the most
 * common single device in dark-theme marketing design and had no representation
 * at all while L1's only gradient was linear.
 *
 * The axes a radial has and a linear does not (`origin`, `extent`) live only on
 * this branch, and `angleDeg` lives only on the other, so the two cannot be mixed
 * into a gradient that means nothing — a radial with an angle is rejected by the
 * schema rather than silently ignored by the renderer.
 */
export const l1RadialGradientSchema = z
  .object({
    kind: z.literal('radial'),
    origin: l1GradientOriginSchema.optional(),
    extent: l1GradientExtentSchema.optional(),
    stops: z.array(l1GradientStopSchema).min(2),
  })
  .strict()

/** A gradient fill — linear (the default) or radial (REQ-103). */
export const l1GradientSchema = z.union([l1LinearGradientSchema, l1RadialGradientSchema])

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
 * string. `shape` names the geometry (circular crop, a feathered edge); the
 * remaining fields parameterise whichever shape names them and are inert on the
 * rest, exactly as {@link l1PatternSchema}'s `angleDeg` is inert on `dots`.
 *
 * REQ-136 — `parallelogram` and `blob` join the geometric shapes, because "what
 * shape is this picture" is a question the editor now asks and L1 could answer
 * only with `circle` / `ellipse` (a rounded rectangle being the shared surface's
 * `borderRadiusPx`, not a mask). Both compile to `clip-path: polygon(…)` built
 * ENTIRELY by the renderer from these numbers — the document names the intent and
 * never the geometry, which is what keeps a shape from becoming a path string
 * the instance authored (DOC-2 §2).
 */
export const l1MaskSchema = z
  .object({
    shape: z.enum([
      'circle',
      'ellipse',
      'parallelogram',
      'blob',
      'featherRadial',
      'featherTop',
      'featherBottom',
    ]),
    featherPx: finite.nonnegative().optional(),
    /**
     * REQ-136 — `parallelogram` only: how far the top edge leans, as a percentage
     * of the box width. Positive leans right, negative leans left; the bounds keep
     * a lean from consuming the whole box (at ±50 the shape degenerates to a
     * triangle, which is a different intent and not one this axis names).
     */
    slantPct: finite.min(-45).max(45).optional(),
    /**
     * REQ-136 — `blob` only: 0 is a plain disc, 1 is maximally lumpy. There is
     * deliberately **no vertex count** — how many points make an outline "organic"
     * is a renderer constant, exactly as {@link l1PointerAccentSchema}'s lobe count
     * is, and exposing it would let a document reach into the mask's construction.
     */
    roughness: finite.min(0).max(1).optional(),
    /**
     * REQ-136 — `blob` only: which blob. The outline is pseudo-random but
     * DETERMINISTIC in this integer, because a shape that differed between two
     * renders of the same document would break the round-trip identity the whole
     * substrate is gated on (DOC-23 §7) — and would flicker under the editor's
     * re-render on every save.
     */
    seed: z.number().int().min(0).max(9999).optional(),
  })
  .strict()

/**
 * REQ-136 — a typed colour-adjustment stack (CSS `filter`), never a raw filter
 * string.
 *
 * Values are CSS-CANONICAL FRACTIONS rather than percentages, because that is
 * what `getComputedStyle().filter` reports (`saturate(0.4)`, not `saturate(40%)`)
 * — so the capture fold can write what it measured and the round trip closes
 * without a unit conversion nobody would remember was there. The editor's
 * percentage controls are a *projection* over these, on the same footing as
 * REQ-135's `italic` over `fontStyle`.
 *
 * The identity value is 1 for the scaling functions (`saturate`, `brightness`,
 * `contrast`) and 0 for the rest, so an absent field is always a no-op and the
 * emitter can skip it.
 *
 * DISTINCT FROM `backdropBlurPx`, which blurs whatever sits BEHIND the node
 * (`backdrop-filter`); `blurPx` here blurs the node's own paint. Two axes because
 * they are two effects — a frosted panel over a photograph is the first, a soft-
 * focus photograph is the second, and one field could not express both at once.
 */
export const l1FilterSchema = z
  .object({
    grayscale: finite.min(0).max(1).optional(),
    sepia: finite.min(0).max(1).optional(),
    invert: finite.min(0).max(1).optional(),
    saturate: finite.nonnegative().optional(),
    brightness: finite.nonnegative().optional(),
    contrast: finite.nonnegative().optional(),
    hueRotateDeg: finite.optional(),
    blurPx: finite.nonnegative().optional(),
  })
  .strict()

/**
 * REQ-136 — where the picture sits inside its box (CSS `object-position`), as a
 * percentage pair. This is the **pan half of a crop**: with `objectFit: 'cover'`
 * the box shows a window onto the image, and this is which part of it.
 *
 * BOTH COMPONENTS ARE REQUIRED, and that is not pedantry. CSS defaults an
 * unspecified component to 50%, so a half-written position is not "unset on one
 * axis" — it is a silent, load-bearing 50% that the document never said. Making
 * the pair the unit means the axis is either absent (the browser's centre) or
 * fully stated.
 */
export const l1ObjectPositionSchema = z
  .object({
    xPct: finite.min(0).max(100),
    yPct: finite.min(0).max(100),
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
 * REQ-103 — a repeating surface texture: the dot-grid, hairline grid or rule set
 * that separates a premium dark page from a flat one.
 *
 * Every surface L1 could paint was a flat colour or one gradient, and a
 * background image was pinned to `cover` / `no-repeat` (BUG-13), so a 24×24
 * dot-grid could not tile. The only route left was a single full-bleed asset
 * stretched across the box — which distorts at every viewport it was not authored
 * for, costs a binary per section, and pushes the design decision out of L1 and
 * back into a hand-authored file, which is precisely what the substrate exists to
 * prevent (DOC-23, DOC-24).
 *
 * So the intent is named, not the declaration — the same move `borderLeft` and
 * `overlay` already made. `spacingPx` is the tile period; `thicknessPx` is the
 * line width, or the dot **diameter** for `dots` (default 1px, 2px respectively);
 * `angleDeg` tilts `lines` only and is inert on the other shapes, exactly as
 * {@link l1MaskSchema}'s `featherPx` is inert on a circular crop. The renderer
 * compiles the lot to repeating gradients, so no asset is involved and nothing
 * from the instance reaches CSS as a string.
 */
export const l1PatternSchema = z
  .object({
    shape: z.enum(['dots', 'grid', 'lines']),
    spacingPx: finite.positive(),
    thicknessPx: finite.positive().optional(),
    color: l1Color,
    angleDeg: finite.optional(),
  })
  .strict()

/**
 * REQ-108 — a pointer-reactive accent on whatever texture the node already
 * paints: within a rough region tracking the cursor, the texture is redrawn in a
 * second colour, so a grid appears to come alive under the reader's hand.
 *
 * It is a **sibling of {@link l1PatternSchema}, not a field inside it**, because
 * the texture it accents may be either the `pattern` axis (the flat hairline grid)
 * or a `backgroundImageUrl` (the hero's perspective grid, which no orthogonal
 * tile can express). One axis covers both; the renderer resolves which.
 *
 * The author names the *intent* — a colour, how far the region reaches, how soft
 * its edge, how rough its outline — and never the mechanism. There is
 * deliberately **no blob count**: how many lobes make an outline "rough" is a
 * renderer constant, not a design decision, and exposing it would let a document
 * reach into the mask's construction. `roughness` (0 = a plain disc, 1 = maximally
 * lumpy) is the whole of the dial.
 *
 * Everything about the motion — that the region lags, deforms while moving, and
 * settles when still — is the renderer's script and CSS, so the axis stays a
 * static value bag that a captured page can round-trip.
 */
export const l1PointerAccentSchema = z
  .object({
    /** The colour the texture is redrawn in inside the region. */
    color: l1Color,
    /** How far the region reaches from the cursor — half its rough diameter. */
    radiusPx: finite.positive(),
    /** Width of the region's feathered edge; 0 is a hard cut. Defaults to a third of the radius. */
    softnessPx: finite.nonnegative().optional(),
    /** 0 → a plain disc; 1 → maximally lumpy. Defaults to a middling roughness. */
    roughness: finite.min(0).max(1).optional(),
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

/**
 * REQ-88 — per-width tracks for the padding sides that vary across the ladder,
 * mirroring {@link l1TextResponsiveSchema}.
 *
 * Geometry and type both keyframe; padding did not, so it was pinned to the
 * *widest* sample and replayed at every width. That is silent as long as a page's
 * padding is width-invariant — but the pinned box is a border box, so a desktop
 * pad replayed at 320px eats the content width from the inside, and the first
 * symptom is a run wrapping or clipping at mobile for no visible reason. A track
 * per side keeps the inset honest at every width, exactly as geometry is.
 */
export const l1PaddingResponsiveSchema = z
  .object({
    topPx: l1ScalarTrackSchema.optional(),
    rightPx: l1ScalarTrackSchema.optional(),
    bottomPx: l1ScalarTrackSchema.optional(),
    leftPx: l1ScalarTrackSchema.optional(),
  })
  .strict()

// ── The shared surface/paint axis group (REQ-98) ──────────────────────────────
//
// Which node kinds could *paint* used to be arbitrary: `box`/`image`/`text` each
// re-declared an overlapping slice of these axes, while `container` and `slot`
// carried none. So any element that was both painted and internally laid out
// needed TWO nodes — a `box` wrapping a `container` — and every new kind
// (REQ-96's `control`) re-litigated the question by hand.
//
// That is a hole in the REQ-96 contract, not an ergonomic complaint: L1 owns
// class, geometry and every paint axis, and a behavior module ships zero CSS. An
// axis L1 cannot carry on the node that needs it is an axis a module must paint.
//
// So the group is declared ONCE, here, and spread into every kind that renders a
// box. A kind adds only what is *its own* (text adds type, image adds
// `objectFit`, container adds layout); nothing re-declares a surface.

const surfaceAxesShape = {
  /** The painted fill behind the node's content. */
  surfaceFill: l1Color.optional(),
  /** Corner rounding. A pill saturates at half the painted height. */
  borderRadiusPx: finite.nonnegative().optional(),
  opacity: finite.min(0).max(1).optional(),
  /** A gradient panel fill (a `background-image` gradient over the surface). */
  surfaceGradient: l1GradientSchema.optional(),
  /** REQ-103 — a repeating texture (dot-grid / hairline grid / rules) over the fill. */
  pattern: l1PatternSchema.optional(),
  /** A background image (scheme-checked by the envelope, like `image.src`). */
  backgroundImageUrl: z.string().optional(),
  /**
   * REQ-108 — the node's texture (its {@link pattern}, else its
   * {@link backgroundImageUrl}) redrawn in a second colour inside a rough region
   * tracking the pointer. Inert on a node that paints no texture.
   */
  pointerAccent: l1PointerAccentSchema.optional(),
  /** A full-bleed translucent scrim painted over the background (hero overlay). */
  overlay: l1OverlaySchema.optional(),
  /** A drop shadow cast by the node. */
  boxShadow: l1ShadowSchema.optional(),
  /** A painted border (uniform, all four sides). */
  border: l1BorderSchema.optional(),
  /**
   * BUG-14 — a coloured left-accent border (a card's orange/blue rule), distinct
   * from the uniform {@link border}: a card frequently carries only a thick
   * `border-left` as its accent, and drawing that as a full box outline is the
   * wrong look. A typed left-border primitive (never raw CSS) keeps the accent
   * faithful while the substrate stays safe by construction.
   */
  borderLeft: l1BorderSchema.optional(),
  /** Frosted-glass blur of whatever sits behind the node (backdrop-filter). */
  backdropBlurPx: finite.nonnegative().optional(),
  /**
   * REQ-136 — the node's OWN paint, colour-adjusted (CSS `filter`). On the shared
   * surface group rather than on `image` alone for the reason REQ-98 put every
   * paint axis here: a captured `filter` is read per painted element, not per
   * `<img>`, and an axis L1 can carry on only one kind is an axis every other kind
   * has to reach outside L1 for.
   */
  filter: l1FilterSchema.optional(),
  /** How the node composites with what is behind it. */
  blendMode: l1BlendModeSchema.optional(),
} as const

/**
 * REQ-98 — the paint capability every box-rendering node kind carries: `box`,
 * `container`, `text`, `image`, `slot`, `control`. One declaration, spread into
 * each kind's axis bag, so a painted-and-laid-out element is ONE node and a new
 * kind inherits the surface rather than re-deriving it.
 */
export const l1SurfaceAxesSchema = z.object(surfaceAxesShape).strict()

// ── Interaction state (REQ-99) ────────────────────────────────────────────────
//
// L1 had no vocabulary for interaction state at all — no `:hover`, no
// `:focus-visible` — so every control it paints was visually inert: a button
// gave no pointer feedback, and a field got whatever focus treatment the user
// agent happened to supply.
//
// That was survivable while a module could paint its own controls. Since REQ-96
// it is not: L1 is the sole owner of appearance and a behavior module ships zero
// CSS, so an interaction treatment L1 cannot express is one that cannot exist.
//
// The axes are typed and closed exactly like every other pixel-mover here — a
// state is a *delta bag* of the same paint axes the base node carries, plus a
// typed motion. Never a CSS string, never a selector: the renderer is the only
// thing that knows a colon-pseudo exists.

/** Transition timing curve — a closed enum, never a raw `cubic-bezier(…)` string. */
export const l1EasingSchema = z.enum(['linear', 'ease', 'ease-in', 'ease-out', 'ease-in-out'])

/**
 * How the node animates *between* its states.
 *
 * Declared on the interaction as a whole rather than inside `hover`, because a
 * CSS transition lives on the base rule and therefore governs the leave as well
 * as the enter. Putting it inside one state would describe only half the motion
 * and silently make un-hovering instant.
 */
export const l1TransitionSchema = z
  .object({
    durationMs: finite.nonnegative(),
    easing: l1EasingSchema.optional(),
  })
  .strict()

/**
 * A state's movement — the small lift/scale that reads as "this responds".
 * Composed with the node's own {@link l1TransformSchema} by the renderer, because
 * a CSS `transform` replaces rather than accumulates: a state that only wants to
 * nudge would otherwise silently discard the node's authored rotation.
 */
export const l1MotionSchema = z
  .object({
    offsetXPx: finite.optional(),
    offsetYPx: finite.optional(),
    scale: finite.positive().optional(),
    rotateDeg: finite.optional(),
  })
  .strict()

/**
 * A focus indicator — an outline ring outside the node's box.
 *
 * **There is deliberately no way to express "no ring".** `widthPx` is positive,
 * the field carries no `none` variant, and the renderer emits a default ring for
 * every interactive node that does not author one. A visible focus indicator is
 * the one place where an obligation outranks taste, so the substrate gives taste
 * no vocabulary to override it (DOC-24: the envelope constrains safety, not
 * appearance — and this is a safety axis wearing an appearance's clothes).
 */
export const l1FocusRingSchema = z
  .object({
    widthPx: finite.positive(),
    color: l1Color,
    offsetPx: finite.optional(),
    style: z.enum(['solid', 'dashed', 'dotted', 'double']).optional(),
  })
  .strict()

/**
 * The paint + motion delta a node takes on in an interaction state. It is the
 * shared surface group (REQ-98) plus the two run axes a hover most often changes
 * (colour, underline) plus a typed motion — so a state can restate any axis the
 * base node could paint, and nothing new had to be invented for it to do so.
 */
const interactionStateShape = {
  ...surfaceAxesShape,
  color: l1Color.optional(),
  textDecoration: z.enum(['none', 'underline', 'line-through', 'overline']).optional(),
  motion: l1MotionSchema.optional(),
} as const

/** The pointer-hover state delta. */
export const l1HoverStateSchema = z.object(interactionStateShape).strict()

/** The keyboard-focus state delta, plus its ring. */
export const l1FocusStateSchema = z
  .object({ ...interactionStateShape, ring: l1FocusRingSchema.optional() })
  .strict()

/**
 * REQ-99 — a node's interaction states. Node-level (like {@link l1TransformSchema}
 * / {@link l1MaskSchema} / {@link l1PaddingSchema}), so every kind carries it
 * uniformly rather than each kind re-deriving its own slice — the asymmetry
 * REQ-98 removed from the paint group.
 */
export const l1InteractionSchema = z
  .object({
    transition: l1TransitionSchema.optional(),
    hover: l1HoverStateSchema.optional(),
    focus: l1FocusStateSchema.optional(),
  })
  .strict()

// ── Navigation (REQ-106) ──────────────────────────────────────────────────────
//
// L1 had no way to express a link at all: no `href` in the schema, no anchor kind,
// and `<a>` never appeared in the renderer's output. An L1 page therefore had no
// navigation of any kind — a functional floor, not an aesthetic ceiling, and the
// one gap on this list no amount of design work can compensate for.
//
// A link is not a *kind* of thing, it is a *role* any subtree can take: a text
// run, a painted box around a run, a whole card, an image. So it is a node-level
// field like {@link l1TransformSchema} / {@link l1InteractionSchema}, not a
// seventh node kind.

/**
 * REQ-106 — the navigation role.
 *
 * The renderer **retags** rather than wraps: a node that already emits one element
 * emits an `<a>` instead, keeping its class verbatim. Wrapping would put focus on
 * an outer element while {@link l1InteractionSchema}'s `focus` targets the inner
 * class, silently costing a linked node its focus ring — the one axis DOC-24 holds
 * above taste. Only `image` wraps, because a void element cannot be an anchor.
 *
 * `control` deliberately cannot carry this: an anchor around a submit button is a
 * malformed interactive nesting, and the module owns that element's semantics.
 * Because every node object is `.strict()`, that exclusion is enforced by the
 * shape rather than by a rule someone has to remember.
 */
export const l1LinkSchema = z
  .object({
    /**
     * Cleared by the same `isSafeUrl` allowlist that guards `image.src` and
     * `backgroundImageUrl`, so `javascript:` is rejected with no new security
     * surface. An unsafe href degrades to the un-linked element — never a live
     * unsafe link.
     */
    href: z.string(),
    /**
     * Opens in a new browsing context. There is deliberately no way to ask for
     * `_blank` without its `rel`: the renderer always pairs it with
     * `noopener noreferrer`, because the opener reference is a security hole
     * rather than a preference.
     */
    newTab: z.boolean().optional(),
    /** An accessible name, for when the visible content is not a sufficient one. */
    ariaLabel: z.string().optional(),
  })
  .strict()

/** REQ-106 — the navigation role a node may take. */
export type L1Link = z.infer<typeof l1LinkSchema>

// ── Scroll reveal (REQ-100) ───────────────────────────────────────────────────
//
// L1 had no motion of any kind: no transition, no animation, no notion of
// "entering the viewport". Every page it rendered arrived fully formed, which
// DOC-17 names as the single biggest "alive vs template" tell — and which the
// xgd.dev build (REQ-95) hit the moment sections 2–5 existed to scroll past.
//
// Motion is an *adjective*, not a noun, so it belongs here rather than in a
// behavior module: a reveal modifies a node already in the tree, wraps nothing,
// and needs no named slot. Putting it in a module would also make animated
// content unfoldable by construction — `fold` maps captured node axes onto L1
// node axes and never authors a module.
//
// The axes are exactly the ones the page demanded, and no more. There is no
// `xPx` and no entry scale: sections 2–5 wanted a rise and a fade, so a rise and
// a fade is what the substrate gained. Timing reuses REQ-99's
// {@link l1EasingSchema} rather than minting a second vocabulary for the same
// idea.

/**
 * How a node enters when it first scrolls into view.
 *
 * The node settles at the geometry and opacity it already declares — this names
 * only where it comes *from*, so a reveal never restates the design. A node
 * authored at `opacity: 0.6` reveals to `0.6`, not to `1`.
 *
 * `delayMs` is the per-node escape hatch from a container's {@link
 * L1ContainerNode.staggerMs}: stagger indexes children by position, which is
 * right for a row of peers and wrong wherever two nodes sit in the count where
 * the reader only ever sees one.
 *
 * REQ-104 removed the case that motivated it — a visibility-paired duplicate
 * subtree (the hero's `cta-row` / `cta-stack`), which existed only because
 * `layout` could not vary with width and is now one node carrying a
 * {@link l1ResponsiveLayoutSchema} track. The hatch stays for the cases a
 * positional index still cannot express.
 */
export const l1RevealSchema = z
  .object({
    /** Vertical offset the node rises *from*, in px. Negative descends. */
    yPx: finite.optional(),
    /** Opacity the node fades *from*. Absent → 0. */
    fromOpacity: finite.min(0).max(1).optional(),
    durationMs: finite.nonnegative().optional(),
    delayMs: finite.nonnegative().optional(),
    easing: l1EasingSchema.optional(),
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
    /**
     * REQ-88 — the viewport width at and above which this run is **unbreakable**,
     * because the reference set it on a single line at every captured width from
     * here up. Absent when the reference wrapped it everywhere.
     *
     * It exists because a fold turns a flowed run into a fixed-width absolutely
     * positioned box, which re-opens a decision the reference had already closed.
     * A shrink-to-fit run's box IS its glyph extent, so the box clears the text it
     * must hold by a fraction of a pixel — and every engine measures glyphs
     * slightly differently. Chromium fits `Designed for developers…` in 414px by
     * 0.77px; Gecko does not, wraps it, and the second line prints on top of the
     * next absolutely-positioned run. Rounding the box up buys a fraction of a
     * pixel and leaves the outcome to luck; this states the fact the reference
     * already established, so no engine gets a vote.
     *
     * A *width*, not a flag, because line count is a function of width and the two
     * are not the same claim: the checklist items above are one line on desktop
     * and three at 320px. A flag can only be set for runs that never wrap at any
     * width — which excludes precisely the runs that broke. The threshold is the
     * smallest captured width from which every wider sample is single-line, so it
     * is exact at every sample and never pins a run the reference wrapped.
     */
    nowrapFromPx: finite.nonnegative().optional(),
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
    //
    // A run whose OWN element paints a self-contained chip (a `rounded-full`
    // "Coming soon" badge, a tag pill, a button-shaped link). The DOM routinely
    // fuses "a styled run" and "a painted surface" into one element, but L1 once
    // forced them into disjoint `text` / `box` leaves — so a badge folded to a
    // text leaf lost its pill entirely (radius 0, no shadow). Since REQ-98 the
    // surface a run paints is the SAME group every other kind carries, read as
    // the capture reads it (own computed style, never an ancestor walk — that is
    // the enclosing card's treatment, which stays on the card box).
    ...surfaceAxesShape,
  })
  .strict()

/** Image axes — how the media fills its box, plus the shared painted surface. */
export const l1ImageAxesSchema = z
  .object({
    objectFit: z.enum(['cover', 'contain', 'fill', 'none', 'scale-down']).optional(),
    /**
     * REQ-136 — which part of the picture the box shows. Image-only, and
     * deliberately not hoisted into the shared surface group: the property family
     * differs (`object-position` frames replaced content, `background-position`
     * frames a paint layer), and a surface's background is still pinned to
     * `center` by BUG-13's `cover / center / no-repeat`. Unpinning that is the
     * same axis on a different family, and it is phase 2.
     */
    objectPosition: l1ObjectPositionSchema.optional(),
    ...surfaceAxesShape,
  })
  .strict()

// ── The shared node-level axis groups (REQ-105) ───────────────────────────────
//
// REQ-98 hoisted *paint* into one shape spread into every kind. The node-level
// groups below — the ones that answer "where is this box, how big is it, is it
// here at all, how does it move" — were left declared BY HAND on each kind, and
// promptly drifted: `slot` was the one box-rendering kind with no `sizing`, so a
// mounted behavior module could be painted but not measured, and giving it a
// max-width cost a container that existed only to carry the number.
//
// That is the same "two nodes for one element" hole REQ-98 named, and REQ-97 had
// already patched it once for `text`. Patching a third kind by hand would leave
// the fourth to drift, so the groups are declared ONCE, here, and spread into
// every kind. A new kind inherits them rather than re-deriving which ones it is
// allowed to have.
//
// `link` is deliberately NOT in this shape: it is a per-kind decision, not a
// universal one (a `control` is already the interactive element the module
// declared, and a `slot` is a mount point rather than something a reader
// follows), so it stays declared by the four kinds that actually navigate.

const nodeAxisGroupsShape = {
  /** Per-width absolute placement — the transcription face's pinned box. */
  geometry: l1GeometrySchema.optional(),
  /**
   * REQ-105 — the node's own extent: a fixed px, fluid fill, or hug, per axis,
   * with min/max. Every box-rendering kind carries it, `slot` included: a seam
   * that can be filled and framed but not measured forces a sizing-only wrapper
   * around it, which is a node with no content, no paint and no semantic role.
   */
  sizing: l1AxisSizingSchema.optional(),
  visibility: l1VisibilitySchema.optional(),
  transform: l1TransformSchema.optional(),
  mask: l1MaskSchema.optional(),
  padding: l1PaddingSchema.optional(),
  /** REQ-88 — per-width padding tracks; a track owns its side at render time. */
  responsivePadding: l1PaddingResponsiveSchema.optional(),
  /** REQ-99 — typed hover / focus states; the renderer is the sole pseudo-class sink. */
  interaction: l1InteractionSchema.optional(),
  /** REQ-100 — typed scroll-entrance; the renderer owns the observer that drives it. */
  reveal: l1RevealSchema.optional(),
} as const

/**
 * REQ-105 — the node-level axis groups every L1 node kind carries: placement,
 * sizing, visibility, transform, mask, padding (static + responsive) and the
 * typed interaction / reveal states. One declaration, spread into each kind.
 */
export const l1NodeAxisGroupsSchema = z.object(nodeAxisGroupsShape).strict()

/** The inferred shape of {@link l1NodeAxisGroupsSchema} — every field optional. */
export type L1NodeAxisGroups = z.infer<typeof l1NodeAxisGroupsSchema>

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
    /**
     * REQ-97 — `sizing` gives a run its own **measure**: the max line length,
     * which is the most fundamental control in typography and the one axis a
     * paragraph must be able to declare for itself. `width` is the axis that
     * matters; a text leaf's height is natural, from flow (see
     * {@link l1KeyframeSchema}), so pinning it merely clips or pads.
     */
    ...nodeAxisGroupsShape,
    /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
    link: l1LinkSchema.optional(),
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
    ...nodeAxisGroupsShape,
    /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
    link: l1LinkSchema.optional(),
  })
  .strict()

/**
 * REQ-96 — a **control leaf**: the second composition direction, where *L1 wraps
 * the module* instead of the module wrapping L1.
 *
 * A `slot` works when the behavioural element is a **container** — a carousel's
 * `<li>` really can hold a slide's whole L1 look. It is structurally impossible
 * for a **leaf**: `<input>` is a void element and `<textarea>`'s content is its
 * value, so there is nowhere to put an L1 subtree. Under the slot model alone a
 * behavior module therefore *had* to paint its own controls, which no validator
 * could catch — the contract had no vocabulary for "this element's look belongs
 * to L1" (DOC-25 §10).
 *
 * A control node names an element the mounted behavior declared (`control`), and
 * the renderer emits that element carrying **L1's class, geometry and paint
 * axes**. The module contributes only the element's attribute bundle — its
 * `type` / `name` / `required` / label wiring — so the safety envelope stays
 * construction-time while appearance stays 100% L1.
 *
 * An unbound name renders nothing: a control whose module is absent degrades
 * inertly rather than painting a bare, UA-styled input into the page.
 */
export const l1ControlSchema = z
  .object({
    kind: z.literal('control'),
    id: z.string().optional(),
    /** The module-declared element this node paints (a field name, `submit`, …). */
    control: z.string().min(1),
    /**
     * Paint axes, identical to a text run's: a control is a styled text-bearing
     * leaf (a placeholder, a button label) that may also paint its own surface.
     */
    axes: l1TextAxesSchema.optional(),
    responsive: l1TextResponsiveSchema.optional(),
    ...nodeAxisGroupsShape,
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
    /** REQ-98 — the seam's own painted surface (a framed, filled mount point). */
    axes: l1SurfaceAxesSchema.optional(),
    /**
     * REQ-105 — including `sizing`: the seam is measurable as well as paintable,
     * so a mounted module takes its measure from the slot itself rather than from
     * a wrapper container that exists only to carry the number.
     */
    ...nodeAxisGroupsShape,
  })
  .strict()

// The box and container leaves are recursive (they nest children). Zod cannot
// self-infer a recursive schema, so the tree type is written by hand and the
// schemas are annotated `z.ZodType<…>` + wrapped in `z.lazy` (the leaf axes are
// still Zod-inferred; only the recursion is manual).

/** A painted box that may nest children. */
export interface L1BoxNode extends L1NodeAxisGroups {
  kind: 'box'
  id?: string
  axes?: z.infer<typeof l1SurfaceAxesSchema>
  /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
  link?: L1Link
  children?: L1NodeUnion[]
}

/** A painted layout container: stack / row / grid over its children. */
export interface L1ContainerNode extends L1NodeAxisGroups {
  kind: 'container'
  id?: string
  layout: z.infer<typeof l1LayoutModeSchema>
  /**
   * REQ-104 — the per-width layout track. When present it OWNS the mode at render
   * time (base rule = first keyframe, media overrides above), and `layout` above
   * stays the representative widest value.
   */
  responsiveLayout?: z.infer<typeof l1ResponsiveLayoutSchema>
  /**
   * REQ-104 — `flex-wrap: wrap` for a row: children that no longer fit start a new
   * line instead of squeezing. Combined with each child's `sizing.width.minPx` this
   * is the "cards reflow when they run out of room" behaviour, with no breakpoint
   * to author. Inert wherever the resolved mode is not `row`.
   */
  wrap?: boolean
  /** REQ-98 — the shared surface group: a container paints AND lays out. */
  axes?: z.infer<typeof l1SurfaceAxesSchema>
  gapPx?: number
  columns?: number
  distribution?: z.infer<typeof l1DistributionSchema>
  align?: z.infer<typeof l1AlignSchema>
  /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
  link?: L1Link
  /**
   * REQ-100 — the interval between successive children's reveals, in ms.
   *
   * Container-level because staggering is a statement about a *set* of peers,
   * which is precisely what a container is and a `box` is not. Only children
   * that carry their own {@link l1RevealSchema} take part, and they take part in
   * document order; a child's own `reveal.delayMs` adds to its stagger share
   * rather than replacing it.
   */
  staggerMs?: number
  children: L1NodeUnion[]
}

/** Any L1 node — the recursive tree element type. */
export type L1NodeUnion =
  | z.infer<typeof l1TextSchema>
  | z.infer<typeof l1ImageSchema>
  | z.infer<typeof l1SlotSchema>
  | z.infer<typeof l1ControlSchema>
  | L1BoxNode
  | L1ContainerNode

export const l1BoxSchema: z.ZodType<L1BoxNode> = z.lazy(() =>
  z
    .object({
      kind: z.literal('box'),
      id: z.string().optional(),
      axes: l1SurfaceAxesSchema.optional(),
      ...nodeAxisGroupsShape,
      /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
      link: l1LinkSchema.optional(),
      children: z.array(l1NodeSchema).optional(),
    })
    .strict(),
)

export const l1ContainerSchema: z.ZodType<L1ContainerNode> = z.lazy(() =>
  z
    .object({
      kind: z.literal('container'),
      id: z.string().optional(),
      layout: l1LayoutModeSchema,
      /** REQ-104 — per-width layout track; the track owns the mode at render time. */
      responsiveLayout: l1ResponsiveLayoutSchema.optional(),
      /** REQ-104 — `flex-wrap: wrap` for a row; inert in any other resolved mode. */
      wrap: z.boolean().optional(),
      /** REQ-98 — the shared surface group: a container paints AND lays out. */
      axes: l1SurfaceAxesSchema.optional(),
      gapPx: finite.nonnegative().optional(),
      columns: z.number().int().positive().optional(),
      distribution: l1DistributionSchema.optional(),
      align: l1AlignSchema.optional(),
      ...nodeAxisGroupsShape,
      /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
      link: l1LinkSchema.optional(),
      /** REQ-100 — interval between successive revealing children, in ms. */
      staggerMs: finite.nonnegative().optional(),
      children: z.array(l1NodeSchema),
    })
    .strict(),
)

export const l1NodeSchema: z.ZodType<L1NodeUnion> = z.lazy(() =>
  z.union([l1TextSchema, l1ImageSchema, l1SlotSchema, l1ControlSchema, l1BoxSchema, l1ContainerSchema]),
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
 * background and inherited text colour, an optional resource table
 * (handle→substance), and the root node.
 */
export const l1DocumentSchema = z
  .object({
    widths: z.array(finite.positive()).min(1),
    background: l1Color.optional(),
    /**
     * REQ-114 — the page's inherited text colour. Every text leaf paints its own
     * colour, so this is the floor a leaf that declares none falls back to. It
     * lives here, beside `background`, because a page-level colour is a property
     * of the document (DOC-23 §2) — the theme token that used to carry it
     * (`--color-text`) went with the legacy palette.
     */
    textColor: l1Color.optional(),
    resources: l1ResourcesSchema.optional(),
    /** REQ-88 — the shared centred content column `geometry.anchor` refers to. */
    column: l1ColumnSchema.optional(),
    root: l1NodeSchema,
  })
  .strict()
