---
uid: acceptance_criterion-d9bf617e
id: AC-588
type: acceptance_criterion
title: No legacy strict/exact toggle; exact is the default with a single opt-out
created_by: xgd
created_at: '2026-07-13T20:01:12.798252+00:00'
updated_at: '2026-07-13T20:01:12.798252+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-dadb8475
  kind: behavior
  regression_only: true
---

## Criterion
There is no separate strict/exact-match mode toggle. Exact matching is the default
and only baseline behaviour; the sole blanket loosening control is the single
tolerant opt-out (with per-axis overrides for individual axes). The previously
available exact-match flag is gone — no legacy dual-mode path exists.

## Verification
Inspect the values-diff command's documented tolerance surface (its usage/help
output): assert it advertises exact-by-default with a single tolerant opt-out and
per-axis override flags, and does not offer a strict exact-match toggle.
