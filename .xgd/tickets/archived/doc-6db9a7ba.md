---
uid: doc-6db9a7ba
id: DOC-58
type: doc
title: The vocabulary a page is written in
created_by: REQ-310
created_at: '2026-09-25T00:48:15.434334+00:00'
updated_at: '2026-09-25T00:48:15.434334+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  doc_kind: system_kb
  projected: true
  source: packages/site-schema/src/l1/schema.ts
---

# The vocabulary a page is written in

> Generated from the L1 element schemas and their validation envelope. Do not edit: this document is rebuilt from its
> source on every build, and an edit here is lost without warning.

A page is a document holding a tree of typed elements. Everything that is seen —
the words, the pictures, the boxes that hold them, and every aspect of how they
look — is one of the elements below, carrying the fields below, inside the
document described first. There is no other vocabulary: an element that is not
well-formed in it is refused whole, and nothing outside it (markup, a stylesheet,
a script) can be expressed at all.

## The page itself

An L1 document: the viewport ladder it is authored against, an optional page background and inherited text colour, an optional resource table (handle→substance), and the root node.

- `widths` — a list of number, at least 0; required
- `background` — color
- `textColor` — color. The page's inherited text colour.
- `resources` — resources
- `column` — column. The shared centred content column `geometry.anchor` refers to.
- `root` — node; required

## The kinds of element

### `text`

- `id` — text
- `text` — text content; required. One string, or an ordered list of runs that vary within it.
- `axes` — text axes
- `responsive` — text responsive. Per-width tracks for the numeric type axes that vary across the ladder.
- `geometry` — geometry. Per-width absolute placement — the transcription face's pinned box.
- `sizing` — axis sizing. The node's own extent: a fixed px, fluid fill, or hug, per axis, with min/max.
- `visibility` — visibility
- `transform` — transform
- `mask` — mask
- `padding` — padding
- `responsivePadding` — padding responsive. Per-width padding tracks; a track owns its side at render time.
- `interaction` — interaction. Typed hover / focus states; the renderer is the sole pseudo-class sink.
- `reveal` — reveal. Typed scroll-entrance; the renderer owns the observer that drives it.
- `stacked` — `true`. **this node is deliberately stacked over what it overlaps.** Two boxes that intersect are, by default, a defect: the renderer paints in document order with no z-index, so a run that lands on its neighbour is the reader losing a sentence.
- `link` — link. The navigation role; the renderer is the sole `<a>` sink.
- `action` — action. The disclosure verb; the renderer is the sole `<button>` sink.
- `heading` — heading. The heading role; the renderer is the sole `<h1>`…`<h6>` sink.

### `image`

- `id` — text
- `src` — text; required
- `alt` — text; required
- `axes` — image axes
- `geometry` — geometry. Per-width absolute placement — the transcription face's pinned box.
- `sizing` — axis sizing. The node's own extent: a fixed px, fluid fill, or hug, per axis, with min/max.
- `visibility` — visibility
- `transform` — transform
- `mask` — mask
- `padding` — padding
- `responsivePadding` — padding responsive. Per-width padding tracks; a track owns its side at render time.
- `interaction` — interaction. Typed hover / focus states; the renderer is the sole pseudo-class sink.
- `reveal` — reveal. Typed scroll-entrance; the renderer owns the observer that drives it.
- `stacked` — `true`. **this node is deliberately stacked over what it overlaps.** Two boxes that intersect are, by default, a defect: the renderer paints in document order with no z-index, so a run that lands on its neighbour is the reader losing a sentence.
- `link` — link. The navigation role; the renderer is the sole `<a>` sink.

### `slot`

