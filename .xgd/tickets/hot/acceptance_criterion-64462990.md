---
uid: acceptance_criterion-64462990
id: AC-435
type: acceptance_criterion
title: A dark palette adds a prefers-color-scheme dark block overriding palette colours
created_by: xgd
created_at: '2026-07-08T19:20:13.347317+00:00'
updated_at: '2026-07-08T19:20:13.347317+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
When theme CSS is generated with a dark palette supplied, the output includes, in addition to the base `:root` block, an `@media (prefers-color-scheme: dark)` block whose `:root` overrides declare a `--color-<role>` property for each role present in the dark palette (and only those roles). When no dark palette is supplied, no `prefers-color-scheme: dark` block appears in the output.

## Verification
Generate CSS once with a dark palette overriding a subset of colour roles and assert the media block exists and contains the expected `--color-<role>` overrides. Generate again without a dark palette and assert no `prefers-color-scheme: dark` block is present.
