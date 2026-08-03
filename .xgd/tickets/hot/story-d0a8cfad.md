---
uid: story-d0a8cfad
id: STORY-83
type: story
title: L1 layout substrate rendered safe by construction
created_by: xgd
created_at: '2026-07-22T19:31:28.526898+00:00'
updated_at: '2026-08-03T01:31:39.428500+00:00'
completed_at: null
last_field_updated: story_kind
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-ae9d65d6
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by: bundle-cceaba25
---

## Story
**As a** site owner, **I want** my site's layout defined as validated structured
data that only ever reaches the browser through a single safe emitter, **so
that** my published site is faithful to its intended design, renders equivalently
across every browser, and can never be broken or hijacked by malformed or
malicious content.

## Description
This story documents the **L1 layout substrate** — the one low-level,
CSS-faithful layout representation introduced by the framework pivot (REQ-79) to
replace the former semantic layout modules. A site's layout is a typed element
tree: `box`, `text`, `image`, and `slot` leaves plus `stack | row | grid`
containers. Each leaf carries a subset of the captured style axes (colour,
font family/size/weight, line-height, letter-spacing, alignment, transform,
style; surface fill, radius, opacity; object-fit) as **typed literals or closed
enums** — never a freeform CSS/HTML/JS string. Responsive layout is expressed as
**per-viewport geometry keyframes** with a per-segment `interpolate | snap`
flag; per-axis sizing (`fixed | fluid | hug`), distribution, alignment, and
viewport-range visibility are the structure primitives that capture leaves empty
and an author recovers. The `slot` leaf is the Phase-D seam: it carries a
required name and an optional **`behavior`** field naming the behavior module
intended to mount there.

### Language power — a typed axis for every pixel-mover
The axis vocabulary has grown to cover every captured **pixel-mover** the
substrate previously had no way to express (the DOC-27 rule: an axis earns its
place iff it moves a pixel). Beyond the original scalars, a document may carry:

| Target | Axes |
|---|---|
| **text** | gradient fill (glyphs painted by a text-clipped gradient), decoration line, glyph shadow, small-caps, list marker; a **self-painted surface** (fill, radius, shadow, border) for a run whose own element is a chip/pill; an **unbreakable-from width** |
| **box** | surface gradient, background image (scheme-checked), translucent scrim overlay, border, **left accent rule**, drop shadow, backdrop blur, blend mode |
| **image** | blend mode, border, drop shadow |
| **any node** | transform (rotation + uniform scale), mask (circular / elliptical crop, feathered edge), **per-side padding** |
| **document** | resource table (handle→substance), **centred content column** |

Each non-scalar family is carried as a **typed structured form** — a gradient is
an angle plus hex stops; a shadow is offsets/blur/spread/hex colour/inset; a
border is width/hex colour/line style; a mask is a named shape plus a feather
width; a transform is rotation and scale; a scrim is a hex colour plus opacity;
padding is four non-negative per-side lengths. The renderer re-derives the CSS
from those numeric, enum, and hex fields, so a structured axis is never a
passthrough style string, and an identity or no-op value (unit transform,
`normal` blend, `none` decoration/marker) is omitted rather than emitted. A box's
scrim, gradient, and background image composite as ordered background layers over
the solid fill.

Three of these families exist because a *real* captured page could not otherwise
be stated, and each was added **in L1 as a typed primitive** rather than as a
raw-CSS hole or a bespoke module:
- **Padding** is a per-side inset applied *inside* the pinned keyframe box. The
  document reset sets `box-sizing: border-box`, so padding gives a pill badge its
  shape and a control its click-target height without inflating the geometry the
  document already pins — the axis is round-trip-safe by construction.
- **A left accent rule** (`borderLeft`) is a distinct axis from the uniform
  border: a card that carries only a thick coloured rule at its left edge is a
  common design, and drawing it as a full outline is the wrong look.
