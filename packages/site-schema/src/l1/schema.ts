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
import { l1ColorSchema, l1PaletteNameSchema } from './palette'

/**
 * A painted colour — a hex literal or a palette reference (REQ-114 / DOC-23 §5).
 * Never a `url()`, an `rgb(var(--…))` or a keyword. One alias, used at every
 * colour axis, so the literal-base/palette-overlay model reaches all of them.
 */
const l1Color = l1ColorSchema

/** Finite number guard — rejects NaN / ±Infinity that `z.number()` alone admits. */
const finite = z.number().refine((n) => Number.isFinite(n), 'must be a finite number')

// ── Geometry: per-viewport keyframes + per-segment interpolate|snap ───────────

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
 * One geometry keyframe: absolute band-coordinate placement at a captured
 * viewport width. `height` is optional — a text leaf's height is natural (from
 * flow), so its keyframes pin only `x`/`y`/`width` and leave height to the glyph
 * box. A box/image leaf gives all four.
 *
 * REQ-351 (issue 4) — the height response lives HERE, on the keyframe, beside the
 * `atHeight` it is measured from. It used to hang off the geometry as one scalar
 * pair for the whole node, which made a measurement taken at ONE width an
 * assertion about EVERY width.
 *
 * That is not a conservative approximation; it is a claim the capture never made,
 * and on a page whose height rule sits inside a media query it is simply false.
 * joyfulculinarycreations.com's hero is `height: 100vh` at 1024 and above and a
 * content height below (305.5px at 768, measured at three widths). One
 * `{heightFactor: 1}` for the node emitted
 * `height: calc(305.5px + (100vh - 1024px))` at 768 — **49.5px** at a 768-tall
 * viewport, a band shorter than one line of the copy standing on it, and 36 of
 * that round's 259 `escape` findings. No perceptual average can see it: the page
 * is exact at the captured viewport heights and comes apart at every other one.
 *
 * Per keyframe, the two halves of the statement sit together and neither can be
 * applied without the other:
 *
 *   y      = keyframe.y      + keyframe.viewportResponse.yFactor      * (100vh - keyframe.atHeight)
 *   height = keyframe.height + keyframe.viewportResponse.heightFactor * (100vh - keyframe.atHeight)
 *
 * and a keyframe at a width no height probe measured carries no response at all —
 * it stays pinned at what the capture saw, which is wrong only off the captured
 * heights and is never absurd. There is deliberately no node-level default to
 * inherit from: two ways to say the same thing is two things to keep in agreement,
 * and the one that held a single rule for a whole ladder is the defect.
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
    /** REQ-88 / REQ-351 — how `y` / `height` track the viewport height AT THIS WIDTH. */
    viewportResponse: l1ViewportResponseSchema.optional(),
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
 * REQ-278 — which frame a geometry track's keyframes are measured against.
 *
 * `absolute` (the default, and what every document written before this axis
 * existed means): the node is taken OUT of its parent's flow and placed by its
 * own coordinates — `x`/`y` are `left`/`top` against the nearest positioned
 * ancestor, `width`/`height` its extent. This is the transcription face: it
 * reproduces a capture exactly and is fragile by construction, because a run
 * that wraps one line more than the capture did lands on its neighbour.
 *
 * `flow` keeps the node IN its parent's flow and reads the same four numbers as
 * **leading offsets from the flow cursor** — `x`/`y` are `margin-left`/
 * `margin-top`, `width` is still the node's width, and `height` is emitted only
 * where the keyframe carries one (a leaf image or box); a node whose height is
 * its content's takes it from the content, which is the entire point. The CSS
 * distinction is exactly the one the two names carry: `left`/`top` place a box
 * that has left the flow, margins place one that has not.
 *
 * Both modes reproduce the capture at the sampled widths — a leading offset
 * measured from the previous sibling's captured bottom puts the node exactly
 * where it was captured. They differ in what happens when the content is NOT the
 * captured content: an `absolute` sibling stays put and is overrun, a `flow`
 * sibling is pushed down. So `flow` is what {@link module:probes.promoteToFlow}
 * writes when it recovers a colliding region, and it is what lets that recovery
 * keep the horizontal geometry — the width and the position within the row —
 * that made the region a grid rather than a pile of full-bleed stacked rows.
 */
export const l1PlacementSchema = z.enum(['absolute', 'flow'])

/**
 * A geometry track: keyframes sorted ascending by `at`, plus an optional
 * per-segment interpolation flag (length `keyframes.length - 1`). Absent segment
 * flags default to `interpolate` for every segment.
 */