- `id` — text
- `name` — text; required
- `behavior` — text
- `axes` — surface axes
- `geometry` — geometry. Per-width absolute placement — the transcription face's pinned box.
- `sizing` — axis sizing. The node's own extent: a fixed px, fluid fill, or hug, per axis, with min/max.
- `visibility` — visibility
- `transform` — transform
- `mask` — mask
- `padding` — padding
- `responsivePadding` — padding responsive. Per-width padding tracks; a track owns its side at render time.
- `interaction` — interaction. Typed hover / focus states; the renderer is the sole pseudo-class sink.
- `reveal` — reveal. Typed scroll-entrance; the renderer owns the observer that drives it.
- `stacked` — `true`. **this node is deliberately stacked over what it overlaps.** Two boxes that intersect are, by default, a defect: the renderer paints in document order with no z-index, so a run that lands on its neighbour is the reader losing a sentence.

### `control`

- `id` — text
- `control` — text; required. The module-declared element this node paints (a field name, `submit`, …).
- `axes` — control axes. Paint axes, identical to a text run's, plus `placeholderColor` — the one painted value only a control has: a control is a styled text-bearing leaf (a placeholder, a button label) that may also paint its own surface.
- `responsive` — text responsive
- `geometry` — geometry. Per-width absolute placement — the transcription face's pinned box.
- `sizing` — axis sizing. The node's own extent: a fixed px, fluid fill, or hug, per axis, with min/max.
- `visibility` — visibility
- `transform` — transform
- `mask` — mask
- `padding` — padding
- `responsivePadding` — padding responsive. Per-width padding tracks; a track owns its side at render time.
- `interaction` — interaction. Typed hover / focus states; the renderer is the sole pseudo-class sink.
- `reveal` — reveal. Typed scroll-entrance; the renderer owns the observer that drives it.
- `stacked` — `true`. **this node is deliberately stacked over what it overlaps.** Two boxes that intersect are, by default, a defect: the renderer paints in document order with no z-index, so a run that lands on its neighbour is the reader losing a sentence.

### `box`

- `id` — text
- `axes` — surface axes
- `geometry` — geometry. Per-width absolute placement — the transcription face's pinned box.
- `sizing` — axis sizing. The node's own extent: a fixed px, fluid fill, or hug, per axis, with min/max.
- `visibility` — visibility
- `transform` — transform
- `mask` — mask
- `padding` — padding
- `responsivePadding` — padding responsive. Per-width padding tracks; a track owns its side at render time.
- `interaction` — interaction. Typed hover / focus states; the renderer is the sole pseudo-class sink.
- `reveal` — reveal. Typed scroll-entrance; the renderer owns the observer that drives it.
- `stacked` — `true`. **this node is deliberately stacked over what it overlaps.** Two boxes that intersect are, by default, a defect: the renderer paints in document order with no z-index, so a run that lands on its neighbour is the reader losing a sentence.
- `link` — link. The navigation role; the renderer is the sole `<a>` sink.
- `dialog` — dialog. The overlay role; the renderer is the sole modal sink.
- `action` — action. The disclosure verb; the renderer is the sole `<button>` sink.
- `children` — a list of node

### `container`

- `id` — text
- `layout` — layout mode; required
- `responsiveLayout` — responsive layout. Per-width layout track; the track owns the mode at render time.
- `wrap` — true / false. `flex-wrap: wrap` for a row; inert in any other resolved mode.
- `axes` — surface axes. The shared surface group: a container paints AND lays out.
- `gapPx` — number, at least 0
- `columns` — number, at least 0
- `distribution` — distribution
- `align` — align
- `geometry` — geometry. Per-width absolute placement — the transcription face's pinned box.
- `sizing` — axis sizing. The node's own extent: a fixed px, fluid fill, or hug, per axis, with min/max.
- `visibility` — visibility
- `transform` — transform
- `mask` — mask
- `padding` — padding
- `responsivePadding` — padding responsive. Per-width padding tracks; a track owns its side at render time.
- `interaction` — interaction. Typed hover / focus states; the renderer is the sole pseudo-class sink.
- `reveal` — reveal. Typed scroll-entrance; the renderer owns the observer that drives it.
- `stacked` — `true`. **this node is deliberately stacked over what it overlaps.** Two boxes that intersect are, by default, a defect: the renderer paints in document order with no z-index, so a run that lands on its neighbour is the reader losing a sentence.
- `link` — link. The navigation role; the renderer is the sole `<a>` sink.
- `dialog` — dialog. The overlay role; the renderer is the sole modal sink.
- `action` — action. The disclosure verb; the renderer is the sole `<button>` sink.
- `staggerMs` — number, at least 0. Interval between successive revealing children, in ms.
- `children` — a list of node; required

