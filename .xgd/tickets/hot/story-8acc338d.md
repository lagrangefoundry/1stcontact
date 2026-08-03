---
uid: story-8acc338d
id: STORY-84
type: story
title: Fold a multi-viewport capture into one L1 reproduction document with advisory
  structural hints
created_by: xgd
created_at: '2026-07-22T19:41:46.012167+00:00'
updated_at: '2026-08-03T00:59:50.603120+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-2049c9ec
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
  updated_by:
  - bundle-cceaba25
  - bundle-4ff83a8b
---

## Story
**As a** site reproducer, **I want** capturing a page to fold its multi-viewport
sample ladder into one renderable L1 reproduction document in the *full* L1
language — text, media, the section-band → card → chip surface hierarchy the
capture composited onto its runs, section imagery and veils, and the page band —
plus advisory structural hints, while keeping the raw ladder as an acceptance
oracle and signalling anything it still cannot express, **so that** reproducing a
captured site becomes near-mechanical — capture, fold, render, gate — and whatever
the folder still lacks is named rather than lost.

## Description
`1c capture page <url>` samples a page across a fixed width ladder (the retained
multi-state oracle). This capability adds a *fold* over that ladder: every node is
matched across the sampled widths and emitted as a single L1 document — an
**absolute-base** reproduction where each node carries its authored axes, a
geometry keyframe per sampled width, per-segment `interpolate|snap` transition
flags, and a visibility rule derived from the widths it is present at. The raw
ladder is retained unchanged as the acceptance oracle the fold is gated against.

The fold emits the **full language**, not text alone:
- a **text** leaf for a styled run, carrying the typography axes plus the text
  pixel-mover families the language expresses (gradient fill, decoration,
  small-caps, list marker, text shadow);
- an **image** leaf for a text-free media element, carrying its resolved source
  and alternative text (captured onto the media field and carried through the
  manifest), a height-bearing geometry track and its image axes;
- a **box** leaf for a text-free element that paints a standalone surface;
- **reconstructed run surfaces**: the capture composites a section/card/chip fill
  *onto* each run rather than emitting a standalone box, so the fold rebuilds the
  three-level hierarchy it came from (see below);
- **section imagery and veils**: a section's CSS background image and its
  translucent scrim fold to a box painted beneath the content;
- a **font resource table** binding each painted family handle to its served
  substance, populated only with the families a folded text leaf actually paints.

**Surface reconstruction is a hierarchy, measured not inferred.** Full-width
runs carrying no card treatment — and full-bleed *bars* whose narrow runs are
distributed edge-to-edge across the content width with a dominant gap between them
(a footer or nav strip) — seed **section bands**, which tile full-bleed at every
width, with their tops snapped up to the captured section edge that opens them and
their bottoms clamped down to the first captured section edge past their own
content, never crossing the neighbouring band's content. An evenly-tiled card grid
is deliberately *not* a bar and stays cards. A run whose surface differs from its
band folds into a **card** that adopts the captured surface-bearing element's own
rect and corner radius verbatim — that rect is also the card's grouping identity,
so sibling tiles can neither merge nor drift — while a surface as wide as the
viewport is refused as a card because it is the band; where the capture resolved no
surface shape a card is exactly its runs' union and no padding is invented. A run
whose *own* element paints the surface — a saturated pill, or a control carrying an
authored vertical inset — folds as a **chip**: the fill, radius, shadow and border
ride on the text leaf itself and it contributes no card row, so a pill is never
duplicated by a box behind it. An accent rule is drawn on the captured bearing
element's rect, not on the run that wrapper insets.

Anything the fold still cannot express is **signalled, not dropped**: each such
element becomes a typed residual naming its kind, the reason, the painted axes it
carried and the widths it appeared at, so a folder-power gap reads as a framework
gap instead of vanishing. Captured form controls are not residuals: they cluster
into the forms they visibly belong to and fold to behaviour seams (page
composition), leaving a residual only where a control has no geometry to mount at.

A separate **advisory structural-hint** pass emits a sidecar describing the CSS
*relationships* the painted-geometry fold deliberately omits — parent computed
layout, authored sizing units, position mode, ancestry, sibling repetition, and
the page's real `@media` breakpoints. Hints are read for DIRECTION (which
structure an AI may later recover over the absolute base), never for EXECUTION:
nothing in the render/reproduction path consumes them, and the folded L1 document
renders as a complete reproduction on its own.