export const l1GeometrySchema = z
  .object({
    keyframes: z.array(l1KeyframeSchema).min(1),
    segments: z.array(l1SegmentSchema).optional(),
    /**
     * REQ-278 — the frame the keyframes are measured against. Absent means
     * `absolute`, so every document folded before this axis existed is unchanged.
     */
    place: l1PlacementSchema.optional(),
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

/**
 * Per-axis sizing intent: a fixed px, fluid (fill), or hug (fit-content).
 *
 * BUG-133 — **`fluid` means fill, and what "fill" compiles to depends on which
 * axis the PARENT made this one.** A width fills the same way everywhere: a
 * block's containing width is definite, so it is a percentage of it. A height
 * does not, because a flex row's height is indefinite until its own content has
 * been laid out:
 *
 * - under a `row` or a `grid`, height is the parent's cross/block axis, and a
 *   fluid height stretches the node to the row's (or track's) resolved height —
 *   which is what makes an `image` fill the depth of the column beside it, with
 *   `axes.objectFit` governing the crop;
 * - under a `stack`, height is the parent's main axis, and a fluid height is a
 *   share of a parent that declares one.
 *
 * Stated here because it is not inferable from the field: an author reading
 * `{ mode: "fluid" }` alone cannot tell which of the two they wrote, and the
 * renderer settles it without asking.
 */
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

/**
 * REQ-331 — the shadow a node casts: ONE layer, or the ordered stack of several.
 *
 * A reference routinely paints two: a dark drop that lifts the card off the page
 * and a pale outer glow that separates it from what is behind it. Measured on
 * faelan.com, three photographs each carried
 * `rgba(0,0,0,0.6) 0 15px 50px, rgba(255,255,255,0.15) 0 0 30px` — and the fold
 * could only take the first layer, because there was nowhere to put the second.
 * That is not a fold shortfall; it is the axis being narrower than the medium it
 * describes, so the axis is what widens.
 *
 * **Two-or-more is the array; one is the object** — the same rule
 * {@link l1TextContentSchema} states for copy, for the same reason: a
 * one-element array would be a second spelling of a single shadow, and two
 * spellings of one thing is the drift this schema refuses everywhere. The order
 * is CSS's own, which is paint order — the first layer paints on top.
 *
 * The cap is small deliberately. Two or three layers is a design; ten is a
 * compositing cost the page pays on every frame, and no reference this engine
 * reproduces has ever painted more than three.
 */
export const l1BoxShadowSchema = z.union([l1ShadowSchema, z.array(l1ShadowSchema).min(2).max(4)])

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
     * REQ-333 — `featherRadial` only: the ending ellipse's radii, as a percentage
     * of the box's OWN width and height (CSS `radial-gradient(ellipse P% P% …)`
     * units, where `50` is exactly `closest-side`). Absent keeps the historical
     * `closest-side` emission, so every existing document means what it always did.
     *
     * This axis exists because the common "soft-edged photograph" idiom
     * (`radial-gradient(ellipse 92% 92% at 50% 50%, black 72%, transparent 100%)`)
     * puts its ending shape OUTSIDE the box — which is precisely how the idiom gets
     * a *subtle* edge, a whisper at the corners rather than a vignette over half the
     * frame. With one parameter measured from the closest side, the substrate could
     * not write that down at all: faelan.com's three collage photographs folded to a
     * feather that erased 21.5% of each of them, and the only alternative under the
     * old axis was to carry no mask at all.
     */
    extentPct: finite.min(1).max(400).optional(),
    /**
     * REQ-333 — `featherRadial` only: where the opaque core ends, as a percentage of
     * the ending shape ({@link extentPct}). This is the gradient's own last
     * fully-opaque colour stop. Absent derives the stop from {@link featherPx}
     * exactly as before.
     */
    opaqueStopPct: finite.min(0).max(100).optional(),
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
export const l1FilterFunctionSchema = z.enum([
  'grayscale',
  'sepia',
  'invert',
  'saturate',
  'brightness',
  'contrast',
  'hueRotateDeg',
  'blurPx',
])

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
    /**
     * REQ-332 — **the sequence the functions compose in.**
     *
     * CSS `filter` is an ORDERED LIST and its functions do not commute:
     * `contrast` is affine and `saturate` is a matrix on RGB, so lifting before
     * saturating and saturating before lifting are different images. The axis was
     * eight optional scalars on an object, and a JSON object has no order that
     * survives a file being rewritten or a diff being applied — so the emitter
     * fixed one canonical order of its own and the captured order was simply
     * lost. Measured on joyfulculinarycreations.com, whose hero scrim is captured
     * as `brightness(0.67) contrast(0.88) saturate(1.06)` and served as
     * `saturate(1.06) brightness(0.67) contrast(0.88)`.
     *
     * WHY A SEQUENCE BESIDE THE VALUES AND NOT A LIST OF `{fn, value}` PAIRS. The
     * values are already a closed, typed, per-function envelope, and the editor's
     * percentage controls (`edit.ts`'s `FILTER_CONTROLS`) are a projection over
     * exactly those named axes — a list of pairs would move every one of them
     * behind a search, and would newly admit the same function twice, which is
     * a filter no capture produces and no control can express. Order is a
     * SEPARATE FACT about the same eight values, so it is a separate field; the
     * values stay where every reader already looks for them.
     *
     * ABSENT MEANS "the document has not chosen", and the renderer's own fixed
     * order applies — which is what every document written before this axis
     * existed means, so none of them change. A function present in `order` but
     * carrying no value is skipped (it paints nothing); a function carrying a
     * value that `order` omits is emitted after the named ones, in the renderer's
     * fixed order, so a partial declaration can never silently drop paint.
     */
    order: z.array(l1FilterFunctionSchema).optional(),
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

/**
 * A node-level 2D transform — a static paint offset, rotation (deg) and uniform
 * scale. Applied at paint time: **layout is unaffected**, exactly as CSS
 * `transform` is, so a translated node still occupies the box the flow gave it
 * and everything after it stays where it was.
 *
 * REQ-288 — `translateXPct` / `translateYPct` are a share of the node's **own
 * rendered box** (X of its width, Y of its height), which is the CSS
 * `translate()` percentage basis. Percent-of-self is the point of the axis, not
 * a convenience: a pixel offset is a different number at every width whenever the
 * node's size is responsive, so it needs a per-width keyframe track and drifts
 * between the stored widths. "Half my own height" is ONE value that resolves
 * correctly at every width, with no keyframes and nothing to drift.
 *
 * The case it was added for: a caption plaque that hangs half off the bottom edge
 * of the picture it labels, sitting inside a reading column that *wraps* at narrow
 * widths — the column's width jumps rather than sliding, so pinned `geometry`
 * keyframes cannot track it, and before this axis the only way to overlap two
 * elements at all was to pin both their coordinates.
 *
 * `translateXPx` / `translateYPx` are the same offset in absolute units, for the
 * nudge that is a fixed distance rather than a share of anything (a 2px optical
 * correction). Both may be given on one axis; they compose (`calc()`).
 *
 * TWO CONSEQUENCES THIS AXIS SETTLES, both of which fall out of the renderer
 * emitting no `z-index` and no `overflow` anywhere:
 *   - **Paint order** is document order — a later sibling paints over an earlier
 *     one. A translated node additionally carries a CSS transform, which promotes
 *     it into the positioned paint layer, so the node that moved is the node on
 *     top of whatever it moved over. That is the right default for the only
 *     reason to translate a node onto its neighbour in the first place. (A PINNED
 *     node is the one place the default is not enough, because what passes it is
 *     not a node it moved onto: see {@link l1StickySchema}'s `lift`.)
 *   - **Nothing clips it.** L1 emits no `overflow`, so a node translated past its
 *     parent's edge paints in full rather than being cut off at the boundary.
 *     (An explicit `mask` still clips — that is what it is for.)
 *
 * An overlap the translate produces is still reported by the geometry envelope
 * unless the node declares `stacked: true`: the measurement cannot tell a
 * deliberate stack from two runs painted over each other, so the intent is
 * declared rather than inferred (see {@link l1NodeAxisGroupsSchema}'s `stacked`).
 */
export const l1TransformSchema = z
  .object({
    /** REQ-288 — static X offset as a share of the node's own width (CSS `translate` semantics). */
    translateXPct: finite.optional(),
    /** REQ-288 — static Y offset as a share of the node's own height. */
    translateYPct: finite.optional(),
    /** REQ-288 — static X offset in absolute px; composes with `translateXPct`. */
    translateXPx: finite.optional(),
    /** REQ-288 — static Y offset in absolute px; composes with `translateYPct`. */
    translateYPx: finite.optional(),
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

/**
 * A full-bleed translucent scrim painted over a box's background (hero overlay).
 *
 * REQ-338 (issue 5) — `blendMode` is how the scrim composites with the image
 * under it, which a plain alpha cannot express. A page-builder band routinely
 * veils its photograph with `mix-blend-mode: darken` (joyfulculinarycreations.com
 * paints `#141e14` at an effective 0.67 that way), and a scrim recorded without
 * it reproduces as a flat tint: alpha-only compositing lifted the band's darkest
 * pixels by ~55/255 over 13.96% of that page's diff mass. The renderer emits it
 * as `background-blend-mode` on the scrim's own layer, so the blend is confined
 * to the box's own background stack and never reaches the page behind it.
 */
export const l1OverlaySchema = z
  .object({
    color: l1Color,
    opacity: finite.min(0).max(1).optional(),
    blendMode: l1BlendModeSchema.optional(),
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
  /** A drop shadow cast by the node — one layer, or REQ-331's ordered stack. */
  boxShadow: l1BoxShadowSchema.optional(),
  /**
   * A painted border on all four sides. A per-side axis below overrides its own
   * side and leaves the other three as this one paints them.
   */
  border: l1BorderSchema.optional(),
  /**
   * BUG-14 — a coloured left-accent border (a card's orange/blue rule, a pull
   * quote's rule), distinct from the uniform {@link border}: a card frequently
   * carries only a thick `border-left` as its accent, and drawing that as a full
   * box outline is the wrong look. A typed left-border primitive (never raw CSS)
   * keeps the accent faithful while the substrate stays safe by construction.
   *
   * REQ-374 — one of four. Alone it paints the left side only; beside `border`
   * it restyles the left side and the other three keep `border`.
   */
  borderLeft: l1BorderSchema.optional(),
  /**
   * REQ-374 — the top side only: a divider above a footer or trust strip, a
   * tab's indicator. Same shape and override rule as {@link borderLeft}.
   */
  borderTop: l1BorderSchema.optional(),
  /** REQ-374 — the right side only; same shape and override rule as {@link borderLeft}. */
  borderRight: l1BorderSchema.optional(),
  /**
   * REQ-374 — the bottom side only: a rule under a heading or band, an
   * underline-style tab. Same shape and override rule as {@link borderLeft}.
   */
  borderBottom: l1BorderSchema.optional(),
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
 * REQ-365 — the PLACEMENT of an underline: `text-underline-offset`, in px.
 *
 * `textDecoration` says which line is painted and nothing about where. Left
 * unset, every engine places an underline at its own `auto` offset, which for a
 * 24px face sits about 2px higher than a page that declared `4px` — the same
 * ink, painted in a different place, and the only pixel disagreement left on a
 * page whose every value otherwise agreed. Pixels rather than `em` because that
 * is how the web writes it and how the capture reads it (a computed length): an
 * `em` here would re-scale a line the reference held fixed on every width a
 * node's `responsive.fontSizePx` track covers. Bounded by the envelope.
 *
 * Absent is the engine's `auto`. The axis means nothing without a line to place,
 * and the renderer only ever emits it beside one.
 */
const l1UnderlineOffsetPx = finite

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
  /** REQ-365 — where the state's underline sits; see {@link l1UnderlineOffsetPx}. */
  underlineOffsetPx: l1UnderlineOffsetPx.optional(),
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
     * Cleared by `isSafeHref` — the `isSafeUrl` allowlist that guards
     * `image.src` and `backgroundImageUrl`, plus `tel:` and `mailto:` (REQ-359) —
     * so `javascript:` is rejected with no new security surface. An unsafe href degrades to the un-linked element — never a live
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

/**
 * REQ-269 — the **heading role**: this run is a heading, at this level.
 *
 * L1 had no way to say it, and `.strict()` meant a document that invented one was
 * rejected rather than ignored — so every reproduced page came out with no
 * document outline at all. Measured on gigabytealchemy.ai: 11 runs read
 * `a11yRole: heading` on the reference side and `generic` on the reproduction's,
 * against 1 `<h1>`, 5 `<h2>` and 6 `<h3>` in the source and **zero** heading tags
 * in the render.
 *
 * DOC-24's test — *an axis belongs in L1 iff it moves a pixel* — does not admit
 * this on its own, and that is deliberate: all 11 reproduce with the right family,
 * size, weight and colour. Two things admit it anyway. DOC-23 §7's acceptance is
 * `capture(render(L1)) ≈ L1` **measured on the capture/values-diff spine**, and
 * `a11yRole` is on that spine, so projecting `heading` to `generic` is a
 * round-trip failure on a field the capture records. And the consequence is not
 * cosmetic: a marketing page with no heading structure is what a search engine
 * reads and what a screen reader navigates by.
 *
 * Shaped like {@link l1LinkSchema} and {@link l1ActionSchema}, and for the same
 * reason: it is a ROLE the node takes, not a kind of node and not a paint axis.
 * The renderer is the sole `<h1>`…`<h6>` sink, exactly as it is the sole `<a>`
 * sink. `control` deliberately cannot carry it (a heading around a form control is
 * malformed), which `.strict()` enforces by shape rather than by a remembered rule.
 */
export const l1HeadingSchema = z
  .object({
    /**
     * The outline depth, 1…6. Bounded by the envelope validator rather than here,
     * on the same terms as `link.href`'s allowlist: the shape says what the field
     * IS, the envelope says what a document may contain.
     */
    level: z.number(),
  })
  .strict()

/** REQ-269 — the heading role a text run may take. */
export type L1Heading = z.infer<typeof l1HeadingSchema>

// ── Modals (REQ-212) ──────────────────────────────────────────────────────────
//
// L1 could not express a modal at all, and the substrate said so out loud:
// `account-chrome`'s stylesheet ships `position: fixed; inset: 0` with the note
// "no L1 axis can express `position: fixed`", alongside a 50%-black scrim no
// site can vary. DOC-25 §10.2 says a conforming behaviour ships zero CSS beyond
// its declared invariants, so that block is an admission of a substrate gap
// rather than a principled carve-out — and it left "put this behind a modal"
// reachable only by writing a new behaviour module for each flow.
//
// A modal is TWO things, and they are separate because they sit on different
// nodes: a subtree that presents as an overlay, and something elsewhere on the
// page that opens it. Neither is a *kind* of thing — both are roles a subtree
// takes — so they are node-level fields exactly like {@link l1LinkSchema} and
// {@link l1RevealSchema}, not a seventh and eighth node kind.
//
// This is REQ-100's argument, applied again. Motion became an L1 *adjective*
// rather than a module partly because a module would make animated content
// unfoldable by construction — `fold` maps captured node axes onto L1 node axes
// and never authors a module. A captured reference site with a modal has
// precisely that problem.
//
// The obligations ride in on REQ-106's rail: L1 already carries what is not
// negotiable, because the renderer is the sole sink. `newTab` cannot be asked
// for without its `rel`; an `href` clears `isSafeHref`. In the same way a
// document here names WHICH panel and WHAT it looks like, and the renderer owns
// the dialog role, the focus trap, the Escape key, the scroll lock and the
// return of focus — none of which any document can name, vary or defeat.

/**
 * REQ-212 — the **overlay role**: this subtree presents above the page rather
 * than in its flow.
 *
 * It carries only what a reference can legitimately vary. The panel's fill,
 * rounding, border, shadow, padding and measure are its ordinary surface and
 * sizing axes — the role adds no way to paint, because a modal panel is a box
 * and L1 already knows how to paint one.
 *
 * A node carrying this MUST declare an `id` ({@link L1_STRUCTURAL_RULES}): the
 * id is what an {@link l1ActionSchema} names, and a panel nothing can open is a
 * panel nobody sees.
 *
 * The two dismissals default to ON. A modal that cannot be escaped and cannot be
 * clicked away is a trap, so an author has to say so deliberately rather than by
 * omission — the same direction `newTab`'s `rel` pairing takes.
 */
export const l1DialogSchema = z
  .object({
    /**
     * The scrim painted over the page behind the panel. Absent → no scrim, and
     * the page behind stays fully visible. Reuses the hero overlay's shape
     * because it is the same statement: a colour, at an opacity, over what is
     * already there.
     */
    backdrop: l1OverlaySchema.optional(),
    /** Where the panel sits in the covered viewport. Absent → `center`. */
    placement: z.enum(['center', 'top', 'bottom']).optional(),
    /** Whether Escape closes it. Absent → true. */
    dismissOnEscape: z.boolean().optional(),
    /**
     * Whether a click on the scrim closes it. Absent → true. A click *inside*
     * the panel never closes it, which is not a dial: a panel that dismissed
     * itself when its own field was clicked would be unusable.
     */
    dismissOnBackdrop: z.boolean().optional(),
    /** An accessible name, for when the panel's visible content is not one. */
    ariaLabel: z.string().optional(),
  })
  .strict()

/** REQ-212 — the overlay role a subtree may take. */
export type L1Dialog = z.infer<typeof l1DialogSchema>

/**
 * REQ-212 — the **disclosure verb**: what activating this node does to a panel
 * elsewhere on the page.
 *
 * A CLOSED SET OF TWO, deliberately, and not an event system. Every general
 * "on click, do X" vocabulary ends as a scripting language with a schema in
 * front of it, at which point the substrate no longer bounds what a document can
 * make a page do. Two verbs bound it absolutely: a document can change which of
 * its own declared panels is open, and there is no third thing it can say.
 *
 * Exactly one verb per node. A node naming both is a toggle nobody asked for and
 * a contradiction the shape should refuse; a node naming neither is inert markup
 * wearing a control's semantics. Both are rejected by {@link L1_STRUCTURAL_RULES}
 * rather than by the object shape, because a union of two single-key objects
 * reports as "invalid input" at the node and names neither field.
 *
 * Mutually exclusive with {@link l1LinkSchema} on one node — a node either
 * navigates somewhere or acts on this page, and both at once is a control whose
 * behaviour depends on which handler wins. Enforced structurally: the four kinds
 * that can carry either declare them in one `.strict()` shape, and the rule
 * below refuses the pair.
 */
export const l1ActionSchema = z
  .object({
    /** The `id` of a node carrying {@link l1DialogSchema}, which this opens. */
    opens: z.string().min(1).optional(),
    /** The `id` of a node carrying {@link l1DialogSchema}, which this closes. */
    closes: z.string().min(1).optional(),
  })
  .strict()

/** REQ-212 — the disclosure verb a node may take. */
export type L1Action = z.infer<typeof l1ActionSchema>

// ── Zoomable pictures (REQ-327) ───────────────────────────────────────────────
//
// A picture could be linked and nothing else. There was no way to say "let a
// visitor look at this closely", and the substitute — a link to a page holding
// the same picture — navigates away, loses the scroll position, and turns looking
// closely into leaving. On a page whose argument is carried by detailed plates,
// whose fine lettering is unreadable at the placed width, that is not a missing
// nicety: it is the most memorable thing on the page being unavailable.
//
// THE OVERLAY IS ALREADY HERE. Every obligation a zoom carries — dismiss on
// Escape, dismiss on a click away, focus into the overlay and back to the
// trigger, no scrolling behind — is one {@link l1DialogSchema} already owns and
// the renderer's one vetted script already performs. So this role adds NO second
// overlay implementation: it is the pair a document would otherwise have to
// author by hand (a trigger, and a panel holding the large picture), synthesized
// by the renderer from one field on the picture itself.
//
// WHY A FIELD RATHER THAN A DOCUMENT'S OWN DIALOG. Authoring it by hand costs a
// duplicate `image` node, an `id`, an `action`, a wrapping panel and a scrim —
// five things to get right for the commonest case there is. And the `action` half
// is not even reachable: `image` is the one kind that cannot carry it, because a
// void element cannot be a button. One field is impossible to get wrong.
//
// A ROLE, NOT A KIND, and not a paint axis — shaped exactly like {@link
// l1LinkSchema} and {@link l1HeadingSchema}, and for the same reason: it is
// something a picture IS, and the renderer is the sole sink for everything it
// compiles to.

/**
 * REQ-327 — the **magnify role**: this picture can be opened large.
 *
 * Every field is optional, and `zoom: {}` is the whole of the common case. Each
 * one exists for something the empty form cannot state, and none of them is a way
 * to paint: the overlay's presentation is the renderer's, because it is a
 * statement about the page AROUND the picture, which no axis on the picture can
 * make (the argument {@link l1DialogSchema} makes for the shell it wraps a panel
 * in).
 *
 * Carried by `image` and by nothing else. A box has no replaced content to open,
 * so the field would be inert everywhere else it was accepted — and because every
 * node object is `.strict()`, that exclusion is enforced by the shape rather than
 * by a rule someone has to remember. Mutually exclusive with {@link l1LinkSchema}
 * on one node, on precisely the terms {@link l1ActionSchema} is: one element
 * cannot both navigate away and act on this page, and which won would be a
 * property of the renderer rather than of the document.
 */
export const l1ZoomSchema = z
  .object({
    /**
     * A higher-resolution original to show large, when the placed asset is not
     * the best copy the site holds. Absent → the picture's own `src`.
     *
     * Cleared by the same `isSafeUrl` allowlist as `image.src`, and held to the
     * same "an asset reference must name an asset the site holds" rule: a zoom
     * that opens onto a broken image is worse than no zoom, because the visitor
     * has already committed a click to it.
     */
    src: z.string().optional(),
    /**
     * What the LARGE picture shows, when it is not what the placed one shows — a
     * plate whose detail is the whole point of opening it. Absent → the node's own
     * `alt`, which is the right answer whenever the two are the same picture.
     */
    alt: z.string().optional(),
    /**
     * The scrim the page behind is dimmed with. Reuses the hero overlay's shape
     * because it is the same statement: a colour, at an opacity, over what is
     * already there.
     *
     * ABSENT MEANS THE RENDERER'S DIM, which is the one place this role's defaults
     * differ from a dialog's. A modal with no scrim is a legitimate design — a
     * toast, a corner panel — so there the absence can mean "none". A picture
     * opened large onto an undimmed page is not a design, it is the feature
     * failing to happen, so the absence cannot mean the same thing here.
     */
    backdrop: l1OverlaySchema.optional(),
    /**
     * An accessible name for the overlay. Absent → the picture's alt text, which
     * is what the overlay is showing and therefore already the right name.
     */
    ariaLabel: z.string().optional(),
    /**
     * REQ-330 — the **set** this picture belongs to. Every picture on the page
     * naming the same group forms one gallery, **in document order**, sharing ONE
     * overlay that shows a member at a time and steps between them. Absent → the
     * picture opens alone, which is what every document written before this did.
     *
     * A NAME RATHER THAN A LIST, because the members are scattered through the
     * tree and a list would have to name them — which means ids on pictures that
     * need none, kept in step with a list held somewhere else. A name is the one
     * form of the statement that cannot fall out of agreement with itself.
     *
     * NOT A GALLERY COMPONENT. A set is not a new kind of behaviour; it is the
     * overlay that already exists, holding more than one picture. Expressed here,
     * it reuses REQ-212's dismissal, focus and scroll-lock contract whole; as a
     * behavior module it would have to restate that contract inside something
     * that is not allowed to own it (DOC-25 §10).
     */
    group: z.string().min(1).optional(),
    /**
     * REQ-330 — what to say about the LARGE picture, shown beside it in the
     * overlay. In a set it travels with its own member as the visitor steps, which
     * is the half of "a gallery" that is not navigation.
     *
     * Not the placed picture's caption: text beside the picture on the page is an
     * ordinary text node and always was. This is text that exists only while the
     * picture is open, which no node in flow can express.
     */
    caption: z.string().optional(),
    /**
     * REQ-330 — the colour the overlay's own chrome is painted in: the caption and
     * the two stepping controls. Absent → white, which is what pairs with the
     * renderer's near-opaque dark backdrop.
     *
     * The same KIND of statement {@link l1OverlaySchema} makes above and for the
     * same reason: it is about the page around the picture, which no axis on the
     * picture can reach. `backdrop` made the ground authorable and left everything
     * drawn on it fixed — a site that chose a pale ground got chrome it could not
     * see.
     */
    ink: l1Color.optional(),
    /**
     * REQ-330 — the accessible names of the two stepping controls. Absent →
     * `Previous image` / `Next image`.
     *
     * A control drawn as a chevron has no visible text to be named by, so the name
     * has to come from somewhere; and a site published in another language cannot
     * be left with two English buttons it has no way to restate.
     */
    prevLabel: z.string().optional(),
    /** REQ-330 — see {@link l1ZoomSchema}'s `prevLabel`. Absent → `Next image`. */
    nextLabel: z.string().optional(),
  })
  .strict()

/** REQ-327 — the magnify role a picture may take. */
export type L1Zoom = z.infer<typeof l1ZoomSchema>

/**
 * REQ-330 — the fields of {@link l1ZoomSchema} that describe the OVERLAY rather
 * than the picture, and therefore belong to a set rather than to any one member.
 *
 * Stated once, here, because two readers need the same list and would otherwise
 * each hold their own: the validator, which refuses a set whose members name one
 * of them differently, and the renderer, which reads them off whichever member
 * named them when it builds the set's single shell.
 */
export const L1_ZOOM_OVERLAY_FIELDS = [
  'backdrop',
  'ariaLabel',
  'ink',
  'prevLabel',
  'nextLabel',
] as const

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
    /**
     * Opacity the node fades *from*. Absent → 0 — but the default belongs to the
     * ENTRANCE rather than to each behaviour (REQ-326): where two or more
     * behaviours compose and none names this, the first one fades from 0 and the
     * rest animate only what they do name. Applying it per behaviour would put
     * every composed entrance in breach of the one-property-per-behaviour rule
     * and leave the list form able to express nothing.
     */
    fromOpacity: finite.min(0).max(1).optional(),
    durationMs: finite.nonnegative().optional(),
    delayMs: finite.nonnegative().optional(),
    easing: l1EasingSchema.optional(),
  })
  .strict()

/**
 * REQ-326 — a node's entrance: ONE behaviour, or two-or-more composed.
 *
 * One behaviour carries one `durationMs` / `delayMs` / `easing`, so a node that
 * wanted to fade quickly and rise slowly could not say so — it had to pick one
 * timing for both properties, and naming a second behaviour replaced the first
 * rather than joining it. A list gives each behaviour its own timing, and the
 * renderer emits one transition per property so they genuinely compose.
 *
 * TWO BEHAVIOURS MUST ANIMATE DIFFERENT PROPERTIES, and a pair that does not is
 * refused by {@link L1_STRUCTURAL_RULES} rather than silently resolved to
 * last-one-wins: the dropped half moves no pixel and says nothing about why, so
 * an author meets it as a design that did not arrive instead of as a refusal
 * naming the contest. Composition order is the authored order, which is what the
 * renderer emits in.
 *
 * **A one-element array is not a legal spelling of a single behaviour**, for the
 * reason {@link l1TextContentSchema} gives for its own `min(2)`: two ways to
 * write the same thing is the drift this schema refuses everywhere else, and the
 * fold, the renderer and the editor would each need a rule about which one they
 * emit. `min(2)` makes the canonical form structural rather than a convention
 * someone has to remember. A single object is otherwise unchanged, so every
 * existing document stays valid and renders identically.
 */
export const l1EntranceSchema = z.union([l1RevealSchema, z.array(l1RevealSchema).min(2)])

// ── Scroll POSITION (REQ-325) ─────────────────────────────────────────────────
//
// REQ-100 gave L1 entrance motion: a node crosses the fold once, settles, and is
// done. That is a *trigger*, and an editorial page wants a *driver* — the state
// of an element as a continuous function of how far the reader has descended. The
// two axes below are the two halves of that, and they are separable because they
// answer different questions: `sticky` is where a box IS, `scrollTrack` is what a
// box LOOKS LIKE on the way past.
//
// Neither ships a script. A pin is CSS positioning, and a scroll-linked property
// is a CSS animation on the browser's own view-progress timeline — so the
// renderer stays the sole emitter without a scroll listener existing anywhere in
// the substrate to vet, to budget, or to keep from janking.

/**
 * **Hold this node against the viewport while its container scrolls past.**
 *
 * The composition this exists for: a full-bleed hero locks at the top of the
 * viewport, the masthead above it scrolls up and disappears behind it, and the
 * hero releases once the section it sits in has gone by.
 *
 * The release boundary is CSS sticky's own — the node holds until its
 * **containing block** (its parent's box) has scrolled past — so it is not a
 * field here. That means a pin only does something where the parent is TALLER
 * than the pinned node: a container that hugs its child has no range to hold it
 * through, and the pin is inert rather than wrong.
 *
 * NOT COMPATIBLE WITH AN ABSOLUTE {@link l1GeometrySchema} TRACK, and refused by
 * {@link L1_STRUCTURAL_RULES} rather than silently resolved: `position: sticky`
 * and `position: absolute` are alternatives, and an absolute track already writes
 * the `top` a pin needs to own. An in-flow track (`place: 'flow'`) composes
 * freely — its offsets are margins.
 *
 * WHETHER CONTENT PASSES BEHIND OR IN FRONT is the pin's other half, and it is
 * `lift`'s — see that field, or {@link nodeAxisGroupsShape}'s `stacked`, which
 * BUG-154 accepts as the same declaration on a pinned node. CSS positioning alone
 * does not answer it, and the answer it falls back to depends on the element kind
 * of whatever is travelling past, which is not a decision the document made.
 */
export const l1StickySchema = z
  .object({
    /** The offset from the viewport top the node holds at, in px — absent means 0. */
    topPx: finite.optional(),
    /**
     * The viewport width at and above which the node pins; below it, it scrolls
     * normally. Absent → it pins at every width.
     *
     * A pin is a desktop affordance: a full-bleed hero pinned on a 320px screen
     * holds the entire viewport for the length of its section. Without this the
     * only way to pin wide and not narrow would be to author the subtree twice
     * under paired {@link l1VisibilitySchema} gates — the duplicate-subtree
     * anti-pattern {@link l1ResponsiveLayoutSchema} exists to remove.
     *
     * A breakpoint, not a sample: like `visibility.fromPx`, it is an authored
     * decision and need not be one of the document's captured `widths`.
     */
    fromPx: finite.nonnegative().optional(),
    /**
     * REQ-328 — **the pinned node paints above every sibling in its container**,
     * so content travelling past it passes BEHIND it rather than over the top.
     *
     * This is the half of the pin the composition needs and CSS positioning does
     * not supply. A pin's whole purpose is that the page moves past a node that
     * does not, which makes "in front or behind" a decision every pinned
     * composition takes — and without this field it is not a decision the
     * document gets to make. L1 emits no `z-index`, so paint order among
     * siblings falls to the CSS painting algorithm, and that answer depends on
     * the SIBLING'S ELEMENT KIND: an in-flow `box` or `container` takes
     * `position: relative` (it is what makes it the containing block for
     * anything placed inside it) and a `transform` promotes a node into the
     * positioned layer, so either one following a pin covers it; a bare `text`
     * or `image` leaf takes neither and passes behind. Wrapping a masthead in a
     * box to give it a background would silently move it from behind the pinned
     * hero to over the top of it, with nothing in the document saying so.
     *
     * Compiles to `z-index: 1` in the pin's own declaration list, so a
     * {@link l1StickySchema} carrying `fromPx` lifts INSIDE its width band and
     * not below it: where the node is not held, its paint is untouched. The
     * value is 1 because the pin needs to clear its own siblings and nothing
     * else — a dialog's own z-index is vastly larger and still covers it.
     *
     * `true` IS THE ONLY LEGAL VALUE, for the reason {@link nodeAxisGroupsShape}'s
     * `stacked` gives: `false` would be a second spelling of absent, and absent
     * has to keep meaning "the document has not chosen", which for a pin is the
     * document-order paint above. Absence is deliberately NOT made to mean
     * "passes in front": a following section that slides over a held hero is a
     * real editorial composition, and it is exactly what document-order paint
     * already gives.
     *
     * BUG-154 — `stacked: true` ON THE SAME NODE SAYS THIS, and the renderer
     * honours it. The two are one decision reached from two directions: `lift`
     * is the pin naming its paint level, `stacked` is the overlap naming its
     * figure, and on a pinned node those are the same sentence. A node carrying
     * both emits one `z-index`, not two. This field remains the direct spelling
     * and is the one to reach for where the pin is not part of a declared
     * overlap; neither is deprecated in favour of the other.
     */
    lift: z.literal(true).optional(),
  })
  .strict()

/**
 * Which span of the reader's descent a {@link l1ScrollTrackSchema} is measured
 * across — the four CSS named view-progress ranges, as a closed set.
 *
 * - `cover` — from the moment any part of the node enters the viewport to the
 *   moment the last part leaves it. The whole of its visible life, and the
 *   default.
 * - `contain` — the span over which the node is wholly inside the viewport (for a
 *   node taller than the viewport, the span over which it wholly covers it).
 * - `enter` — the arrival only: leading edge appearing to trailing edge in.
 * - `exit` — the departure only: leading edge leaving to trailing edge gone.
 *
 * A closed enum rather than a pair of authored edge conditions, deliberately: the
 * general form is a small coordinate language ("this edge of me against that edge
 * of the viewport"), and these four names are what every composition asking for
 * one actually means.
 */
export const l1ScrollRangeSchema = z.enum(['cover', 'contain', 'enter', 'exit'])

/**
 * One stop of a scroll track: the values the node takes at a given progress.
 *
 * `at` is progress through the track's range, 0..1 — NOT a viewport width. It is
 * the one `at` in L1 that is not a rung of the width ladder, which is why the
 * field is `stops` rather than `keyframes`.
 *
 * The three properties are the three the request named, and they are the three
 * that move a box without touching the flow around it: `opacity`,
 * `translateYPct` (a share of the node's own height — the same semantics
 * {@link l1TransformSchema} already gives that name) and `scale`. A property no
 * stop mentions is simply not animated, so a track can fade without translating.
 */
export const l1ScrollStopSchema = z
  .object({
    /** Progress through the range, 0..1. */
    at: finite.min(0).max(1),
    opacity: finite.min(0).max(1).optional(),
    /** Vertical offset as a share of the node's own height. */
    translateYPct: finite.optional(),
    scale: finite.positive().optional(),
  })
  .strict()

/**
 * **A property track whose driver is scroll position rather than time.**
 *
 * `reveal` fires once and is spent; this is the continuous form — an image that
 * resolves as the reader descends, a masthead that lifts away, a layer that
 * shrinks behind the one over it. The renderer compiles it to a `@keyframes`
 * block it names itself plus an `animation-timeline: view()`, so the driver is the
 * browser's own view-progress timeline and no scroll handler exists.
 *
 * DEGRADES TO THE DESIGN, NEVER TO A BLANK. The animation is emitted behind a
 * feature query AND behind `prefers-reduced-motion`, so a browser without
 * view-progress timelines and a visitor who asked for no motion both get the
 * node's own authored opacity, position and scale — nothing is hidden in CSS
 * waiting for something else to reveal it. The capture driver emulates reduced
 * motion, so the same gate is what keeps the L1 round-trip honest.
 *
 * COMPOSES WITH THE OTHER TRIGGERS, PER PROPERTY (REQ-329). A track may sit on the
 * same node as an entrance, a hover and a focus state: "fade in as I arrive, then
 * drift as the reader descends" is one node with two triggers, and it is the first
 * thing an author asks for once both primitives exist. What it may not do is
 * animate a property another motion on the node also moves — a CSS animation wins
 * its properties outright, so the other half would move no pixel and say nothing
 * about why. {@link L1_STRUCTURAL_RULES}' `animatedPropertyIsExclusive` refuses
 * that pair by name (REQ-325 refused the whole PAIRING, which also refused every
 * composition that had no contest in it).
 */
export const l1ScrollTrackSchema = z
  .object({
    /** The span the stops are measured across — one of `cover` (the default), `contain`, `enter` or `exit`. */
    range: l1ScrollRangeSchema.optional(),
    /** The values across the range — two or more stops, ascending by `at` (one stop is a constant, not a track). */
    stops: z.array(l1ScrollStopSchema).min(2),
  })
  .strict()

/**
 * REQ-329 — a node's scroll motion: ONE track, or two-or-more composed.
 *
 * One track carries one `range`, so a node that wanted to fade on the way IN and
 * scale on the way OUT could not say so — it had to pick one span for both, and
 * naming a second track replaced the first rather than joining it. A list gives
 * each track its own range and its own stops, and the renderer emits one
 * `@keyframes` block and one entry in each `animation-*` list per track, which is
 * how CSS itself composes animations.
 *
 * TWO TRACKS MUST ANIMATE DIFFERENT PROPERTIES, refused by {@link
 * L1_STRUCTURAL_RULES} on exactly the terms {@link l1EntranceSchema} states for
 * two behaviours: where two animations in one list name the same property the last
 * one wins and the earlier one is silently discarded, so an author meets the
 * contest as a refusal naming both rather than as a design that did not arrive.
 *
 * **A one-element array is not a legal spelling of a single track** — see
 * {@link l1EntranceSchema} for why two spellings of one thing is the drift this
 * schema refuses everywhere. A single object is otherwise unchanged, so every
 * existing document stays valid and renders identically.
 */
export const l1ScrollMotionSchema = z.union([
  l1ScrollTrackSchema,
  z.array(l1ScrollTrackSchema).min(2),
])

// ── REQ-335 timed animation: the looping, re-triggerable form ─────────────────
//
// `reveal` fires once and is spent; `scrollTrack` is driven by the reader's
// descent; `interaction` states only name a second resting place. None of them
// can express a SEQUENCE that repeats, and none can address part of a drawing —
// which is the whole of REQ-335's complaint.
//
// This is the third driver and the last one missing: the clock. It is deliberately
// the same SHAPE as a scroll track (ordered stops, one property set, a list form
// that composes) so that the three drivers read as one model rather than three
// dialects, and so the one exclusivity rule in the envelope covers all of them
// instead of gaining a third special case.
//
// WHAT IT IS NOT: a way to name a keyframe, a selector, a script or a timing
// string. A track is a typed value bag exactly like every other pixel-mover here;
// the renderer is the sole thing that knows `@keyframes` exists.

/**
 * What starts a {@link l1AnimateTrackSchema}.
 *
 * - `load` — as soon as the page paints. The default, and the ambient case.
 * - `in-view` — when the node reaches the reader, driven by REQ-100's existing
 *   entrance observer rather than a second one of its own.
 * - `hover` — while the pointer is over the node. Compiles to a `:hover` selector
 *   and needs no script at all.
 *
 * A closed set, for the reason every other L1 enum is closed: a trigger is a
 * mechanism the renderer owns, and an author naming one it did not implement is a
 * document that renders differently from what it says.
 */
export const l1AnimateTriggerSchema = z.enum(['load', 'in-view', 'hover'])

/** How a finite animation repeats. `alternate` is what makes a breath a breath. */
export const l1AnimateDirectionSchema = z.enum([
  'normal',
  'reverse',
  'alternate',
  'alternate-reverse',
])

/**
 * One stop of a timed track: the values the target takes at a point in the cycle.
 *
 * `at` is progress through the CYCLE, 0..1 — the same normalised reading
 * {@link l1ScrollStopSchema} gives it, so one mental model covers both drivers.
 *
 * The property set is {@link l1ScrollStopSchema}'s plus the two axes an
 * illustration needs and a scrolling box does not: a horizontal offset, and a
 * rotation. An arm that lifts rotates; a scroll track that only ever moved a
 * whole plate down the page never needed to. A property no stop mentions is not
 * animated, so a track can rotate without fading.
 */
export const l1AnimateStopSchema = z
  .object({
    /** Progress through the cycle, 0..1. */
    at: finite.min(0).max(1),
    opacity: finite.min(0).max(1).optional(),
    /** Horizontal offset as a share of the target's own width. */
    translateXPct: finite.optional(),
    /** Vertical offset as a share of the target's own height. */
    translateYPct: finite.optional(),
    scale: finite.positive().optional(),
    rotateDeg: finite.optional(),
  })
  .strict()

/**
 * **A property track whose driver is the clock.**
 *
 * The capability REQ-335 asks for in three places at once: motion that loops,
 * motion that expresses a sequence rather than a second state, and motion that can
 * be aimed at PART of a drawing instead of at the whole node.
 *
 * `part` is that last one, and it is the only field here that is not about timing.
 * It names an `id` inside the node's drawing — `left-arm`, not `#left-arm`, because
 * a document never writes a selector. It is legal only on an `image` that has
 * declared `parts` (see {@link l1ImageSchema}), refused by {@link
 * L1_STRUCTURAL_RULES} otherwise: a part named on a node whose drawing is not in
 * the page would animate nothing and say nothing about why.
 *
 * DEGRADES TO THE DESIGN, NEVER TO A BLANK, on exactly {@link
 * l1ScrollTrackSchema}'s terms. The animation is emitted behind
 * `prefers-reduced-motion`, so a visitor who asked for no motion gets the target's
 * authored opacity, position, scale and rotation — nothing is hidden in CSS
 * waiting for a clock to reveal it. This is also why REQ-335's option A was
 * refused rather than built: SMIL inside a drawing has no media-query gate and can
 * be paused only by script, so the same guarantee is unreachable there.
 *
 * COMPOSES WITH THE OTHER DRIVERS, PER PROPERTY AND PER TARGET (REQ-329's rule,
 * widened rather than duplicated). A node may carry an entrance, a scroll track,
 * hover states and a timed track at once. Two animations may not claim the same
 * property ON THE SAME TARGET — within one CSS animation list the last to name a
 * property wins and the earlier one moves no pixel. Two tracks aimed at DIFFERENT
 * parts never contest, which is the whole point: the arms move while the parchment
 * does not.
 */
export const l1AnimateTrackSchema = z
  .object({
    /**
     * An `id` inside this node's drawing, without the `#`. Absent → the node
     * itself is the target.
     */
    part: z.string().min(1).optional(),
    /** What starts it — `load` (the default), `in-view` or `hover`. */
    trigger: l1AnimateTriggerSchema.optional(),
    /** One cycle, in milliseconds. Positive: a zero-length animation is a state. */
    durationMs: finite.positive(),
    /** Held before the first cycle. */
    delayMs: finite.nonnegative().optional(),
    /** Timing curve — the same closed enum a transition uses. */
    easing: l1EasingSchema.optional(),
    /** A repeat count, or `infinite` for the ambient case. Absent → one cycle. */
    iterations: z.union([finite.positive(), z.literal('infinite')]).optional(),
    /** How successive cycles run. Absent → `normal`. */
    direction: l1AnimateDirectionSchema.optional(),
    /** The values across the cycle — two or more stops (one stop is a constant). */
    stops: z.array(l1AnimateStopSchema).min(2),
  })
  .strict()

/**
 * REQ-335 — a node's timed motion: ONE track, or two-or-more composed.
 *
 * The list form is what makes a performing illustration expressible at all: a
 * drawing whose arms, lever and eyes each move on their own clock is one node
 * carrying one track per part. A single object is the one-track case, and **a
 * one-element array is not a legal spelling of it** — see
 * {@link l1EntranceSchema} for why two spellings of one thing is the drift this
 * schema refuses everywhere.
 */
/**
 * **A track whose driver is the clock and whose subject is WHICH FRAME IS SHOWING.**
 *
 * REQ-335's second half, and the half that reaches art the platform did not draw.
 * A property track moves a whole picture — it can drift, breathe, turn or fade it,
 * and that is all it can ever do, because a picture is one flat thing to the page.
 * A frame track plays an animation somebody ANIMATED: a strip of frames in one
 * file, stepped through in time, so the motion is whatever the animator drew rather
 * than whatever this schema happens to have an axis for.
 *
 * WHY A STRIP AND NOT AN ANIMATED GIF — the obvious answer, refused on evidence. A
 * GIF begins the instant it decodes and runs on a clock nothing in the page can
 * reach: there is no property that pauses it, no way to restart it, and no way to
 * hold it still for a visitor who has asked their system for no motion. It cannot
 * be given the `hover` and `in-view` triggers REQ-335 asks for, and it cannot honour
 * the reduced-motion gate every other motion here passes through. A strip gives all
 * of that away for free, because the thing being animated is an ordinary CSS
 * property and the platform already knows how to gate one.
 *
 * `frames` names an INCLUSIVE range of the strip its node declared (see
 * {@link l1ImageSchema}'s `frames`), so one file can hold several sequences and a
 * node can play the one it wants. Both ends are written out rather than defaulted:
 * the author already had to know the strip's length to declare it, and a range that
 * runs off the end is then a refusal with a number in it instead of a page showing
 * a frame that is not there.
 *
 * NO `easing`, deliberately. A frame either is showing or is not, so the timing
 * function is `steps()` and is derived from the range — an author who could write
 * `ease-in` here would be writing a value the renderer must ignore, which is the
 * "accepted and then inert" failure this envelope refuses everywhere else.
 *
 * NO `part`. A strip is one picture per frame; there is nothing inside it to name.
 * The two mechanisms are exclusive on a node for the same reason
 * ({@link L1_STRUCTURAL_RULES.partsAndFramesExclusive}).
 */
export const l1FrameTrackSchema = z
  .object({
    /**
     * The inclusive frame range to play, indexed from 0 within the node's strip.
     * `to` must be greater than `from` (a single frame is a still) and must fall
     * inside the strip — both refused by {@link L1_STRUCTURAL_RULES}.
     */
    frames: z
      .object({
        from: z.number().int().nonnegative(),
        to: z.number().int().nonnegative(),
      })
      .strict(),
    /** What starts it — `load` (the default), `hover` or `in-view`. */
    trigger: l1AnimateTriggerSchema.optional(),
    /** One pass through the range, in milliseconds. */
    durationMs: finite.positive(),
    /** Held before the first pass. */
    delayMs: finite.nonnegative().optional(),
    /** A repeat count, or `infinite` for a looping cycle. Absent -> one pass. */
    iterations: z.union([finite.positive(), z.literal('infinite')]).optional(),
    /** How successive passes run. `alternate` plays the sequence back and forth. */
    direction: l1AnimateDirectionSchema.optional(),
  })
  .strict()

/**
 * REQ-335 — a node's timed motion: ONE track, or two-or-more composed.
 *
 * The list form is what makes a performing illustration expressible at all: a
 * drawing whose arms, lever and eyes each move on their own clock is one node
 * carrying one track per part. A single object is the one-track case, and **a
 * one-element array is not a legal spelling of it** — see
 * {@link l1EntranceSchema} for why two spellings of one thing is the drift this
 * schema refuses everywhere.
 *
 * The two track kinds are told apart by the field each one cannot do without —
 * `stops` for a property track, `frames` for a frame track — and both are
 * `.strict()`, so neither can be written in a way that reads as the other. They
 * compose in one list: a plate may drift on its own clock while the film strip
 * inside it plays, because they move different elements.
 */
export const l1AnimationSchema = z.union([
  l1AnimateTrackSchema,
  l1FrameTrackSchema,
  z.array(z.union([l1AnimateTrackSchema, l1FrameTrackSchema])).min(2),
])

// ── Named and inherited type (REQ-350) ────────────────────────────────────────

/**
 * REQ-350 — a style's name: kebab-case, free-form (`body`, `heading-2`,
 * `caption`), the same grammar a palette entry's name has, because it is the
 * same kind of thing — a value set once and referred to by name.
 */
export const l1StyleNameSchema = l1PaletteNameSchema

/**
 * The five type axes a style can set, with the per-width tracks for the three
 * that vary across the ladder. The same axes, units and ranges as a text run's
 * own (see {@link l1TextAxesSchema}), so a style is a value a run could have
 * carried literally and resolving one is a substitution, never an
 * interpretation. Bounded here as well as at the run, because a style that no
 * run uses yet is still part of the site and must still be a legal value.
 */
const l1TypeAxesShape = {
  fontFamily: z.string().min(1).optional(),
  fontSizePx: z.number().min(1).max(400).optional(),
  fontWeight: z.number().min(1).max(1000).optional(),
  lineHeightPx: z.number().min(-10_000).max(100_000).optional(),
  letterSpacingPx: z.number().min(-10_000).max(100_000).optional(),
  responsive: l1TextResponsiveSchema.optional(),
}

/**
 * REQ-350 — a NAMED TEXT STYLE: type set once, on the site, and referred to by
 * every run that uses it (`axes.textStyle`). Changing the style changes every
 * run that refers to it — the palette's model (REQ-114), one axis group over.
 * Structured only: a closed set of typed axes, `.strict()`, no raw CSS.
 */
export const l1TextStyleSchema = z.object(l1TypeAxesShape).strict()

/** The site's text styles: an arbitrary-size map of names to styles. */
export const l1TextStylesSchema = z.record(l1StyleNameSchema, l1TextStyleSchema)

/**
 * REQ-350 — the type a box or container sets FOR WHAT IT CONTAINS: a named
 * style, literal values over it, or both. Every text run beneath inherits it
 * unless it, or a nearer container, says otherwise — the way the page's text
 * colour already falls back. Precedence, nearest first: the run's own value,
 * the run's own style, the nearest container's value, that container's style,
 * and so on outward to the site's default style.
 */
export const l1TypeSchema = z
  .object({
    style: l1StyleNameSchema.optional(),
    ...l1TypeAxesShape,
  })
  .strict()

// ── Leaf axis bags (typed subset of the ~48 captured ValueElement axes) ───────

/** Text-run axes — literal values transcribed straight from a capture. */
export const l1TextAxesSchema = z
  .object({
    color: l1Color.optional(),
    /**
     * REQ-350 — the named text style this run uses ({@link l1TextStyleSchema}).
     * The run's own `fontFamily`/`fontSizePx`/… still win over it; anything the
     * run leaves unset comes from the style, then from its containers.
     */
    textStyle: l1StyleNameSchema.optional(),
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
    /**
     * REQ-370 — the run keeps its spaces and lets them take width while it still
     * wraps. Under `break-spaces` a trailing space, and the space at a soft wrap,
     * widen the line and so move a centred one; `pre-wrap` keeps them but lets a
     * line-end space hang. Absent: spaces collapse, the CSS default.
     *
     * A closed enum and never a raw `white-space` value: `nowrapFromPx` is still
     * the only way to say "do not wrap", so the two cannot contradict each other.
     */
    whiteSpace: z.enum(['break-spaces', 'pre-wrap']).optional(),
    // ── REQ-91 text pixel-movers ──────────────────────────────────────────────
    /** Text-fill gradient (a `background-clip: text` paint) — replaces the flat `color`. */
    gradientFill: l1GradientSchema.optional(),
    /** Painted decoration line (underline / strike / overline). */
    textDecoration: z.enum(['none', 'underline', 'line-through', 'overline']).optional(),
    /** REQ-365 — where the underline sits; see {@link l1UnderlineOffsetPx}. */
    underlineOffsetPx: l1UnderlineOffsetPx.optional(),
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
  /**
   * REQ-100 — typed scroll-entrance; the renderer owns the observer that drives
   * it. REQ-326 — one behaviour, or a list of two or more that compose.
   */
  reveal: l1EntranceSchema.optional(),
  /** REQ-325 — pin against the viewport for the length of the parent's box. */
  sticky: l1StickySchema.optional(),
  /**
   * REQ-325 — properties driven by scroll progress rather than by a one-shot
   * trigger. REQ-329 — one track, or a list of two or more that compose.
   */
  scrollTrack: l1ScrollMotionSchema.optional(),
  /**
   * REQ-335 — properties driven by the CLOCK: looping, sequenced, and aimable at a
   * named part of a drawing. One track, or a list of two or more that compose.
   */
  animate: l1AnimationSchema.optional(),
  /**
   * BUG-112 — **this node is deliberately stacked over what it overlaps.**
   *
   * Two boxes that intersect are, by default, a defect: the renderer paints in
   * document order with no z-index, so a run that lands on its neighbour is the
   * reader losing a sentence. The envelope evaluator therefore reports every
   * intersection it finds, and the gate fails on it.
   *
   * A deliberate stacked composition — a headline over a hero photograph, a badge
   * on a card's corner — is the SAME geometry with a different intent, and no
   * measurement can tell the two apart. So the intent is declared here rather
   * than inferred: a node carrying `stacked` says its overlap is the design, and
   * the evaluator exempts every pair it takes part in.
   *
   * `true` is the only legal value. `false` would be a second spelling of absent,
   * which is the drift this schema refuses everywhere else — and, more to the
   * point, the absence has to keep meaning "nobody has chosen", so that an
   * unmarked overlap stays a finding rather than a silent default.
   *
   * NOT A PAINT AXIS, WITH ONE EXCEPTION. On a node in ordinary flow it moves no
   * pixel and the renderer emits nothing for it (DOC-24's rule is about what L1
   * must be able to *express*; this is what the document must be able to
   * *declare*, alongside `heading` / `link` / `action`, which paint nothing
   * either) — the declaration needs no `z-index` there because document order
   * already paints a later sibling over an earlier one, and a folded
   * reproduction's measured overlaps must keep the paint the reference had.
   *
   * BUG-154 — **on a node that also carries {@link l1StickySchema}, it lifts.**
   * A pin is the one placement where document order contradicts the declaration:
   * the page moves past a node that does not, so a sibling arriving later covers
   * the very node that just said it was the figure. There it compiles to the same
   * single `z-index: 1` as `sticky.lift`, inside the pin's own declaration list —
   * so a width-gated pin lifts only inside its band, and a node carrying both
   * spellings emits one `z-index` rather than two. `sticky.lift` is the direct
   * spelling of the same decision and is unchanged; reach for it when the pin is
   * not part of a declared overlap. A fold authors `stacked` and never authors
   * `sticky`, so no reproduction can reach this branch and none of their paint
   * moves.
   *
   * REQ-331 — **a fold DOES author it, and the reference is what declares it.**
   * The original reading here was that a capture cannot recover the intent
   * because the browser shows the stack and not the reason for it. That is true
   * of an overlap seen in isolation and false of a REPRODUCTION, which is the
   * only thing the fold ever produces: when the reference's own captured boxes
   * overlap, the overlap is a fact about the page being reproduced, and a
   * reproduction that reproduces it is not making a mistake. So the fold marks
   * the figure of every overlap the reference itself painted, and marks nothing
   * else — an overlap the fold INVENTED (one side captured clear of the other)
   * is still a finding, which is the property that keeps the exemption honest.
   *
   * Measured on faelan.com, whose hero is four photographs montaged over a
   * headline: 218 `overlap` findings across all three envelope probes, every one
   * of them a pair the reference painted, failing the reproduction for being
   * faithful.
   */
  stacked: z.literal(true).optional(),
  /**
   * REQ-347 — **the level this node paints at, among its siblings.**
   *
   * THE AXIS L1 DID NOT HAVE. `stacked` above is a DECLARATION and not a paint
   * axis: it tells the envelope evaluator that an overlap is the design, and the
   * renderer emits nothing for it. `sticky.lift` is the one thing in the substrate
   * that ever compiled to a `z-index`, and it is a field of the pin — unreachable
   * for a node that is not pinned, and a single fixed level besides. So a document
   * could say "these two boxes deliberately overlap" and could not say WHICH ONE
   * IS ON TOP, and every reproduction of a montage painted its layers in document
   * order and hoped.
   *
   * Measured on faelan.com, whose hero absolutely-places a 64px `<h1>` at
   * `z-index: 20` over four collage photographs at 15 / 5 / auto / auto: the
   * reproduction emitted no `z-index` anywhere, DOM order decided, and the
   * headline and its whole tagline were painted underneath an opaque photograph —
   * invisible on the page, and 64.1% of that round's ranked pixel residual with
   * zero value deltas to name it.
   *
   * AN INTEGER, BECAUSE THAT IS WHAT THE THING IS. Every other spelling considered
   * — an ordinal, a `front`/`back` enum, a sibling permutation — is a rank the
   * renderer would have to turn back into a `z-index` anyway, and none of them can
   * express the gaps a page leaves between its levels (20 over 15 over 5) that
   * make room for a later insertion. The range is bounded like every other numeric
   * axis; `9999`-style values clamp into it on the way in, which preserves their
   * order.
   *
   * ZERO IS NOT A LEVEL, it is the absence of one — `z-index: 0` and `z-index:
   * auto` differ only in whether a stacking context is created, which L1 does not
   * model, and admitting `0` would be the second spelling of absent this schema
   * refuses everywhere else. Absent keeps meaning "document order decides", which
   * is the default the renderer already has.
   *
   * ORTHOGONAL TO `stacked`, and deliberately not merged with it. `stacked` says
   * an overlap is intended; `paintOrder` says how it resolves. A node can carry
   * either alone: a figure that overlaps nothing still stacks, and a declared
   * overlap between two boxes of the same level still paints in document order.
   */
  paintOrder: z
    .number()
    .int()
    .refine((v) => v !== 0, { message: 'paintOrder 0 is the absence of a level — omit the field' })
    .optional(),
  /**
   * REQ-332 — **cut my children off at my own edge.**
   *
   * {@link l1TransformSchema}'s doc comment settles that the renderer emits no
   * `overflow` anywhere, so "a node translated past its parent's edge paints in
   * full rather than being cut off at the boundary" — and names the explicit
   * `mask` as the one thing that still clips. That is right for a decorative edge
   * treatment and cannot stand in for a clip: {@link l1MaskSchema} accepts seven
   * SHAPES, none of which is "my own rectangle", and a `parallelogram` at
   * `slantPct: 0` only degenerates to one by accident of the polygon the renderer
   * builds — an accident is not an intent a document can state.
   *
   * So the gap was real and structural. A carousel, a marquee, a filmstrip and a
   * masked reveal all lay their content out BEYOND the box the reader sees and
   * rely on the box to cut it off; with no way to say so, every one of them makes
   * the document as wide as its off-screen content. Measured on
   * joyfulculinarycreations.com, whose testimonial swiper places two slides at
   * `x: -419` and `x: 1027`: both sides place the slides identically and only the
   * reproduction scrolls, 1699.75px wide against the reference's 1280 — 10 `clip`
   * findings, every one of the round's 56 `escape` findings, and two
   * `surfaceFill` deltas from runs that had slid off the band backing them.
   *
   * `true` IS THE ONLY LEGAL VALUE, for the reason `stacked` gives above: `false`
   * would be a second spelling of absent, and absent has to keep meaning "the
   * document has not chosen", which for clipping is the paint-in-full default the
   * transform axis settles on. DECLARED, NEVER INFERRED, for the same reason —
   * geometry alone cannot tell a carousel from a deliberate bleed off the edge.
   *
   * ONE AXIS, NOT TWO. CSS has `overflow-x` and `overflow-y`, and a document could
   * in principle clip one and not the other — but `overflow: hidden` on a single
   * axis promotes the other to `auto` in every browser, which is a scrollbar the
   * document never asked for. One flag that cuts at the box is the intent every
   * clipping composition actually has.
   */
  clip: z.literal(true).optional(),
} as const

/**
 * REQ-105 — the node-level axis groups every L1 node kind carries: placement,
 * sizing, visibility, transform, mask, padding (static + responsive), the typed
 * interaction / reveal states, and REQ-325's two scroll-position axes. One
 * declaration, spread into each kind.
 */
export const l1NodeAxisGroupsSchema = z.object(nodeAxisGroupsShape).strict()

/** The inferred shape of {@link l1NodeAxisGroupsSchema} — every field optional. */
export type L1NodeAxisGroups = z.infer<typeof l1NodeAxisGroupsSchema>

// ── Multi-variate text (REQ-211) ─────────────────────────────────────────────
//
// A run of page copy could not vary within itself. One coloured word in a
// headline, an ordinal set as a superscript, an emphasised phrase — each cost
// three absolutely-positioned `text` leaves, whose coordinates are a guess and
// whose responsive behaviour is wrong the moment the copy reflows (DOC-52 §3.7).
// The schema was therefore not merely missing a nicety: it actively pushed the
// author toward brittle geometry for ordinary typography.
//
// The fix is one level of inline structure and no more. `text` accepts either a
// string — unchanged, so every existing document stays valid — or an ordered
// list of runs. There is no nesting and no `link` inside a run: arbitrary
// nesting is rich text, which is a different product decision, and an inline
// anchor is a second addressing problem while the renderer remains the sole
// `<a>` sink.

/**
 * The axes ONE RUN may vary from the node it sits in — deliberately a narrow
 * subset of {@link l1TextAxesSchema}, not the whole bag.
 *
 * Why a subset: every axis that describes the *block* (alignment, measure, the
 * wrap threshold, the painted surface, a list marker) is meaningless on a
 * fragment of a line, and every axis that describes the *face* (family, tracking,
 * line-height) is what makes a paragraph read as one paragraph. What is left is
 * exactly what inline variation is for — a different colour, a different size, a
 * different weight, a different slope, and a lift off the baseline.
 *
 * Both sizes are RELATIVE, and that is the point rather than a shorthand. A node
 * routinely carries a per-width `responsive.fontSizePx` track (BUG-18); a run
 * declaring absolute pixels would win at every width the track covers and pin
 * the ordinal at its desktop size on a phone. A scale rides the track for free.
 */
export const l1TextRunAxesSchema = z
  .object({
    /** The run's own fill — a literal or a palette reference, like any colour. */
    color: l1Color.optional(),
    /**
     * Multiplier on the node's own size, emitted as `em`. `0.6` is an ordinal;
     * `1.2` is a lead-in word. Bounded by the envelope rather than here, so the
     * refusal an out-of-range value produces names the field and the node.
     */
    sizeScale: finite.positive().optional(),
    fontWeight: finite.optional(),
    fontStyle: z.enum(['normal', 'italic']).optional(),
    /**
     * Baseline shift in `em` of the RUN's own size — positive raises. A
     * superscript ordinal is `sizeScale: 0.6` with a shift around `0.5`; a
     * subscript is a negative one. `vertical-align` rather than a transform, so
     * the line box still accounts for the run and neighbouring lines do not
     * collide with it.
     */
    baselineShiftEm: finite.optional(),
    /**
     * REQ-331 — the run's own decoration line.
     *
     * A sentence with a link in it is the most common inline variation on the
     * web, and an underline is how the web has always drawn one. Without this
     * the only way to underline one word was to pin it as a separate absolutely
     * positioned node — which is precisely the brittle geometry REQ-211 exists
     * to retire, so the rejoin could not be taken without losing the line.
     *
     * `none` is meaningful here rather than a second spelling of absent: a
     * linked run inherits the UA's underline, so a reference that draws a link
     * WITHOUT one has to be able to say so.
     */
    textDecoration: z.enum(['none', 'underline', 'line-through', 'overline']).optional(),
    /**
     * REQ-365 — where this run's underline sits; see {@link l1UnderlineOffsetPx}.
     * The linked word in a sentence is exactly where a page restates the offset.
     */
    underlineOffsetPx: l1UnderlineOffsetPx.optional(),
  })
  .strict()

/** One run of a multi-variate text node: its words, and how they differ. */
export const l1TextRunSchema = z
  .object({
    /**
     * VERBATIM, including the spaces that separate this run from its neighbours.
     * The renderer concatenates runs with nothing between them and the plain-text
     * projection does the same, so `['Hello ', 'world']` is a sentence and
     * `['super', 'script']` is one word — a joiner that invented a space could
     * not express the second.
     */
    text: z.string(),
    axes: l1TextRunAxesSchema.optional(),
    /**
     * REQ-331 — this run, and only this run, is a link.
     *
     * Beside `axes` rather than inside it for the same reason the node carries
     * {@link l1NodeAxisGroupsSchema}'s `link` beside its own axes: navigation is
     * a ROLE, not a paint axis — it moves no pixel by itself, and the renderer
     * answers it with a tag rather than with a declaration.
     *
     * This is what makes an inline flow rejoinable without loss. `Artist •
     * <a>Musician</a> • Creator` is one sentence in the source and one `text`
     * node after the fold; before this axis existed, folding it that way would
     * have silently dropped the anchor and left the reproduction with dead text
     * where the reference had a link.
     *
     * Cleared by the same `isSafeHref` allowlist as the node-level link, so an
     * unsafe href degrades to a plain run — never a live `javascript:` link.
     */
    link: l1LinkSchema.optional(),
  })
  .strict()

/**
 * A text node's copy: one string, or two-or-more runs.
 *
 * **A one-element array is not a legal spelling of a plain string.** Two ways to
 * write the same thing is the drift this codebase refuses everywhere else: the
 * fold, the renderer and the editor would each need a rule about which one they
 * emit, and the first to disagree makes a document that reads differently
 * depending on who wrote it. `min(2)` makes the canonical form structural rather
 * than a convention someone has to remember.
 */
export const l1TextContentSchema = z.union([z.string(), z.array(l1TextRunSchema).min(2)])

// ── Nodes — a discriminated union on `kind` ───────────────────────────────────
//
// `container` and `box` are recursive; Zod v4 handles this with a lazy getter on
// the `children` field (the schema is still a ZodObject, so it remains a legal
// discriminated-union option and its inferred type recurses automatically).

/** A leaf of styled, escaped text — one run, or several (REQ-211). */
export const l1TextSchema = z
  .object({
    kind: z.literal('text'),
    id: z.string().optional(),
    /** REQ-211 — one string, or an ordered list of runs that vary within it. */
    text: l1TextContentSchema,
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
    /** REQ-212 — the disclosure verb; the renderer is the sole `<button>` sink. */
    action: l1ActionSchema.optional(),
    /** REQ-269 — the heading role; the renderer is the sole `<h1>`…`<h6>` sink. */
    heading: l1HeadingSchema.optional(),
    /**
     * BUG-143 — the id of the **backing surface this run sits on**: the
     * fold-synthesized `box` (a section band, a card) that is painted behind it.
     *
     * It exists because the relationship existed NOWHERE before, and a
     * relationship that exists nowhere cannot be asserted. At rest a panel and
     * the runs on it line up only because their coordinates coincide, so every
     * probe that wanted to ask "does this surface still cover what it backs"
     * first had to GUESS the pairing from containment — and a guess is not a
     * gate. The fold knows the answer outright: the capture resolves which
     * ancestor paints each run's surface, and the band/card reconstruction is
     * built from exactly those rows. This is that knowledge, written down.
     *
     * Inert at render time — it names a relation, not a paint axis. It is read by
     * the geometry envelope (`probes.ts`, the `escape` finding) and, once a
     * surface really contains its content structurally, by whatever replaces it.
     */
    backedBy: z.string().optional(),
  })
  .strict()

/** A media leaf. `src` is scheme-checked by the envelope validator. */
export const l1ImageSchema = z
  .object({
    kind: z.literal('image'),
    id: z.string().optional(),
    src: z.string(),
    alt: z.string(),
    /**
     * REQ-335 — **place this drawing IN the page, so its parts are addressable.**
     *
     * An `<img>` is a window onto another document: nothing in the page can reach
     * an `id` inside it, and a browser deliberately gives it no pointer events, so
     * neither CSS nor a hover can ever touch one of its parts. That is the wall
     * REQ-335 hit, and it is a property of the channel rather than of our rules —
     * which is why permitting animation inside the FILE would not have moved it.
     *
     * Declaring `parts` asks the renderer to emit the drawing's own markup inline
     * instead, at which point an `id` in it is an ordinary element in an ordinary
     * cascade: an {@link l1AnimateTrackSchema} may name it, and a `hover` trigger
     * on it actually fires.
     *
     * IT IS A DECLARATION, NOT A PAYLOAD. The drawing's bytes stay the one asset
     * the generated-image channel (REQ-130) already wrote and already validated;
     * this node names it by `src` exactly as before. A render that cannot be handed
     * those bytes, or is handed bytes that do not pass the content validator, emits
     * the plain `<img>` and no part motion — an inert degradation, on the terms a
     * `slot` with no module bound to it already renders by.
     *
     * Only a DRAWING can be inlined. A raster illustration has no parts to name and
     * nothing in the platform turns one into a drawing, so `parts` on a PNG is
     * simply the `<img>` it always was.
     */
    parts: z.literal(true).optional(),
    /**
     * REQ-335 — **this `src` is a FILM STRIP of N equal-width frames laid left to
     * right, and this node is a window onto one of them.**
     *
     * The declaration that makes hand-animated motion expressible at all. Without
     * it the file is one picture and the box shows all of it; with it the box shows
     * exactly `1/N` of the file's width, and an {@link l1FrameTrackSchema} may step
     * which `1/N` that is.
     *
     * IT CHANGES THE LAYOUT, NOT ONLY THE MOTION, which is why it lives on the node
     * rather than on the track. A visitor who has asked for no motion, a browser
     * that ran no animation, a capture taken with motion frozen: all of them must
     * still see ONE frame rather than the whole strip squashed into the box. So the
     * windowing is static and unconditional, and the animation is the only part
     * behind the reduced-motion gate.
     *
     * THE RESTING FRAME IS FRAME 0. A track that plays `2..5` still settles to 0
     * when it is not running and under reduced motion, so a strip's first frame is
     * its poster and should be the one the illustration is designed to sit at.
     *
     * The box should carry the frames' own aspect ratio. Nothing here can read the
     * file to check that, so it is the author's to get right — but the failure is
     * gentle: a mismatched box stretches every frame equally rather than showing
     * parts of two.
     *
     * Exclusive with `parts` ({@link L1_STRUCTURAL_RULES.partsAndFramesExclusive}):
     * a strip is stepped, a drawing is placed in the page, and a node is one or the
     * other.
     */
    frames: z.number().int().min(2).optional(),
    axes: l1ImageAxesSchema.optional(),
    ...nodeAxisGroupsShape,
    /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
    link: l1LinkSchema.optional(),
    /**
     * REQ-327 — the magnify role; the renderer is the sole sink for the overlay it
     * compiles to, exactly as it is for the `<a>` above.
     */
    zoom: l1ZoomSchema.optional(),
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
/**
 * REQ-265 — a control's paint axes: every text-run axis, plus the one value only
 * a control has.
 *
 * A placeholder is painted by a UA pseudo-element (`::placeholder`) that inherits
 * NOTHING, so its colour is not expressible by any axis on the element itself —
 * setting the control's `color` paints the typed text too, which is a different
 * claim. Before this axis existed the renderer had to choose one behaviour for
 * every document (it re-pointed the pseudo-element at the field's own colour), so
 * a reference that deliberately left the browser default in place could not be
 * authored at all: there was no pair of L1 values that produced it.
 *
 * It is an EXTENSION of the text-axis bag rather than a member of it, because a
 * text run has no placeholder — the axis would be inert on every run in every
 * document and would still have to be read, documented and validated there.
 */
export const l1ControlAxesSchema = l1TextAxesSchema.extend({
  /** The placeholder's ink. Absent → the renderer's default (inherit the field's colour). */
  placeholderColor: l1Color.optional(),
})

export const l1ControlSchema = z
  .object({
    kind: z.literal('control'),
    id: z.string().optional(),
    /** The module-declared element this node paints (a field name, `submit`, …). */
    control: z.string().min(1),
    /**
     * Paint axes, identical to a text run's, plus `placeholderColor` — the one
     * painted value only a control has: a control is a styled text-bearing leaf
     * (a placeholder, a button label) that may also paint its own surface.
     */
    axes: l1ControlAxesSchema.optional(),
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
  /** REQ-350 — the type this box sets for every run it contains. */
  type?: z.infer<typeof l1TypeSchema>
  /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
  link?: L1Link
  /** REQ-212 — the overlay role; the renderer is the sole modal sink. */
  dialog?: L1Dialog
  /** REQ-212 — the disclosure verb; the renderer is the sole `<button>` sink. */
  action?: L1Action
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
  /** REQ-350 — the type this container sets for every run it contains. */
  type?: z.infer<typeof l1TypeSchema>
  gapPx?: number
  columns?: number
  distribution?: z.infer<typeof l1DistributionSchema>
  align?: z.infer<typeof l1AlignSchema>
  /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
  link?: L1Link
  /** REQ-212 — the overlay role; the renderer is the sole modal sink. */
  dialog?: L1Dialog
  /** REQ-212 — the disclosure verb; the renderer is the sole `<button>` sink. */
  action?: L1Action
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
      /** REQ-350 — the type this box sets for every run it contains. */
      type: l1TypeSchema.optional(),
      ...nodeAxisGroupsShape,
      /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
      link: l1LinkSchema.optional(),
      /** REQ-212 — the overlay role; the renderer is the sole modal sink. */
      dialog: l1DialogSchema.optional(),
      /** REQ-212 — the disclosure verb; the renderer is the sole `<button>` sink. */
      action: l1ActionSchema.optional(),
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
      /** REQ-350 — the type this container sets for every run it contains. */
      type: l1TypeSchema.optional(),
      gapPx: finite.nonnegative().optional(),
      columns: z.number().int().positive().optional(),
      distribution: l1DistributionSchema.optional(),
      align: l1AlignSchema.optional(),
      ...nodeAxisGroupsShape,
      /** REQ-106 — the navigation role; the renderer is the sole `<a>` sink. */
      link: l1LinkSchema.optional(),
      /** REQ-212 — the overlay role; the renderer is the sole modal sink. */
      dialog: l1DialogSchema.optional(),
      /** REQ-212 — the disclosure verb; the renderer is the sole `<button>` sink. */
      action: l1ActionSchema.optional(),
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
    /**
     * REQ-332 — a single weight, or the `[min, max]` RANGE a variable face covers.
     *
     * A variable font is one file that answers every weight between two bounds,
     * and `font-weight: 200 800` on its `@font-face` is how CSS says so. Pinned to
     * a single number the browser synthesises the other weights (or ignores the
     * request), which is a different set of glyphs from the ones the reference
     * painted. Both Karla and Oswald on joyfulculinarycreations.com are variable
     * faces covering 200–800, and the capture had no way to say it — so the pair
     * shape is the axis, not a convenience.
     */
    weight: z.union([finite, z.tuple([finite, finite])]).optional(),
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

/**
 * Every key of the document that is not the element tree (REQ-175).
 *
 * DERIVED FROM THE SCHEMA, NEVER LISTED. This is the anchor of the parity
 * guarantee: the control surface's document read projects exactly these keys,
 * and the parity test asserts every one of them is reachable and writable. A
 * sixth document key therefore appears here the moment it is added above, and
 * fails the parity test the same day — which is the whole point. A hand-written
 * copy of this list would go stale silently, and the symptom would be the one
 * this ticket was filed over: a capability the reproduction path has and the
 * consultant cannot reach, discovered a client session later.
 *
 * `root` is excluded because it is not unreachable — it IS the address `"0"`,
 * and `set_l1` has always written it.
 */
export const L1_DOCUMENT_KEYS: readonly string[] = Object.keys(l1DocumentSchema.shape).filter(
  (key) => key !== 'root',
)