## The shapes those fields take

Each of these is one shape, referred to by name wherever it is used.

### action

- `opens` — text. The `id` of a node carrying `l1DialogSchema`, which this opens.
- `closes` — text. The `id` of a node carrying `l1DialogSchema`, which this closes.

### axis sizing

- `width` — sizing
- `height` — sizing

### border

- `widthPx` — number, at least 0; required
- `color` — color; required
- `style` — `solid` | `dashed` | `dotted` | `double`

### column

- `containerPx` — number, at least 0; required. Max width of the centred container itself (Tailwind `max-w-6xl` → 1152).
- `insetPx` — number, at least 0; required. Horizontal padding inside the container (`px-6` → 24).
- `maxWidthPx` — number, at least 0. Optional cap on the content width inside the container (`max-w-4xl` → 896).

### column anchor

- `x` — column term
- `width` — column term

### column term

- `px` — number
- `fraction` — number
- `maxPx` — number, at least 0. Upper bound on the result (`min(maxPx, px + fraction * extent)`).
- `pxTrack` — scalar track. A per-width track for the constant, superseding `px` — the offset *inside* the column, keyframed.

### control axes

- `color` — color
- `fontFamily` — text
- `fontSizePx` — number
- `fontWeight` — number
- `lineHeightPx` — number
- `letterSpacingPx` — number
- `textAlign` — `left` | `center` | `right` | `justify`
- `textTransform` — `none` | `uppercase` | `lowercase` | `capitalize`
- `fontStyle` — `normal` | `italic`
- `nowrapFromPx` — number, at least 0
- `gradientFill` — gradient
- `textDecoration` — `none` | `underline` | `line-through` | `overline`
- `textShadow` — shadow
- `fontVariantCaps` — `normal` | `small-caps` | `all-small-caps`
- `listMarker` — `none` | `disc` | `circle` | `square` | `decimal` | `decimal-leading-zero` | `lower-alpha` | `upper-alpha` | `lower-roman` | `upper-roman`
- `surfaceFill` — color
- `borderRadiusPx` — number, at least 0
- `opacity` — number, 0–1
- `surfaceGradient` — gradient
- `pattern` — pattern
- `backgroundImageUrl` — text
- `pointerAccent` — pointer accent
- `overlay` — overlay
- `boxShadow` — shadow
- `border` — border
- `borderLeft` — border
- `backdropBlurPx` — number, at least 0
- `filter` — filter
- `blendMode` — blend mode
- `placeholderColor` — color. The placeholder's ink.

### dialog

- `backdrop` — overlay. The scrim painted over the page behind the panel.
- `placement` — `center` | `top` | `bottom`. Where the panel sits in the covered viewport.
- `dismissOnEscape` — true / false. Whether Escape closes it.
- `dismissOnBackdrop` — true / false. Whether a click on the scrim closes it.
- `ariaLabel` — text. An accessible name, for when the panel's visible content is not one.

### filter

- `grayscale` — number, 0–1
- `sepia` — number, 0–1
- `invert` — number, 0–1
- `saturate` — number, at least 0
- `brightness` — number, at least 0
- `contrast` — number, at least 0
- `hueRotateDeg` — number
- `blurPx` — number, at least 0

### focus ring

- `widthPx` — number, at least 0; required
- `color` — color; required
- `offsetPx` — number
- `style` — `solid` | `dashed` | `dotted` | `double`

### focus state

