---
uid: acceptance_criterion-2dd5367a
id: AC-2441
type: acceptance_criterion
title: Tab is trapped in an open panel, the page does not scroll, and several panels
  work independently
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:55.756504+00:00'
updated_at: '2026-11-08T13:09:55.756504+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
While a panel is open, Tab and Shift+Tab cycle focus among the panel focusable elements and never move focus outside it. Page scrolling is locked while any panel is open. Several panels may be open at once, and each opens and closes independently. The scroll lock lifts only when the last open panel closes.

## Verification
In a DOM environment, open a panel with several focusable elements. Tab past the last and Shift+Tab before the first, and assert focus stays inside. Assert the page scroll lock is applied. Open two panels, close one and assert the lock remains and the other panel is still open. Close the second and assert the lock is lifted.