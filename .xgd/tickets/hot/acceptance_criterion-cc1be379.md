---
uid: acceptance_criterion-cc1be379
id: AC-1334
type: acceptance_criterion
title: A hook that fails aborts that app before anything is uploaded, and the deploy
  exits non-zero
created_by: xgd
created_at: '2026-08-20T05:31:11.977465+00:00'
updated_at: '2026-08-20T05:31:11.977465+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d5167ced
  kind: behavior
  regression_only: false
---

## Criterion

A hook that exits non-zero aborts the deploy of that app **before anything is uploaded**, and the
deploy command itself exits non-zero. The failing hook's own output is visible to the operator, and
nothing the upload stage would have produced appears — the abort is observably ordered before the
upload, not merely reported afterwards.

This holds in a rehearsal as well as in a real deploy, since the two are one path.

## Verification

Place an executable hook that prints its context and then exits non-zero, and run a deploy of one
app. The command exits non-zero, the hook's output is present, and no output characteristic of the
upload stage appears. Remove the hook and confirm the same deploy proceeds past that point.