**In scope:** the fold to one L1 document in the full language (text, image, box,
the section-band → card → chip surface hierarchy, section background images and
scrims, page band, font table), oracle retention, geometry keyframes +
interpolate/snap classification + visibility rules, the typed residual signal for
unexpressed elements, the advisory hint sidecar, and supersession of the pre-L1
`adopt-values` reproduction command.

**Out of scope:** the L1 typed tree / envelope / renderer themselves, including the
axis vocabulary (`borderLeft`, the text self-surface, `overlay`, padding) and the
resource-table form (owned by the L1 Layout Substrate capability); binding and
validating a behavior-module instance against a slot seam, and mounting it at
render (owned by the page-composition capability — this story owns only the fold to
the seam); the end-to-end reproduction acceptance gate, its fidelity pairing of
non-text leaves, and structure recovery (owned by the 3-Probe Reproduction Gate
story); how the gate presents the residual channel; the values-diff axis coverage.

## Technical Context
- Builds on the L1 Layout Substrate (CAP-70, plan item 1): the fold emits a typed
  L1 document validated by the L1 envelope; an invalid fold is rejected.
- Reuses the existing responsive-diff node alignment to match nodes across widths.
- Absolute-base form (REQ-79 D1): leaves are absolutely placed by per-width
  keyframes with empty structure primitives — always a valid layout, zero
  structural inference. Structure recovery is a later, optional overlay.
- Box and image leaves pin all four sides (height included) because their extent is
  not derivable from content; a text leaf's height stays natural from flow, so its
  keyframes omit height.
- The residual signal is an **opt-in channel**: a caller that asks for residuals
  receives one per unexpressed element; a caller that does not still gets the same
  reproduction document, and the elements are dropped without a signal. This kept
  the fold's published return shape unchanged.
- Geometry-affecting axes (transform / mask) are deliberately **not** folded: the
  captured box is post-transform, so folding them would double-apply against the
  geometry the fold already pins. Paint-only treatments (text shadow) are
  idempotency-safe and are folded.
- The hint pass runs as a separate capture read from the values extraction, so the
  values pipeline is untouched; hints are advisory-only by construction.
- Supersedes the pre-L1 `adopt-values` command (REQ-66), a vestige of the
  old-model reproduction path; the independent `adopt-gaps` (REQ-74) feature is
  left untouched.
- The earlier "text leaves only" divergence is closed: text-free media, painted
  surfaces and the page band now fold; only unclassifiable text-free elements,
  source-less media, geometry-less runs and empty runs remain residuals by design.
- The tree stays **flat** — surfaces are siblings of the runs they sit behind, not
  their ancestors. Nesting card runs under their card box was scoped and
  deliberately not taken: a pinned parent is a CSS containing block, so the gate's
  analytic layout evaluation would have to offset pinned children by their pinned
  ancestor's origin or diverge silently from the renderer. The consequence is
  recorded as a known, non-pixel diagnostic artifact: a re-capture of the
  reproduction attributes an ancestor-walked treatment (`borderLeft`,
  `surfaceGradient`) to nothing, because the painting box is a sibling. No pixel
  differs; the remedy chosen was to resolve attribution geometrically on the
  comparison side (values-diff story), not to nest the fold.
- Paint order within the document is: full-bleed section bands, then the
  section-image/scrim boxes, then cards (largest first, so a contained badge lands
  on top), then the content leaves, then the behaviour seams.
- `cardPadding` / `cardOutset` — the inferred, single-scalar padding estimate — are
  deleted rather than corrected. The estimate was symmetric and derived from the
  widest sample's row height, which doubled every single-run control's height at
  every width; the captured surface rect replaces it outright. Nothing in the fold
  now outsets a box by padding its source box already includes.
- The scrim's colour carries its own alpha; the captured value has a bounded
  wide-gamut serialization residual (≤1 level per channel on `color-mix(in oklab)`)
  that is invisible at the authored opacity and self-cancelling across both sides of
  a values-diff, so it is accepted rather than chased here.

## Dependencies
Plan item 1 — L1 Layout Substrate + Safety Envelope (CAP-70), whose axis vocabulary
(`borderLeft`, text self-surface, `overlay`) and document-level font resource table
this fold populates; and the capture recording contract, whose surface shapes,
accent bearer rects and section boxes this reconstruction reads as measured fact.

## Story Points
3