---
uid: story-8acc338d
id: STORY-84
type: story
title: Fold a multi-viewport capture into one L1 reproduction document with advisory
  structural hints
created_by: xgd
created_at: '2026-07-22T19:41:46.012167+00:00'
updated_at: '2026-08-12T21:49:32.747427+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-2049c9ec
  story_kind: upgrade
  story_points: 3
  uat_coverage: fail
  updated_by:
  - bundle-ee56a66e
  - request-8a132869
---

## Story
**As a** site reproducer, **I want** capturing a page to fold its multi-viewport
sample ladder into one renderable L1 reproduction document in the *full* L1
language — text, media, painted surfaces, backdrops, the page band and the
behaviour seams with their controls — plus advisory structural hints, while
keeping the raw ladder as an acceptance oracle, letting me re-fold offline
against it, and signalling anything it still cannot express, **so that**
reproducing a captured site becomes near-mechanical — capture, fold, render,
gate — and whatever the folder still lacks is named rather than lost.

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
  manifest), a height-bearing geometry track and its image axes — including how
  the picture is *seen*: which part of itself its box shows, and the colour
  adjustment painted over it;
- a **box** leaf for a text-free element that paints a standalone surface,
  carrying the surface's own colour adjustment alongside the fill, border,
  shadow and backdrop blur it already folded;
- a **backdrop** box leaf for a captured element that paints *behind* content — a
  background photograph at any depth, or a full-bleed opaque panel fill. A
  backdrop is placed in the document's **background layer**, behind the runs of
  the band it sits under, rather than in document order (which would paint a hero
  photograph over the hero's own headline). Its edges join the section-edge set
  that bounds how far a reconstructed band may tile, and its fill counts toward
  the page-base inference — on a page whose panels are all nested, the measured
  backdrops are the only direct evidence of what the page is mostly painted in;
- **reconstructed run surfaces**: the capture composites a card/panel/section fill
  *onto* each run rather than emitting a standalone box, so the fold recovers it —
  the solid fill the most runs sit on becomes the document background band, and
  every run whose surface differs from the band (or carries a gradient the body
  cannot paint) gets a backing box emitted before the content so each leaf paints
  over its own surface;
- a **font resource table** binding each painted family handle to its served
  substance, populated only with the families a folded text leaf actually paints.

**How a measured value becomes a typed axis.** Folding is not transcription: a
computed CSS string is admitted only on terms that keep the folded definition
honest and small. **The browser's own default is not worth carrying** — a value
the browser would paint anyway (a picture centred in its own box, no colour
adjustment at all, an adjustment function sitting at the value that changes
nothing) folds to nothing rather than being recorded, because a definition that
wrote it in would grow on every page with declarations that cost a composite
layer and move no pixel. **The value that changes nothing differs per adjustment**
— full desaturation and no desaturation are opposite ends of two differently
oriented scales, so the skip rule is per-function rather than one constant; a
single rule would silently fold a fully desaturated photograph to no adjustment
at all and reproduce it in full colour. **The same value spelled two ways folds
the same** — a ratio written as a percentage and as a decimal are one filter, and
which spelling a browser reports is not something the reproduction should depend
on. **An unreadable form is a gap, never a guess** — a form the fold cannot parse
(a keyword or length pair where it expects percentages) writes no axis, so the
definition never states a framing the page did not, and the difference stays
visible to the comparison that gates a reproduction instead of being closed with
an invented number. **A value past the envelope is carried at the nearest
expressible one**, because a real treatment the target paints reproduces better
near-missed than absent — while a value that is not a treatment at all (a
negative amount) is skipped.

**Behaviour seams and their controls.** A captured form control belongs to a
behavior module, so the fold never synthesizes a raw `<input>`. Each cluster of
captured controls becomes one **slot** node pinned at the cluster's union rect per
width — the seam the module mounts at — and every control in it folds to a
**control** leaf naming the module-declared element it binds, carrying the paint
the capture measured and a geometry track **rebased from the page origin to the
seam**. The reference's own field heights and its submit button's per-width
position therefore survive the fold instead of being replaced by module defaults.
A control with no geometry at any sampled width has nothing to mount at and stays
a residual.

Anything the fold still cannot express is **signalled, not dropped**: each such
element becomes a typed residual naming its kind, the reason, the painted axes it
carried and the widths it appeared at, so a folder-power gap reads as a framework
gap instead of vanishing.

Because the folded document and its forms are a pure function of the retained
oracle and the *current* fold, the capability also exposes an **offline re-fold**:
re-deriving both from a bundle's own retained ladder, rewriting only what the fold
produced and leaving the oracle, screenshots, mirrored assets and hints untouched,
so a fold change can be picked up without re-hitting the captured origin (which
would re-roll the reference in the same step).

A separate **advisory structural-hint** pass emits a sidecar describing the CSS
*relationships* the painted-geometry fold deliberately omits — parent computed
layout, authored sizing units, position mode, ancestry, sibling repetition, and
the page's real `@media` breakpoints. Hints are read for DIRECTION (which
structure an AI may later recover over the absolute base), never for EXECUTION:
nothing in the render/reproduction path consumes them, and the folded L1 document
renders as a complete reproduction on its own.