- **A text leaf's self-painted surface** exists because the DOM routinely fuses
  "a styled run" and "a painted surface" into one element (a `rounded-full`
  badge). Forcing them into disjoint `text` / `box` leaves lost the pill; a text
  leaf may now paint its own fill, radius, shadow and border, bounded exactly as
  the box axes are. A glyph gradient still wins the background-image slot, since a
  run never carries both in practice.

### Language power — responsiveness beyond geometry
Geometry is not the only property that varies with viewport width, and width is
not the only viewport axis. Three further families make the substrate express a
real page's responsive rules rather than approximate them:

- **Per-width scalar tracks.** A numeric type axis (`fontSizePx`,
  `lineHeightPx`, `letterSpacingPx`) and each padding side may carry a track of
  keyframes at declared ladder widths with the same per-segment
  `interpolate | snap` flag geometry uses. A track owns its axis at render time
  (base rule at the smallest keyframe, media-queried overrides above); an axis
  that does not vary stays a plain scalar rather than being bloated into a track.
- **Viewport-height response.** `geometry.viewportResponse` states how a node's
  `y` and `height` track the viewport *height* — the axis a width ladder cannot
  see at all. It is a **derivative**, not an absolute, because a `100vh` hero is
  never a local fact: the hero grows and every node below it is pushed down by the
  same amount, so `{heightFactor: 1}` on the hero and `{yFactor: 1}` below it say
  the same thing in the same units. Each factor is applied against its own
  keyframe's captured viewport height, so a keyframe still evaluates to exactly
  its captured pixels at the size it was captured at.
- **A centred content column.** `mx-auto max-w-*` is flat while the viewport is
  narrower than the container and then rises at half rate; a keyframe track
  interpolated across that knee is wrong everywhere between the samples and
  frozen above the widest. The document declares one shared `column`
  (container / inset / optional max width) and a node's `geometry.anchor` places
  it against that column in closed form. `x` and `width` are independent — a node
  whose left edge follows the column must be able to say so even when its width is
  its own business — and each is present only when it reproduces the samples. A
  term may be **capped** (`min(maxPx, px + fraction * extent)`, a nested
  `max-w-*`) and its constant may itself be a per-width track for a node whose
  layout mode changes across the ladder. An anchor without a declared column is
  rejected rather than silently falling back to keyframes.

### Language form — handles bound to substance
L1 also carries a **document-level resource table** that closes the *form* hole
in the language: a leaf's `fontFamily` axis is only a **handle** (a name), and
without something binding it to the **substance** that determines its glyphs —
a served font asset — a named face paints as a generic serif fallback. The table
binds `family → served src` (with optional weight and style), and the renderer
emits one `@font-face` rule per entry through the same sole safe sink, ahead of
the rules that reference the family. Images need no entry: an image leaf already
carries its own source.

### The safety envelope
The substrate's value is a **safety envelope by construction** — security,
robustness, and cross-browser fidelity, not aesthetic constraint. Two layers
enforce it:
- an **envelope validator** that accepts only documents whose axes are typed and
  in-range, whose objects carry no unknown keys, whose colours are hex, whose
  image sources pass a URL-scheme allowlist, and whose tree respects depth and
  node-count caps; and
- a **single safe renderer** — the only path from an L1 tree to HTML/CSS — that
  re-checks and neutralises every value at emit time (escaped text, re-validated
  hex colours, sanitised font-family, numeric lengths, unsafe image sources
  dropped) and compiles geometry keyframes to media-queried CSS.

Both layers grew with the vocabulary rather than beside it: the envelope bounds
the structured effect lengths and the transform scale, requires hex stops and
border colours, runs a box background image **and every font-face source**
through the same URL allowlist as an image source, bounds a declared font
weight to the CSS range, holds padding non-negative and capped, requires every
track keyframe to sit at a declared ladder width in strictly ascending order with
its value inside its own axis's range, refuses a height response whose keyframes
carry no captured height to measure from, refuses a column anchor with no column,
and — because every structured form is closed — refuses an unknown key rather
than ignoring it. The renderer drops a non-hex colour, an off-allowlist URL, and
an unsanitisable font name instead of emitting them, so no raw CSS escapes the
sink through any of the new families.

