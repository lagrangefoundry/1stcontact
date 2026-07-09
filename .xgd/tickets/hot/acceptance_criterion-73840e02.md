---
uid: acceptance_criterion-73840e02
id: AC-471
type: acceptance_criterion
title: Named viewport presets yield stable, deterministic dimensions; default is desktop
created_by: xgd
created_at: '2026-07-09T20:20:06.066880+00:00'
updated_at: '2026-07-09T20:20:06.066880+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3ae5b34e
  kind: behavior
  regression_only: false
---

## Criterion
The `--viewport` option accepts exactly `mobile`, `tablet`, or `desktop`, each mapping to a fixed, deterministic width (mobile=375, tablet=768, desktop=1280). Repeated shots at the same preset yield the same width. When `--viewport` is omitted, the `desktop` preset is used. An unrecognized viewport name fails with an error naming the allowed values.

## Verification
Run `1c shot` for each of the three presets and assert the resolved viewport width matches the preset's fixed value and is identical across repeated runs. Run without `--viewport` and assert the desktop width is used. Run with an invalid viewport name and assert the command fails with an error mentioning mobile|tablet|desktop.
