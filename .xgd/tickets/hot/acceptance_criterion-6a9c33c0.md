---
uid: acceptance_criterion-6a9c33c0
id: AC-2439
type: acceptance_criterion
title: A reader opens and closes a panel and focus moves in and returns to the opener
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:45.328702+00:00'
updated_at: '2026-11-08T13:09:45.328702+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
On the enhanced page, activating an `opens` control shows its panel, sets that opener `aria-expanded` to true, and moves focus into the panel (to the panel itself when it holds nothing focusable). Activating a `closes` control hides the panel, sets the opener `aria-expanded` to false, and returns focus to the element that opened it.

## Verification
In a DOM environment with the rendered page and script, click the opener. Assert the panel is visible, the opener state, and that the focused element is within the panel. Click the closer and assert the panel is hidden, the opener state is false, and the opener has focus.