A **round-trip identity gate** wired to the existing capture/values-diff spine
measures `capture(render(L1)) ≈ L1` on the authored (literal) axes, and a
cross-browser check confirms equivalent layout across the three engines.

**In scope**: the typed L1 shape (including the grown axis vocabulary, the
per-width scalar tracks, the viewport-height response, the document column and
per-node anchor, and the document resource table), the envelope validator, the
safe renderer (including geometry-keyframe and track compilation, closed-form
anchor emission, and `@font-face` emission), and the round-trip / cross-browser
fidelity guarantees.

**Out of scope**: mechanically folding a multi-viewport capture into an L1
document — including *fitting* the responsive tracks, the viewport-height
response, and the column from a capture, and populating the axes and resource
table (REQ-83 / REQ-92 / REQ-88, separate stories) — the page-level composition
that **binds** a behavior-module instance to a named slot and validates that
binding (REQ-93, a separate story), the behavior modules themselves (REQ-85), and
the end-to-end 3-probe reproduction gate (REQ-86). At this story's boundary a
`slot` is a positioned, labelled seam: it renders as an inert placeholder carrying
its slot name and, when declared, its target behavior-module id; when the page
layer supplies an already-rendered module fragment for that seam, the emitter
places that fragment inside the same positioned box rather than the placeholder's
empty content. Deciding *whether* a fragment may be supplied — and rejecting an
unbound, dangling, doubly-bound or ambiguous binding — belongs to the page-level
story, not here.

## Technical Context
- L1 is the substrate on which the platform's structured-only security boundary
  rests (Security Policy §1–2, DOC-2/DOC-7): the validator is the schema+envelope
  layer and the renderer is the sole emitter (defence in depth).
- The absolute-or-overlay value affordance, per-viewport variation, and module
  reproduction treatments formerly delivered by layout-module dials are re-homed
  in L1 leaf axes and geometry keyframes — tracked as supersessions in the
  STORY-80 / STORY-81 / STORY-82 upgrades in this same reconciliation.
- The round-trip gate reuses the capture + values-diff pipeline (CAP-63); this
  story adds the L1 render→capture wiring, not new diff axes.
- The implementation matches the intent closely; no divergence between the
  REQ-82 spec and the code was found. Browser-dependent acceptance (round-trip,
  cross-browser) is proven with a real engine and skips cleanly where engines
  are unavailable, while the validator/emitter behaviours are engine-free.
- **REQ-87 slot-seam rename.** The slot leaf's optional module-id field was
  named `capability` until REQ-87 renamed the runtime module type to *behavior
  module*, freeing "capability" to mean only the XGD capability matrix. The
  field is now `behavior` and the emitted attribute is `data-l1-behavior`. The
  operator decided this explicitly (REQ-87 dialogue: pre-launch, no live site
  data, keeps the L1 schema consistent with the renamed type), and REQ-87
  forbids a back-compat alias. Because the slot object is `.strict()`, the
  consequence is stronger than a deprecation: a document authored with the
  legacy key is now *rejected* by the envelope as an unknown key — recorded in
  AC-686. Nothing about the typed-tree, envelope, round-trip, or cross-browser
  obligations changed; only the field's name.
- AC-723 pins the emitted `data-l1-slot` and `data-l1-behavior` attributes as an
  obligation of the L1 emitter itself, asserted directly by this story's
  reconciliation UATs rather than left to the incidental coverage they had in the
  CAP-72 / generate tests.