**In scope:** the fold to one L1 document in the full language (text, image, box,
backdrops in the background layer, reconstructed surfaces, page band, behaviour
seams with rebased control leaves, font table), the framing and colour-adjustment
axes a captured picture or surface carries, oracle retention, the offline re-fold,
geometry keyframes + interpolate/snap classification + visibility rules, the typed
residual signal for unexpressed elements, the advisory hint sidecar, and
supersession of the pre-L1 `adopt-values` reproduction command.

**Out of scope:** the L1 typed tree / envelope / renderer themselves, including the
axis vocabulary these folded values land in, the `control` node kind and its
emitter, and the resource-table form (owned by the L1 Layout Substrate capability);
what a behavior module declares and how it wires a bound control (owned by the
behavior-module contract); the capture-side rules that decide a band's extent and
index the backdrops, and the values-diff axis coverage (owned by the values-diff
fidelity capability); the editor surface that writes the same framing parameters by
hand (owned by the structured copy-editing capability); the end-to-end reproduction
acceptance gate, its fidelity pairing of non-text leaves, and structure recovery
(owned by the 3-Probe Reproduction Gate story); how the gate presents the residual
channel.

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
- A backdrop is recognised from the folded geometry rather than from a capture-side
  flag: a painted background image always is one, and a solid fill is one when it
  spans the viewport. Backdrops are ordered after the section-background boxes they
  are a peer of, because a nested backdrop sits inside the section it overlays.
- Rebasing a control to its seam changes only the ORIGIN of its geometry, never the
  measured box: the seam's own rect is the union of the cluster (widened to hold a
  claimed submit button), and each control's keyframe is its captured box minus the
  seam's at the same width. A submit button is matched to its form geometrically,
  since the capture reads painted boxes rather than `<form>` boundaries.
- The residual signal is an **opt-in channel**: a caller that asks for residuals
  receives one per unexpressed element; a caller that does not still gets the same
  reproduction document, and the elements are dropped without a signal. This kept
  the fold's published return shape unchanged.
- The residual channel is per **element**. An unreadable *value* on an element the
  fold can otherwise express is not a residual — the leaf is still emitted, minus
  the axis. The gap stays findable because both framing values are axes the
  reproduction comparison already checks: an unfolded one reports as a difference
  rather than being silently closed with a guess. This is the value-level analogue
  of the element-level promise, reported through the comparison instead of the
  residual list.
- REQ-136 — the framing pair (which part of a picture its box shows) and the
  colour-adjustment stack were both read by the capture all along and dropped by
  the fold, because the substrate had nowhere to put them. The adjustment was
  already a compared axis, so before this every target that painted one reported a
  difference that no fold could close. Only the percentage-pair form of the framing
  value is read; keyword and length forms are left unfolded.
- The clamp ceilings the fold applies are the envelope's own (the adjustment
  amount, the rotation range for a hue shift, the effect-length range for a blur),
  so a clamped fold always validates.
- A shadow written as an adjustment function is deliberately NOT read: the
  substrate already carries a typed shadow, and folding it here would give it two
  ways to say one thing — the legacy-mode state the project forbids. It stays
  unfolded until it has one home.
- Geometry-affecting axes (transform / mask) are deliberately **not** folded: the
  captured box is post-transform, so folding them would double-apply against the
  geometry the fold already pins. Paint-only treatments (text shadow, the colour
  adjustment) and pure framing (which part of a picture its box shows, which does
  not move the box) are idempotency-safe and are folded.
- The re-fold is a *derivation* refresh: a bundle with no retained ladder has no
  oracle to re-fold and is rejected with a re-capture instruction rather than
  silently producing a document from nothing.
- The hint pass runs as a separate capture read from the values extraction, so the
  values pipeline is untouched; hints are advisory-only by construction.
- Supersedes the pre-L1 `adopt-values` command (REQ-66), a vestige of the
  old-model reproduction path; the independent `adopt-gaps` (REQ-74) feature is
  left untouched.
- The earlier "text leaves only" divergence is closed: text-free media, painted
  surfaces, backdrops, the page band and the controls of a behaviour seam now fold;
  only unclassifiable text-free elements and geometry-less elements remain
  residuals by design.

## Dependencies
Plan item 1 — L1 Layout Substrate + Safety Envelope (CAP-70), whose axis vocabulary,
`control` node kind and document-level font resource table this fold populates.

## Story Points
3