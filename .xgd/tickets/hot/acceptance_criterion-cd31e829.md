---
uid: acceptance_criterion-cd31e829
id: AC-776
type: acceptance_criterion
title: A saturated radius is compared as a pill, not a magnitude
created_by: xgd
created_at: '2026-08-03T02:28:40.290677+00:00'
updated_at: '2026-08-03T02:28:40.290677+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
---

## Criterion
A corner radius that saturates — reaching (near) half the painted height, so every larger value paints the identical fully-rounded pill — is compared as a **pill**, not as a magnitude. When both sides are pills the shape agrees by construction and only the shadow can still differ, so no shape delta is reported for two pills whose radii differ numerically (a reference `rounded-full` computes to a browser sentinel of 33554400px while the envelope-clamped reproduction emits 100000px — identical pixels).

Everything else still flags: a pill on one side flattened to a square (or to a non-saturating radius) on the other reports a shape delta; a shadow present on one side only reports a shape delta even when both sides are pills; and radius drift between two non-pill shapes reports as before. The pill test applies to whichever box actually paints the surface, so it holds for a split control's backing box as well as for a self-painting chip.

## Verification
Diff four paired shapes: (1) two pills with different sentinel radii — assert no shape delta; (2) a pill vs a square — assert a shape delta; (3) two pills differing only in shadow — assert a shape delta; (4) two non-pill shapes with radius drift beyond tolerance — assert a shape delta.
