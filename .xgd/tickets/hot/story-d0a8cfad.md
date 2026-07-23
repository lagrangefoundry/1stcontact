---
uid: story-d0a8cfad
id: STORY-83
type: story
title: L1 layout substrate rendered safe by construction
created_by: xgd
created_at: '2026-07-22T19:31:28.526898+00:00'
updated_at: '2026-07-23T07:32:53.807167+00:00'
completed_at: null
last_field_updated: body
status: completed
fields:
  intent_uid: bundle-31e474b9
  capability_uid: capability-ae9d65d6
  story_kind: feature
  story_points: 3
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
and an author recovers.

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

A **round-trip identity gate** wired to the existing capture/values-diff spine
measures `capture(render(L1)) ≈ L1` on the authored (literal) axes, and a
cross-browser check confirms equivalent layout across the three engines.

**In scope**: the typed L1 shape, the envelope validator, the safe renderer
(including geometry keyframe compilation), and the round-trip / cross-browser
fidelity guarantees, proven on a hand-authored one-section spike.

**Out of scope**: mechanically folding a multi-viewport capture into an L1
document (REQ-83, a separate story), capability-module mounting into `slot`
leaves (REQ-85, a separate story), and the end-to-end 3-probe reproduction gate
(REQ-86, a separate story). In L1, a `slot` renders as an inert labelled
placeholder.

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

## Dependencies
None (this is the foundational substrate; plan items 2, 3, 4, 6, 7, 8 depend on it).

## Story Points
3



## Merged from STORY-81 (overlap cluster 2 resolution)
The reconciliation `upgrade` story STORY-81 ("Responsive dials …", CAP-68, now
archived) recorded that the former **per-breakpoint module length dials**
(`{ base, sm?, md?, lg?, xl? }`) and the header `navCollapse` dial were deleted by
the REQ-79 pivot. Their responsive-across-widths intent is re-homed here: per-viewport
variation is carried by this substrate's geometry keyframes (interpolate|snap).
`navCollapse` was removed with no L1 successor. STORY-81's sole AC (AC-717) was a
behavioural duplicate of AC-684 and was reassigned here; the AC-level dedup pass
(per REPORT-795) has since collapsed AC-717 into AC-684 — AC-717 is archived, its
provenance note folded into AC-684, and its duplicate test file
(tests/reconciliation-responsive-keyframes.test.ts) retired. That behaviour remains
covered by tests/reconciliation-l1-substrate.test.ts.