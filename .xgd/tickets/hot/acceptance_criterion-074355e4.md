---
uid: acceptance_criterion-074355e4
id: AC-690
type: acceptance_criterion
title: Raw multi-viewport sample ladder is retained as the acceptance oracle
created_by: xgd
created_at: '2026-07-22T19:42:24.841662+00:00'
updated_at: '2026-07-22T19:42:24.841662+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8acc338d
  kind: behavior
  regression_only: false
---

## Criterion
The same capture retains the raw multi-viewport sample ladder in the bundle
alongside the folded document, covering the same set of sampled widths. The fold
augments the bundle; it does not replace or discard the oracle ladder.

## Verification
After a capture, assert the retained ladder artifact exists in the bundle and its
sampled widths match the folded document's declared widths.
