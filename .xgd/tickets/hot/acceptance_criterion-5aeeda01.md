---
uid: acceptance_criterion-5aeeda01
id: AC-642
type: acceptance_criterion
title: values-diff --size at a width the ladder never captured fails loudly and names
  the available widths
created_by: xgd
created_at: '2026-07-19T02:37:16.132207+00:00'
updated_at: '2026-07-19T02:48:19.757731+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
---

## Criterion
Running values-diff with `--size` against a bundle whose persisted ladder exists but does not include the selected size's width terminates with an error and produces no diff report. The error states that the reference has no projection at the requested width and lists the widths the ladder does carry, so the user knows what to re-capture.

## Verification
Run values-diff at a size whose width is absent from a fixture ladder that carries other widths; assert the command fails, emits no report, and the error text includes both the requested width and the set of captured widths.