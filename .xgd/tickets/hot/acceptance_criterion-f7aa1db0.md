---
uid: acceptance_criterion-f7aa1db0
id: AC-713
type: acceptance_criterion
title: Box-border comparison includes line style and captures the border on text runs
  via the thickest painted side
created_by: xgd
created_at: '2026-07-22T20:17:29.886710+00:00'
updated_at: '2026-07-23T11:45:17.137510+00:00'
completed_at: null
last_field_updated: uat_coverage
status: pending
fields:
  story_uid: story-d5de22a5
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
The uniform box-border comparison folds the border's **line style** (dashed/dotted/solid) into the width+colour check: a border differing only in line style yields a border delta, and the delta label carries the style. The style is compared only when **both** sides recorded one — a bundle captured before line style existed (style absent on either side) never fabricates a style-only delta.
The box border is also captured on **text runs** (previously fields-only): a run's border is measured as the **thickest painted side** (with its style), so a bottom-only rule or a single-side border on a text element becomes a comparable value rather than being missed.

## Verification
Run the diff on paired borders that differ only in line style (dashed vs solid) and assert a border delta whose label names the style. Run with the style absent on one side and assert no style-driven delta. Run on a text run carrying a single-side (thickest painted) border vs one without and assert the border delta surfaces.