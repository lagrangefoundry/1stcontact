---
uid: bug-a460e5c8
id: BUG-220
type: bug
title: 'A `control: "button"` node outside a component renders nothing, but validates
  and raises no attention'
created_by: xgd
created_at: '2026-10-17T23:09:17.687277+00:00'
updated_at: '2026-10-18T11:32:12.115624+00:00'
completed_at: null
last_field_updated: status
status: free_coding
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
## Root cause (investigation, 2026-10-18)
- **Renderer**: `case 'control'` in `packages/framework/src/l1/render.ts` resolves the name through `state.controls` and emits `''` when unbound (REQ-96 inert degradation). Only `renderL1Fragment` — a component drawing its own slots — supplies `controls`; `renderL1Document` (the page's own tree) never does. A `control` in a page's own tree is therefore invisible by construction, whatever its name.
- **Validation**: `validateL1` checks a control's axes only; its name and position are never checked. The only binding check, `validateBehaviorControls`, walks a component's `slots` and already refuses an undeclared name there. The gap is page level only.
- **describe_page**: the style audit (`tools/generate/src/cli/style-audit.ts`) only inspects a control when its component resolves it; a page-level control has no component, so every rule skips it.
- **Builder guidance**: the vocabulary is generated from the schema's doc comments, and the `control` field never said it only works inside a component's slot or how to make a page-level button.

## Fix
1. **The validator refuses a `control` node anywhere in a page's own L1 tree** (`validateL1`), with a message that a control paints a component's element and only works inside that component's slot, and that a call to action is a `text` node with a `link` plus its own fill and padding. No component lookup is needed: such a node can never render. Controls inside a component's slots are unaffected (still checked by `validateBehaviorControls`).
2. **`describe_page` marks as `broken`**:
   - any `control` in the page's own tree ("outside any component, paints nothing");
   - any `control` in a component's slot whose name that component does not declare (pages stored before a component changed).
3. **The builder's vocabulary says it**: the `control` field's doc comment (which the builder priming and REF-l1 are generated from) states that a control is only valid inside a component's slot and gives the page-level button recipe.

## Decisions
- **Existing stored pages are not migrated.** Once (1) lands, a stored site with a page-level control refuses every write until that node is removed; the refusal names the node's exact path. Accepted because the node renders nothing, so removing it changes nothing visible.
- **No first-class button primitive** — separate question, not needed here.

## Test plan
`tests/test_UAT_FC_BUG-220_*`:
- a page whose own tree contains a `control` node is refused by validation, with a message pointing at a `text` node with a `link`;
- a `control` inside a component's slot still validates;
- `describe_page`'s audit marks a page-level control `broken`, and marks an undeclared control inside a component's slot `broken`;
- the builder vocabulary text for `control` says it only works inside a component's slot.
Regression scope: existing REQ-96 / REQ-349 / capture-fold UATs.
