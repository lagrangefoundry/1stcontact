---
uid: acceptance_criterion-efada992
id: AC-2454
type: acceptance_criterion
title: The editor opens a multi-run text node as one plain-string field per run, with
  run axes not exposed
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:32.157877+00:00'
updated_at: '2026-11-08T13:28:32.157877+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
In the edit modal, a plain-string text node keeps its single field named `text`. A multi-run node exposes fields `text1 … textN` (one per run, in order), labelled `Text 1 … Text N`, each a plain string holding that run's words, listed first so the cursor lands in the words. No control for any run's axes (colour, size, weight, slope, lift) is exposed.

## Verification
Derive the edit fields for a plain-string node and a three-run node; assert `text` for the first and exactly `text1`, `text2`, `text3` (labels `Text 1`–`Text 3`, string values equal to each run's words, first in order) for the second, with no run-axis fields.
