---
uid: acceptance_criterion-3e4b0eab
id: AC-656
type: acceptance_criterion
title: --multi-viewport keeps the site slug as a positional in either flag order
created_by: xgd
created_at: '2026-07-19T03:01:36.569827+00:00'
updated_at: '2026-07-19T03:06:26.203026+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e15a19ef
  kind: behavior
  regression_only: false
---

## Criterion
When `values-diff` is invoked with the `--multi-viewport` flag and a site slug,
the slug is retained as the command's positional argument regardless of whether
the flag appears before or after it:
- `values-diff --multi-viewport <slug> --ref <dir>` resolves the positional to
  `<slug>`.
- `values-diff <slug> --ref <dir> --multi-viewport` resolves the positional to
  the same `<slug>`.

In both orderings the multi-viewport toggle is on and any value-taking options
(e.g. `--ref`) keep their own values. The command does NOT abort with a
missing-slug error caused by the flag consuming the slug.

## Verification
Invoke the argument parsing for both orderings and observe that the resolved
positional is the slug in each case, the multi-viewport toggle is enabled, and
a following value option retains its value. Confirm the command proceeds past
argument validation rather than terminating with a "missing required slug"
error.