- **REQ-91 / REQ-90 — language power and form.** The two extensions were
  deliberately sequenced *before* the folder rebuild (REQ-88's "language first,
  then rebuild the folder once"): the folder is only worth rebuilding against a
  completed language. Both were **co-designed against real captures** rather than
  invented — the gigabytealchemy gold→orange wordmark gradient, its `#00d492`
  accent bar and panel gradient, a joyful drop shadow, a faelan hero scrim, and a
  joyful Oswald webfont were folded through the new axes as the design check and
  reused verbatim as test fixtures.
- **BUG-14 / BUG-17 / BUG-18 / BUG-20 / REQ-88 — the axes a real page demanded.**
  The second wave of vocabulary came from reproducing gigabytealchemy.ai and
  attributing each visible defect to a layer. Where the defect was "the language
  cannot state this", the fix was a typed primitive in L1: a left accent rule
  (BUG-14), per-side padding (BUG-17), per-width type tracks (BUG-18), a text
  leaf's own chip surface (BUG-20), and — in REQ-88 rounds 6 and 8 — an
  unbreakable-from width, a viewport-height response, per-width padding tracks,
  and the document column with a per-node anchor. This is the DOC-7 §6.3 rule in
  practice: no passthrough style string was opened, and no bespoke module was
  added.
- **`nowrapFromPx` is a width, not a flag, and that distinction is the fix.** A
  fold turns a flowed run into a fixed-width absolutely-positioned box, which
  re-opens a line-breaking decision the reference had already closed; the box's
  slack over its own glyphs is a fraction of a pixel, and engines measure glyphs
  differently (Gecko wrapped eight runs Chromium did not, overprinting the run
  below by up to 42px). A boolean could only be set for runs that never wrap at
  *any* width, which excludes precisely the runs that broke — the same checklist
  item is one line on desktop and three at 320px. Rounding the box up bought a
  fraction of a pixel and left the outcome to luck; stating the width restates
  the reference's own line count, so no engine gets a vote.
- **Anchoring is per axis, and coupling it was worse than not anchoring.** The
  anchor first required *both* `x` and `width` to fit before anchoring either. On
  the reference hero exactly one line's width equalled the column extent, so that
  line followed the column while its three neighbours kept absolute keyframes —
  a 31px split at 1150px in text the reference keeps flush. Alignment is a shared
  property; width is a private one.
- **A renderer bug found the same way: `left: max(…) + 24px` is not a legal bare
  CSS value.** The declaration was dropped by the browser and every anchored node
  slammed to `x = 0`. Compound anchor expressions are now always wrapped in
  `calc()`. This is why the anchor family's acceptance is stated over the
  *rendered position at real widths*, not over the presence of a declaration.
- **The height response and the accent bearer need a re-capture to take effect.**
  Both are capture-side facts (a second-height probe viewport; the bearing
  element's rect) absent from bundles captured before REQ-88 round 6. The
  language accepts and emits them regardless; against an older bundle the fold
  simply emits nothing rather than guessing a height response from a
  width correlation.
- **Where the new capability stops at this story's boundary.** Populating the new
  axes, tracks, response and column *from a capture* is the folder's job and is
  documented on the capture→L1 fold story, not here. This story's obligation is
  that the language accepts, bounds, and safely emits them — not that any
  particular capture produces them.
- **No raw-CSS escape hatch was added.** Every new family is a typed scalar,
  closed enum, hex colour, or closed structured object; the corresponding CSS is
  re-derived at emit time.

## Dependencies
None (this is the foundational substrate; plan items 2, 3, 4, 6, 7, 8 depend on it).

## Story Points
3

## Merged from STORY-81 (overlap cluster 2 resolution)
The reconciliation `upgrade` story STORY-81 ("Responsive dials …", CAP-68, now
archived) recorded that the former **per-breakpoint module length dials**
(`{ base, sm?, md?, lg?, xl? }`) and the header `navCollapse` dial were deleted by
the REQ-79 pivot. Their responsive-across-widths intent is re-homed here: per-viewport
variation is carried by this substrate's geometry keyframes (interpolate|snap) and,
since BUG-18 / REQ-88, by the per-width scalar and padding tracks that apply the same
model to any numeric axis. `navCollapse` was removed with no L1 successor. STORY-81's
sole AC (AC-717) was a behavioural duplicate of AC-684 and was reassigned here; the
AC-level dedup pass (per REPORT-795) has since collapsed AC-717 into AC-684 — AC-717
is archived, its provenance note folded into AC-684, and its duplicate test file
(tests/reconciliation-responsive-keyframes.test.ts) retired. That behaviour remains
covered by tests/reconciliation-l1-substrate.test.ts.
