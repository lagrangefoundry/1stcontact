---
uid: acceptance_criterion-9dc8e3dc
id: AC-2494
type: acceptance_criterion
title: A state read in one channel reproduces in the other
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T23:48:27.685614+00:00'
updated_at: '2026-11-08T23:48:27.685614+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
The open marker means the same thing in both channels. So a state read from a document in one channel and applied to the same page's document in the other leaves the same panels open on both sides, and reading the second document back gives the same panel list. This holds both ways: View to Edit and Edit to View.

## Verification
In a DOM environment, open a panel in a draft render and read its state. Apply that state to the edit render of the same document, read it back, and assert the panel lists are equal. Then pick a different panel in the edit render, read its state, apply it to a fresh draft render, and assert that the same panel is open there and was opened by its opener (its `aria-expanded` is `true`).
