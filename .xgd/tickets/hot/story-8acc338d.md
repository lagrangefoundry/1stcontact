---
uid: story-8acc338d
id: STORY-84
type: story
title: Fold a multi-viewport capture into one L1 reproduction document with advisory
  structural hints
created_by: xgd
created_at: '2026-07-22T19:41:46.012167+00:00'
updated_at: '2026-07-29T04:06:12.327965+00:00'
completed_at: null
last_field_updated: status
status: updated
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-2049c9ec
  story_kind: upgrade
  story_points: 3
  uat_coverage: pass
---

## Story
**As a** site reproducer, **I want** capturing a page to fold its multi-viewport
sample ladder into one renderable L1 reproduction document in the *full* L1
language — text, media, painted surfaces and the page band — plus advisory
structural hints, while keeping the raw ladder as an acceptance oracle and
signalling anything it still cannot express, **so that** reproducing a captured
site becomes near-mechanical — capture, fold, render, gate — and whatever the
folder still lacks is named rather than lost.

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
- **reconstructed run surfaces**: the capture composites a card/panel/section fill
  *onto* each run rather than emitting a standalone box, so the fold recovers it —
  the solid fill the most runs sit on becomes the document background band, and
  every run whose surface differs from the band (or carries a gradient the body
  cannot paint) gets a backing box emitted before the content so each leaf paints
  over its own surface;
- a **font resource table** binding each painted family handle to its served
  substance, populated only with the families a folded text leaf actually paints.

Anything the fold still cannot express is **signalled, not dropped**: each such
element becomes a typed residual naming its kind, the reason, the painted axes it
carried and the widths it appeared at, so a folder-power gap reads as a framework
gap instead of vanishing. A form control is always routed to a residual — it
belongs to a behavior module, never to a synthesized raw L1 leaf.

A separate **advisory structural-hint** pass emits a sidecar describing the CSS
*relationships* the painted-geometry fold deliberately omits — parent computed
layout, authored sizing units, position mode, ancestry, sibling repetition, and
the page's real `@media` breakpoints. Hints are read for DIRECTION (which
structure an AI may later recover over the absolute base), never for EXECUTION:
nothing in the render/reproduction path consumes them, and the folded L1 document
renders as a complete reproduction on its own.

**In scope:** the fold to one L1 document in the full language (text, image, box,
reconstructed surfaces, page band, font table), oracle retention, geometry
keyframes + interpolate/snap classification + visibility rules, the typed residual
signal for unexpressed elements, the advisory hint sidecar, and supersession of
the pre-L1 `adopt-values` reproduction command.

**Out of scope:** the L1 typed tree / envelope / renderer themselves, including the
axis vocabulary and the resource-table form (owned by the L1 Layout Substrate
capability); the end-to-end reproduction acceptance gate, its fidelity pairing of
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
  surfaces and the page band now fold; only form controls and unclassifiable
  text-free elements remain residuals by design.

## Dependencies
Plan item 1 — L1 Layout Substrate + Safety Envelope (CAP-70), whose axis vocabulary
and document-level font resource table this fold populates.

## Story Points
3