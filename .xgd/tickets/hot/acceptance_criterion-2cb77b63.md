---
uid: acceptance_criterion-2cb77b63
id: AC-2431
type: acceptance_criterion
title: An action node renders as a button with honest disclosure semantics
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T13:09:00.124020+00:00'
updated_at: '2026-11-08T13:25:17.309688+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e214a00d
  kind: behavior
  regression_only: false
---

## Criterion
In the published/draft render, a node carrying `action` is emitted as its own element retagged to `<button type="button">`, not wrapped in one. It keeps the node's class and every paint declaration. An opening action carries `aria-haspopup="dialog"`, `aria-controls` equal to the panel id, and `aria-expanded="true"` in the server markup. A closing action carries neither `aria-haspopup` nor `aria-expanded`.

## Verification
Render a document with an opener and a closer. Assert both are `<button type="button">` with their node class, assert the opener's three ARIA attributes and values, and assert neither `aria-haspopup` nor `aria-expanded` is on the closer.