---
uid: acceptance_criterion-e849dd5b
id: AC-2443
type: acceptance_criterion
title: A text node whose copy is a plain string validates and renders exactly as before
  runs existed
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:28:24.166203+00:00'
updated_at: '2026-11-08T13:28:24.166203+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1e340c9a
  kind: behavior
  regression_only: false
---

## Criterion
An L1 document whose text node's `text` is a plain string passes validation, and its rendered HTML for that node is identical to the output produced before the run form was introduced: the words appear once, with no per-run span wrappers.

## Verification
Validate and render a document with a plain-string text node; assert validation succeeds and the node's emitted markup contains the string with no run spans.
