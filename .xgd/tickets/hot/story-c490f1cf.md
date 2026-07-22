---
uid: story-c490f1cf
id: STORY-80
type: story
title: 'Absolute-or-overlay values: every colour, length, and radius dial accepts
  a literal or a named overlay'
created_by: xgd
created_at: '2026-07-19T03:09:25.918607+00:00'
updated_at: '2026-07-22T20:28:57.375021+00:00'
completed_at: null
last_field_updated: updated_by
status: updated
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-6e088083
  story_kind: upgrade
  story_points: 3
  updated_by:
  - bundle-31e474b9
---

## Story

**As a** site author reproducing a captured site (or designing one from scratch),
**I want** every concrete value — colour, length, radius — to be carried directly
as a validated absolute literal in the layout substrate, **so that** I can land a
captured site's exact values precisely, with the safety envelope guaranteeing the
literal is well-formed and in range.

## Description

The reproduction mandate is *absolute values are the base; a named scale is an
overlay of constants*. This story's **absolute base** — the literal side of the
absolute-or-overlay model — is now carried by the **L1 layout substrate** (see the
L1 substrate story). Following the framework pivot (REQ-79), the semantic *layout*
modules (services-grid, text-block, contact-form, hero, header, footer) and their
~20 colour/length/radius dials were deleted (REQ-84). The absolute-or-overlay
capability those dials delivered is **re-homed in L1 leaf axes**: each L1 leaf
(box / text / image) carries the concrete value directly as a typed literal, and
the envelope validator guarantees it is well-formed and within range.

How each value TYPE is now carried in L1:

- **Colour** — a hex-only literal (`#rgb` / `#rrggbb` / `#rrggbbaa`), used
  verbatim; a non-hex string is rejected by the schema (no `rgb()`, no keyword,
  no `url()`).
- **Length / geometry** — a finite numeric px literal, used verbatim, bounded by
  the envelope (font-size 1–400, geometry ±100k, length ±100k / 100k); an
  out-of-range or non-finite value is rejected by the validator.
- **Radius / corner** — a finite numeric px literal, used verbatim, within the
  envelope length bounds.

## Technical Notes

- **Delivery moved; capability preserved.** The prior module-dial delivery
  (AC-660..665) is superseded by the pivot — an intentional supersession per the
  REQ-79 reconciliation note and the REQ-85 superseded-AC list, **not** a lost-work
  overwrite. The absolute-base capability itself survives, re-homed in L1 leaf
  literals.
- **No named-role indirection lives in the substrate.** Per REQ-79 language-
  triviality principle #2 ("one value = one literal field — no theme-role
  indirection IN L1"), L1 carries only the **absolute (literal) base**. The
  named-overlay affordance (palette role / named step / named shape) is an
  authoring-layer convenience above L1, not part of the safe substrate — so the
  substrate carries the literal, not an `absolute OR role` union.
- **Detailed L1 axis + envelope coverage is owned by the L1 substrate story**
  (item 1); this story's AC is the repointer for the absolute-base capability so
  it is not orphaned by the module-dial deletion.