- `surfaceFill` — color. The painted fill behind the node's content.
- `borderRadiusPx` — number, at least 0. Corner rounding.
- `opacity` — number, 0–1
- `surfaceGradient` — gradient. A gradient panel fill (a `background-image` gradient over the surface).
- `pattern` — pattern. A repeating texture (dot-grid / hairline grid / rules) over the fill.
- `backgroundImageUrl` — text. A background image (scheme-checked by the envelope, like `image.src`).
- `pointerAccent` — pointer accent. The node's texture (its `pattern`, else its `backgroundImageUrl`) redrawn in a second colour inside a rough region tracking the pointer.
- `overlay` — overlay. A full-bleed translucent scrim painted over the background (hero overlay).
- `boxShadow` — shadow. A drop shadow cast by the node.
- `border` — border. A painted border (uniform, all four sides).
- `borderLeft` — border. A coloured left-accent border (a card's orange/blue rule), distinct from the uniform `border`: a card frequently carries only a thick `border-left` as its accent, and drawing that as a full box outline is the wrong look.
- `backdropBlurPx` — number, at least 0. Frosted-glass blur of whatever sits behind the node (backdrop-filter).
- `filter` — filter. The node's OWN paint, colour-adjusted (CSS `filter`).
- `blendMode` — blend mode. How the node composites with what is behind it.
- `color` — color
- `textDecoration` — `none` | `underline` | `line-through` | `overline`
- `motion` — motion
- `ring` — focus ring

### font face

- `family` — text; required
- `src` — text; required
- `weight` — number
- `style` — `normal` | `italic`

### geometry

- `keyframes` — a list of keyframe; required
- `segments` — a list of segment
- `place` — placement. The frame the keyframes are measured against.
- `viewportResponse` — viewport response. How `y` / `height` track the viewport height (the `100vh` axis).
- `anchor` — column anchor. When present (and the document declares a `column`), `x` and `width` come from the column function rather than the keyframe track.

### gradient stop

- `color` — color; required
- `position` — number, 0–100

### heading

- `level` — number; required. The outline depth, 1…6.

### hover state

- `surfaceFill` — color
- `borderRadiusPx` — number, at least 0
- `opacity` — number, 0–1
- `surfaceGradient` — gradient
- `pattern` — pattern
- `backgroundImageUrl` — text
- `pointerAccent` — pointer accent
- `overlay` — overlay
- `boxShadow` — shadow
- `border` — border
- `borderLeft` — border
- `backdropBlurPx` — number, at least 0
- `filter` — filter
- `blendMode` — blend mode
- `color` — color
- `textDecoration` — `none` | `underline` | `line-through` | `overline`
- `motion` — motion

### image axes

- `objectFit` — `cover` | `contain` | `fill` | `none` | `scale-down`
- `objectPosition` — object position. Which part of the picture the box shows.
- `surfaceFill` — color. The painted fill behind the node's content.
- `borderRadiusPx` — number, at least 0. Corner rounding.
- `opacity` — number, 0–1
- `surfaceGradient` — gradient. A gradient panel fill (a `background-image` gradient over the surface).
- `pattern` — pattern. A repeating texture (dot-grid / hairline grid / rules) over the fill.
- `backgroundImageUrl` — text. A background image (scheme-checked by the envelope, like `image.src`).
- `pointerAccent` — pointer accent. The node's texture (its `pattern`, else its `backgroundImageUrl`) redrawn in a second colour inside a rough region tracking the pointer.
- `overlay` — overlay. A full-bleed translucent scrim painted over the background (hero overlay).
- `boxShadow` — shadow. A drop shadow cast by the node.
- `border` — border. A painted border (uniform, all four sides).
- `borderLeft` — border. A coloured left-accent border (a card's orange/blue rule), distinct from the uniform `border`: a card frequently carries only a thick `border-left` as its accent, and drawing that as a full box outline is the wrong look.
- `backdropBlurPx` — number, at least 0. Frosted-glass blur of whatever sits behind the node (backdrop-filter).
- `filter` — filter. The node's OWN paint, colour-adjusted (CSS `filter`).
- `blendMode` — blend mode. How the node composites with what is behind it.

### interaction

- `transition` — transition
- `hover` — hover state
- `focus` — focus state

### keyframe

- `at` — number, at least 0; required
- `x` — number; required
- `y` — number; required
- `width` — number, at least 0; required
- `height` — number, at least 0
- `atHeight` — number, at least 0. The viewport HEIGHT this keyframe was captured at.

### layout keyframe

- `at` — number, at least 0; required
- `value` — layout mode; required

### linear gradient

- `kind` — `linear`
- `angleDeg` — number
- `stops` — a list of gradient stop; required

### link

- `href` — text; required. Cleared by the same `isSafeUrl` allowlist that guards `image.src` and `backgroundImageUrl`, so `javascript:` is rejected with no new security surface.
- `newTab` — true / false. Opens in a new browsing context.
- `ariaLabel` — text. An accessible name, for when the visible content is not a sufficient one.

### mask

- `shape` — `circle` | `ellipse` | `parallelogram` | `blob` | `featherRadial` | `featherTop` | `featherBottom`; required
- `featherPx` — number, at least 0
- `slantPct` — number, -45–45. `parallelogram` only: how far the top edge leans, as a percentage of the box width.
- `roughness` — number, 0–1. `blob` only: 0 is a plain disc, 1 is maximally lumpy.
- `seed` — number, 0–9999. `blob` only: which blob.

### motion

- `offsetXPx` — number
- `offsetYPx` — number
- `scale` — number, at least 0
- `rotateDeg` — number

### object position

- `xPct` — number, 0–100; required
- `yPct` — number, 0–100; required

### overlay

- `color` — color; required
- `opacity` — number, 0–1

### padding

- `topPx` — number, at least 0
- `rightPx` — number, at least 0
- `bottomPx` — number, at least 0
- `leftPx` — number, at least 0

### padding responsive

- `topPx` — scalar track
- `rightPx` — scalar track
- `bottomPx` — scalar track
- `leftPx` — scalar track

### palette ref

- `ref` — palette name; required
- `shade` — number, -1–1
- `alpha` — number, 0–1

### pattern

- `shape` — `dots` | `grid` | `lines`; required
- `spacingPx` — number, at least 0; required
- `thicknessPx` — number, at least 0
- `color` — color; required
- `angleDeg` — number

### pointer accent

- `color` — color; required. The colour the texture is redrawn in inside the region.
- `radiusPx` — number, at least 0; required. How far the region reaches from the cursor — half its rough diameter.
- `softnessPx` — number, at least 0. Width of the region's feathered edge; 0 is a hard cut.
- `roughness` — number, 0–1. 0 → a plain disc; 1 → maximally lumpy.

### radial gradient

- `kind` — `radial`; required
- `origin` — gradient origin
- `extent` — gradient extent
- `stops` — a list of gradient stop; required

### resources

- `fonts` — a list of font face

### responsive layout

- `keyframes` — a list of layout keyframe; required

### reveal

- `yPx` — number. Vertical offset the node rises *from*, in px.
- `fromOpacity` — number, 0–1. Opacity the node fades *from*.
- `durationMs` — number, at least 0
- `delayMs` — number, at least 0
- `easing` — easing

### scalar keyframe

- `at` — number, at least 0; required
- `value` — number; required

### scalar track

- `keyframes` — a list of scalar keyframe; required
- `segments` — a list of segment

### shadow

- `offsetXPx` — number; required
- `offsetYPx` — number; required
- `blurPx` — number, at least 0
- `spreadPx` — number
- `color` — color; required
- `inset` — true / false

### sizing

- `mode` — `fixed` | `fluid` | `hug`; required
- `px` — number, at least 0
- `minPx` — number, at least 0
- `maxPx` — number, at least 0

### surface axes

- `surfaceFill` — color
- `borderRadiusPx` — number, at least 0
- `opacity` — number, 0–1
- `surfaceGradient` — gradient
- `pattern` — pattern
- `backgroundImageUrl` — text
- `pointerAccent` — pointer accent
- `overlay` — overlay
- `boxShadow` — shadow
- `border` — border
- `borderLeft` — border
- `backdropBlurPx` — number, at least 0
- `filter` — filter
- `blendMode` — blend mode

### text axes

- `color` — color
- `fontFamily` — text
- `fontSizePx` — number
- `fontWeight` — number
- `lineHeightPx` — number
- `letterSpacingPx` — number
- `textAlign` — `left` | `center` | `right` | `justify`
- `textTransform` — `none` | `uppercase` | `lowercase` | `capitalize`
- `fontStyle` — `normal` | `italic`
- `nowrapFromPx` — number, at least 0. The viewport width at and above which this run is **unbreakable**, because the reference set it on a single line at every captured width from here up.
- `gradientFill` — gradient. Text-fill gradient (a `background-clip: text` paint) — replaces the flat `color`.
- `textDecoration` — `none` | `underline` | `line-through` | `overline`. Painted decoration line (underline / strike / overline).
- `textShadow` — shadow. A glow / drop shadow on the glyphs.
- `fontVariantCaps` — `normal` | `small-caps` | `all-small-caps`. Small-caps rendering.
- `listMarker` — `none` | `disc` | `circle` | `square` | `decimal` | `decimal-leading-zero` | `lower-alpha` | `upper-alpha` | `lower-roman` | `upper-roman`. A painted list marker (a bullet / number the eye reads but no text node holds).
- `surfaceFill` — color. The painted fill behind the node's content.
- `borderRadiusPx` — number, at least 0. Corner rounding.
- `opacity` — number, 0–1
- `surfaceGradient` — gradient. A gradient panel fill (a `background-image` gradient over the surface).
- `pattern` — pattern. A repeating texture (dot-grid / hairline grid / rules) over the fill.
- `backgroundImageUrl` — text. A background image (scheme-checked by the envelope, like `image.src`).
- `pointerAccent` — pointer accent. The node's texture (its `pattern`, else its `backgroundImageUrl`) redrawn in a second colour inside a rough region tracking the pointer.
- `overlay` — overlay. A full-bleed translucent scrim painted over the background (hero overlay).
- `boxShadow` — shadow. A drop shadow cast by the node.
- `border` — border. A painted border (uniform, all four sides).
- `borderLeft` — border. A coloured left-accent border (a card's orange/blue rule), distinct from the uniform `border`: a card frequently carries only a thick `border-left` as its accent, and drawing that as a full box outline is the wrong look.
- `backdropBlurPx` — number, at least 0. Frosted-glass blur of whatever sits behind the node (backdrop-filter).
- `filter` — filter. The node's OWN paint, colour-adjusted (CSS `filter`).
- `blendMode` — blend mode. How the node composites with what is behind it.

### text responsive

- `fontSizePx` — scalar track
- `lineHeightPx` — scalar track
- `letterSpacingPx` — scalar track

### text run

- `text` — text; required. VERBATIM, including the spaces that separate this run from its neighbours.
- `axes` — text run axes

### text run axes

- `color` — color. The run's own fill — a literal or a palette reference, like any colour.
- `sizeScale` — number, at least 0. Multiplier on the node's own size, emitted as `em`.
- `fontWeight` — number
- `fontStyle` — `normal` | `italic`
- `baselineShiftEm` — number. Baseline shift in `em` of the RUN's own size — positive raises.

### transform

- `translateXPct` — number. Static X offset as a share of the node's own width (CSS `translate` semantics).
- `translateYPct` — number. Static Y offset as a share of the node's own height.
- `translateXPx` — number. Static X offset in absolute px; composes with `translateXPct`.
- `translateYPx` — number. Static Y offset in absolute px; composes with `translateYPct`.
- `rotateDeg` — number
- `scale` — number, at least 0

### transition

- `durationMs` — number, at least 0; required
- `easing` — easing

### viewport response

- `yFactor` — number, -10–10
- `heightFactor` — number, -10–10

### visibility

- `fromPx` — number, at least 0
- `untilPx` — number, at least 0

## The limits every page is held to

A page outside these is refused whole; nothing is clamped silently.

The bounds:

- `maxDepth` — 32. Max element tree depth (root = depth 1).
- `maxNodes` — 2000. Max total node count in a document.
- `fontSizePx` — 1–400. Font size must render legibly and not blow out layout.
- `fontWeight` — 1–1000. CSS font-weight range.
- `geometryPx` — -100000–100000. Absolute geometry coordinate/extent bounds (band coordinates, px).
- `lengthPx` — -10000–100000. Line-height / letter-spacing / radius / gap sane ceilings.
- `effectPx` — -10000–10000
- `transformScale` — 0.01–100
- `rotateDeg` — -3600–3600
- `translatePct` — -1000–1000. A static translate as a share of the node's own box.
- `paddingPx` — 0–10000. Per-side box-model padding (px); non-negative, bounded so it can't blow out layout.
- `transitionMs` — 0–10000. Interaction transition duration; bounded so a state change can't stall for minutes.
- `focusRingPx` — 1–100. Focus-ring width; the floor is 1 so a ring can never be authored away.
- `patternSpacingPx` — 1–1000. A pattern's tile period.
- `patternThicknessPx` — 0–1000. A pattern's line width / dot diameter, bounded like any effect length.
- `pointerAccentRadiusPx` — 8–1000. How far a pointer accent reaches from the cursor.
- `filterAmount` — 0–4. The multiplier a colour-adjustment function may carry (`saturate` / `brightness` / `contrast`).
- `runSizeScale` — 0.1–8. How far one run may scale away from the size its node declares.
- `runBaselineShiftEm` — -10–10. The baseline lift a run may take, in `em` of its own size.

The rules that are not numbers — each one refuses a page as whole as a bound does:

- The viewport ladder is an ordered set, so a document's `widths` ascend strictly and repeat nothing.
- A responsive track is read left to right across the ladder, so its keyframes ascend strictly by `at`.
- A keyframe is a value AT a declared viewport, so its `at` must be one of the document's own widths and not an arbitrary number.
- A colour that names a palette entry must name one the palette declares, because a reference that resolves to nothing has no render-time fallback to fall back to.
- A column anchor is meaningless without the column it is measured against, so a document that uses one must declare a `column`.
- An in-flow track's `x` is a leading offset from the flow cursor and a column anchor is an absolute origin, so the two cannot both govern the same axis.
- An in-flow track takes its vertical position from the flow, so a `yFactor` response against the viewport height has nothing to apply to.
- A node `id` becomes a real DOM id, so it must be unique across the page: a duplicate breaks `#anchor` navigation and the `for`/`id` association a control's accessible name is built from.
- Every URL a page paints from must be a served asset or an http(s) address, because the value is emitted into markup and into a stylesheet where a smuggled scheme would be live.
- A painted font family must resolve to a face the page serves — `use_font` serves one from the platform's font library — or name a generic every browser has, or it silently paints the browser default rather than anything chosen.
- An asset a page references must be one the site actually holds, or the page renders a broken image and says nothing about why.
- A node presented as an overlay must declare an `id`, because the id is the only thing an action can name and a panel nothing can open is a panel nobody sees.
- An action names exactly one verb: naming both is a toggle the shape cannot mean, and naming neither is inert markup wearing a control's semantics.
- What an action names must exist and must itself carry `dialog`, because opening something that is not an overlay is a no-op the author never sees.
- A node either navigates somewhere or acts on this page, so `link` and `action` cannot both be present: which one wins would be a property of the renderer rather than of the document.
