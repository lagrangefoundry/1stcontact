---
uid: bug-a460e5c8
id: BUG-220
type: bug
title: 'A `control: "button"` node outside a component renders nothing, but validates
  and raises no attention'
created_by: xgd
created_at: '2026-10-17T23:09:17.687277+00:00'
updated_at: '2026-10-18T00:15:30.544740+00:00'
completed_at: null
last_field_updated: body
status: draft
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  epic_parent: epic-95bc3b15
  severity: high
  chat_comment: comment-294aa8bc
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



## Notes (EPIC-19, 2026-10-17)

This breaks Security/Robustness policy's 'validated by construction' promise: a document that validates should render what it says. Recommended fix:
1. **The validator refuses a `control` node outside a module slot**, or one naming a control no module on the page declares, with a message saying to use a `text` node with a `link` for a call to action. This is the fix; it makes the invisible state unwritable.
2. **`describe_page` marks any such node `broken`** on existing pages, so ones already written are found.
3. **The builder's manual says how to make a page-level button**: a `text` node with a `link` and its own fill and padding. Whether L1 should gain a first-class button primitive is a separate question, not needed for this fix.