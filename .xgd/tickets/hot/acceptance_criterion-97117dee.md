---
uid: acceptance_criterion-97117dee
id: AC-2438
type: acceptance_criterion
title: A document declaring no modal renders exactly as before
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:40.279015+00:00'
updated_at: '2026-11-08T13:25:15.850276+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
For a document that uses neither `dialog` nor `action`, including documents with links, the rendered HTML and CSS are byte-for-byte identical to the render produced before modal support was added. No shell, dialog stylesheet or dialog script appears.

## Verification
Render representative modal-free documents (including one with links) and compare against the pre-change expected output. Assert exact equality and the absence of any dialog markers.