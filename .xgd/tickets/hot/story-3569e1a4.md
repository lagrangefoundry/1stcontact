---
uid: story-3569e1a4
id: STORY-81
type: story
title: 'Responsive layout: a container''s layout mode varies per breakpoint and a
  row can wrap'
created_by: xgd
created_at: '2026-07-19T03:20:16.873338+00:00'
updated_at: '2026-08-09T05:42:05.639975+00:00'
completed_at: null
last_field_updated: uat_coverage
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-ae9d65d6
  story_kind: upgrade
  story_points: 2
  updated_by: bundle-ee56a66e
  uat_coverage: pass
---

## Story
**As a** site-definition author designing or reproducing a responsive site, **I want** a container's layout mode to vary per viewport width — and a row to be able to wrap — as ONE subtree, **so that** a horizontal run of peers becomes a vertical one on a narrow screen without authoring the subtree twice.

## Description
This story owns **per-width variation of the layout mode itself**. Per-width variation of *values* (geometry keyframes, scalar and padding tracks) is owned elsewhere in the L1 substrate; what lives here is the axis that changes how a container flows its children as the viewport changes, plus the wrapping row.

A container declares an ascending **layout track** of `{ at, value }` breakpoints. The first keyframe is the base — in force *below* its own `at` — and each later keyframe takes over from its `at` upward, `min-width` semantics, inclusive. The container's static `layout` remains the representative **widest** value for consumers that do not resolve per width, and the envelope requires the two to agree so they cannot drift.

**`at` is a breakpoint, not a sample.** Geometry and scalar tracks keyframe at the document's captured widths because they are sampled from a capture and interpolated between samples. A layout mode is neither — it is an authored design decision that snaps at a width the capture may never have visited — so `at` is a free authored value, like a visibility threshold, and is not checked against the document's widths.

A row may also declare **wrap**: children that no longer fit start a new line instead of squeezing. Combined with each child's minimum width this is the "cards reflow when they run out of room" behaviour with no breakpoint authored anywhere. Each breakpoint restates its mode **whole** rather than as a delta, so a wrapping row that becomes a stack resets its wrapping (a column that inherited `wrap` breaks the moment anything constrains its height) and a grid that becomes a row resets its display. Wrapping is inert wherever the resolved mode is not a row.

**One cascade, two consumers.** The rule that resolves a mode at a width is stated once and used by both the renderer, which compiles the track to a base rule plus breakpoint overrides, and the analytic layout evaluator behind the reproduction gate. Two copies would drift, and a drifted model reports phantom findings against a page that renders correctly.

Two cascade-ordering rules fall out of the axis and are part of this capability:
- **Breakpoint blocks serialize in ascending order.** They were previously ordered by first appearance across the document, so a node introducing 768 before another introduced 520 put 520 *after* 768 in the stylesheet, and any node declaring both then had 520 win at desktop widths. Harmless while every node keyframed at the same captured ladder; a live defect the moment two authored breakpoints interleave, which is what a layout track invites.
- **Visibility is the final word on display.** Two features now write `display` for the same node, so a hidden node must stay hidden at a width its layout track would otherwise re-show.

### What this replaces
The only previously expressible answer was authoring the subtree **twice** under paired visibility thresholds. That duplicates tree structure (both copies edited in lockstep or they silently diverge), doubles node count against the structural cap, and puts both copies in the DOM so a container's reveal stagger counts children the reader never sees. For a **control** leaf it is not merely expensive but malformed: duplicating a control duplicates a form field, so both copies share one `name` and one `id` — a duplicate id breaks the label association the behavior module exists to guarantee, and visibility is CSS rather than `disabled`, so the hidden copy still submits. A row of controls that must reflow to a column at mobile therefore had **no representation at any cost**; the layout track is what makes it one subtree.

**In scope:** the per-width layout track, the wrapping row, the shared mode cascade shared by renderer and analytic gate, the ascending breakpoint serialization, and visibility outranking the track.
**Out of scope:** per-width variation of geometry, scalar and padding values (owned by the L1 layout substrate story); the control contract and the behavior module's attribute bundle (owned by the behavior-module story).

## Technical Context
This story's original delivery — per-breakpoint module dials (`{ base, sm?, md?, lg?, xl? }`) plus a header `navCollapse` dial — was deleted by the REQ-79/REQ-84 framework pivot along with the semantic layout modules. `navCollapse` has no successor: there is no capability behind it any more. The per-width *value* variation that survived was re-homed onto L1 geometry keyframes and is documented under the L1 layout substrate and capture-fold stories, which is why this story stood archived with no criteria of its own from 2026-07-23.

REQ-104 gives it distinct behaviour again: per-width variation of the **layout mode**, which no other story expresses. The criteria below document that behaviour as shipped, on the same capability as the L1 substrate.

Where the code goes beyond the intent's stated criteria, it does so in the direction the intent argues for and both additions are documented here: the envelope's **track-coherence rules** (strictly ascending breakpoints, and `layout` naming the widest keyframe's mode) exist so a non-responsive consumer cannot read a mode the page never renders at any width; and the **ascending breakpoint serialization** is a latent pre-existing ordering defect that only bites once two authored breakpoints interleave — in scope by necessity, since the track is what makes interleaving normal.

Site-definition content is not capability surface: the intent's fourth criterion (collapsing xgd.dev's three duplicated row/stack pairs) is evidence of the capability, not a criterion of it, and no criterion below is written against that site's content.

## Story Points
2