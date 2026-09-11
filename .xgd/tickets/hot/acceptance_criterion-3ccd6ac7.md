---
uid: acceptance_criterion-3ccd6ac7
id: AC-1730
type: acceptance_criterion
title: 'One overlay serves both entry points: the conversation and the Library raise
  the same one'
created_by: martin-github@westhead.me
created_at: '2026-09-11T05:32:35.405430+00:00'
updated_at: '2026-09-11T05:42:21.870257+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-325da65f
  kind: behavior
  regression_only: false
---

## Criterion

There is one overlay in the workspace, and both entry points raise it. Dragging files onto the
conversation raises it; dragging files onto the Library raises it; and it is the same overlay in
both cases, offering the same two answers — not one overlay per entry point.

The workspace contains exactly one such overlay however many entry points watch for a file drag.

## Verification

Open the builder workspace and assert exactly one upload overlay exists and is not showing. Drag
files onto the conversation and assert it is showing; dismiss it; drag files onto the Library and
assert the same overlay — the identical one counted at the start — is showing again.