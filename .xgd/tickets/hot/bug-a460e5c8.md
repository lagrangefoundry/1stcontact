---
uid: bug-a460e5c8
id: BUG-220
type: bug
title: 'A `control: "button"` node outside a component renders nothing, but validates
  and raises no attention'
created_by: xgd
created_at: '2026-10-17T23:09:17.687277+00:00'
updated_at: '2026-10-18T12:07:36.374773+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  auto_merge_back: true
  needs_review: false
  priority: medium
  epic_parent: epic-95bc3b15
  severity: high
  chat_comment: comment-294aa8bc
  commits:
  - working_sha: 02476da0996387f8d64976789ee0782dbd2509f3
    reconcile_sha: null
    main_sha: null
  - working_sha: 1739e5c75474fb67e539462a8facf07070d33b18
    reconcile_sha: null
    main_sha: null
  version: 0.2.528
  story_points: 3
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
1. **Site validation refuses a `control` node anywhere in a page's own L1 tree** (`validateSite`, so every write — `set_l1` included — is refused whole). The message says a control is only valid inside a component's slot and that a page-level button is a `text` node with a `link` and its own fill and padding, at the node's exact path. No component lookup is needed: such a node can never render. Controls inside a component's slots are unaffected (still checked by `validateBehaviorControls`).
2. **`describe_page` marks as `broken`**:
   - any `control` in the page's own tree ("outside any component, paints nothing");
   - any `control` in a component's slot whose name that component does not declare (pages stored before a component changed).
3. **The L1 reference says it**: the `control` field's definition, which REF-l1 is generated from, now reads "The element this node paints, as its component declares it (a field name, `submit`, …) — valid only inside that component's slot." The page-level button recipe is in the refusal message itself.

## Decisions
- **Existing stored pages are not migrated.** Once (1) lands, a stored site with a page-level control refuses every write until that node is removed; the refusal names the node's exact path. Accepted because the node renders nothing, so removing it changes nothing visible.
- **No first-class button primitive** — separate question, not needed here.
- **The rule lives in `validateSite`, not `validateL1`.** It was first written into `validateL1`, but that envelope is also how a component's slot subtree (e.g. the contact-form L2 preset) is checked, wrapped as `{ widths, root }`. Refusing controls there broke REQ-96/REQ-223/REQ-265/REQ-308/REQ-99/AC-802/AC-811. Whether a tree is a page's own tree is a property of the page, which is exactly where REQ-247's email-page rules are checked too. For the same reason it is not an `L1_STRUCTURAL_RULES` entry (BUG-48 requires each of those to be provokable through `validateL1`).
- **A component whose declaration is unknown to the catalog is not flagged** by the audit's undeclared-name rule: nothing can be said about its names either way.

## Test plan
`tests/test_UAT_FC_BUG-220_control_outside_a_component.test.ts`:
- `set_l1` adding a `control` to a page's own tree is refused at the node's path, with the text-node-with-a-link message, and the stored page is unchanged;
- `validateSite` refuses a `control` nested deeper in a page's own tree, at its path;
- a `control` inside a component's slot still validates;
- `describe_page` marks a stored page-level control `broken` ("control outside any component paints nothing");
- `describe_page` marks a slot control the component does not declare `broken`, and leaves declared ones alone;
- the generated L1 reference states that a control is valid only inside its component's slot.
Regression scope: existing REQ-96 / REQ-349 / capture-fold UATs.