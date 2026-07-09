---
uid: acceptance_criterion-cfd21332
id: AC-528
type: acceptance_criterion
title: Section-level scrim overlay and content vertical-anchor deltas are flagged
  by ordinal index
created_by: xgd
created_at: '2026-07-09T22:58:33.539764+00:00'
updated_at: '2026-07-09T22:58:33.539764+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-f826e5ca
  kind: behavior
  regression_only: false
---

## Criterion
Sections are aligned by ordinal document index. For each aligned section pair the diff compares the full-bleed translucent overlay (scrim) — colour and opacity — and the content vertical-anchor ratio, emitting an `overlay` delta when the scrim differs (missing, colour mismatch, or opacity beyond tolerance) and a `contentAnchor` delta when the vertical anchor differs beyond tolerance (reported with a legible band label, e.g. `bottom (0.82)` vs `center (0.50)`). A section index present on only one side has no counterpart and is skipped rather than reported as a delta.

## Verification
Diff a reference hero carrying a scrim/low-anchor against a draft missing them and assert `overlay` and `contentAnchor` deltas at the correct section label; add an extra section on one side only and assert it produces no delta.
