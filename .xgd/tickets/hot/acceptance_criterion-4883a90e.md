---
uid: acceptance_criterion-4883a90e
id: AC-529
type: acceptance_criterion
title: Deltas are ranked so content and structural drift outrank measurement drift
created_by: xgd
created_at: '2026-07-09T22:58:58.300931+00:00'
updated_at: '2026-07-10T01:46:39.116184+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
When multiple deltas are found, the report orders them by a fixed **severity tier** first, never by pixel area, so a small-but-structural defect always outranks a large-but-tonal one. Every delta is tagged with a kind that maps through a fixed table to a tier: CRITICAL (a missing/absent element, a placeholder-inside-vs-label-above containment slip, a beside-vs-below arrangement, an out-of-position element, a verbatim text/casing change, a viewport-width precondition mismatch), HIGH (element size, font-size, font-family, z-order, media, horizontal overflow, font-fallback, transform), MEDIUM (shape, treatment, motion, left-bar border, gradient, font-weight), LOW (colour, section overlay/scrim, content vertical-anchor, line-height, left-padding, letter-spacing). Ranking is `(tier, then kind-within-tier, then magnitude)`; magnitude is a tiebreak within a kind only and can never lift a delta across tiers. The prior pairwise orderings are preserved (a missing element highest, `overlay` above `contentAnchor`, `text` above `colour`, `colour` above `letterSpacing`). Deltas of equal rank retain document order. In particular the three flagship structural misses surface as CRITICAL rows: a hero block ~195px out of position (`position`), a form field whose name renders as a label rather than a placeholder (`containment`), and a submit button rendered below rather than beside its input (`arrangement`).

## Verification
Diff a case that simultaneously produces a small structural defect (e.g. an out-of-position element or a beside-vs-below arrangement) and a large tonal defect (e.g. a colour drift on a big block), and assert the structural delta is ranked above the tonal one; separately assert the pinned pairwise orderings (missing highest, overlay>contentAnchor, text>colour, colour>letterSpacing) still hold.
