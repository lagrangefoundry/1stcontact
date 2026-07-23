---
uid: acceptance_criterion-bb847db7
id: AC-640
type: acceptance_criterion
title: Omitting --size preserves the single-width (desktop) path on both diff commands
created_by: xgd
created_at: '2026-07-19T02:37:07.977604+00:00'
updated_at: '2026-07-23T10:49:26.531086+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Running either fidelity command (values-diff or pixel diff) without a `--size` flag produces the same comparison as before the size selector existed: values-diff compares against the reference's single default-width capture, and the pixel diff compares against the reference bundle's default full-page desktop screenshot. No ladder read or per-width screenshot is required for the default path.

## Verification
Run values-diff and pixel diff with no `--size` flag against a bundle and assert each returns a report equivalent to the pre-size single-width behavior, succeeding even when only the default-width reference artifacts are present.