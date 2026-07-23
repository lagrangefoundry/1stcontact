---
uid: acceptance_criterion-7acc3466
id: AC-644
type: acceptance_criterion
title: pixel diff --size against a bundle lacking a same-width reference screenshot
  fails loudly with re-capture guidance
created_by: xgd
created_at: '2026-07-19T02:37:41.994128+00:00'
updated_at: '2026-07-23T10:49:33.506925+00:00'
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
Running the pixel diff command with `--size` against a reference bundle that has no reference screenshot at the selected size's width (a bundle captured before per-viewport screenshots existed) terminates with an error and produces no diff output. The error identifies the missing same-width reference and instructs the user to re-capture to persist per-viewport reference screenshots. The command does not silently compare the sized reproduction against the desktop screenshot.

## Verification
Run pixel diff `--size mobile` against a bundle directory that has only the default desktop screenshot; assert the command fails, writes no diff artifacts, and the error text names the missing same-width screenshot and re-capture as the remedy.