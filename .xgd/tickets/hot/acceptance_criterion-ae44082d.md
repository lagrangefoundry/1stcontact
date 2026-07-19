---
uid: acceptance_criterion-ae44082d
id: AC-641
type: acceptance_criterion
title: values-diff --size against a bundle with no persisted ladder fails loudly with
  re-capture guidance
created_by: xgd
created_at: '2026-07-19T02:37:12.061401+00:00'
updated_at: '2026-07-19T02:48:19.887518+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-16f2793c
  kind: behavior
  regression_only: false
---

## Criterion
Running values-diff with `--size` against a reference bundle that has no persisted viewport ladder (a bundle captured before multi-viewport capture existed) terminates with an error and produces no diff report. The error identifies the offending bundle and instructs the user to re-capture the page to persist the reference across the viewport ladder. The command does not silently fall back to a desktop comparison.

## Verification
Run values-diff `--size tablet` against a bundle directory lacking the multi-viewport ladder artifact; assert the command exits with a failure, emits no report, and the error text names re-capture as the remedy.