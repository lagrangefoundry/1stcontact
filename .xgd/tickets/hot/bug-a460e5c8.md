---
uid: bug-a460e5c8
id: BUG-220
type: bug
title: 'A `control: "button"` node outside a component renders nothing, but validates
  and raises no attention'
created_by: xgd
created_at: '2026-10-17T23:09:17.687277+00:00'
updated_at: '2026-10-17T23:09:17.687277+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
---

## What happened
A builder put `kind: "control", control: "button"` nodes on a page as call-to-action buttons. They were ordinary page content, not inside any component's slot. They had paint axes (gold surfaceFill, near-black text, padding) but no label. The schema says a control paints "the module-declared element", so outside a module there is nothing for it to paint.

- The page validated and was written.
- `describe_page` listed them as `control` / "button", with no `attention` on them.
- In screenshots they did not appear at all. The client saw no "Ask for an appointment" buttons until they were replaced with `text` nodes that have a `link`.

## Expected
One of:
- validation refuses a `control` node that is not inside a module slot, or whose `control` name no module declares; or
- `describe_page` marks it `broken` ("control outside any component paints nothing"); or
- a supported button primitive exists in the page vocabulary for page-level calls to action.

## Impact
An invisible call to action that passes every check. It was found only by a screenshot, and only after several rounds of builders reported the page as fine.