---
uid: comment-294aa8bc
id: COMMENT-5473
type: comment
title: Comment on bug BUG-220
created_by: xgd
created_at: '2026-10-18T00:17:10.815075+00:00'
updated_at: '2026-10-18T00:21:35.690240+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-a460e5c8
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "45c66d72-54fd-4085-9a1a-7db3b57b62ad",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f44b101a-6ac1-43a0-ad64-bc3cf33de06c-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T00:15:14.084987+00:00" -->
#### You
Please investigate the root cause or the implementation of this ticket. Report your findings here so that we can discuss them. Do not make any code changes until we are aligned.

<!-- xgd-turn id="f44b101a-6ac1-43a0-ad64-bc3cf33de06c-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T00:21:33.839022+00:00" -->
#### Claude
I've found the control-node schema and the one place that checks control names (the behavior-module validator). Now reading that check, the renderer, and `describe_page`.

Confirmed the renderer and audit paths; now checking where page-level writes are validated and whether the builder manual mentions page buttons.

Last check: how the builder's node vocabulary describes `control`.

## BUG-220 findings: a `control` node at page level renders nothing and nothing flags it

**Root cause:** a page-level `control` node is always invisible, and no check looks at it. Only the module code checks control names, and only inside a component's slots.

### Why it renders nothing
- **Renderer.** The `case 'control'` branch in `packages/framework/src/l1/render.ts:4687` looks the name up in `state.controls`. If it isn't there, it outputs an empty string. That is deliberate (REQ-96): it stops a bare, browser-styled `<input>` appearing.
- **Who fills `state.controls`.** Only `renderL1Fragment` (`render.ts:5452`) does, and it is the call a component uses to draw its own slots. `renderL1Document` (`render.ts:5371`) draws the page itself and never fills it.
- **So the page's own tree can never show a control.** It doesn't matter which name or which modules are on the page. Your builder's gold-filled, padded buttons were dropped every time.
- **There was nothing to show anyway.** A `control` node has no text of its own. A button's label comes from the component that declares it, so there was no "Ask for an appointment" for it to paint.

### Why it passes validation
- **Page check.** `validateL1` (called for each page from `packages/site-schema/src/validate.ts:57`) only checks a control's style values (`validate.ts:594`). Its name is any non-empty string, and where the node sits is never checked.
- **Component check.** The only binding check is `validateBehaviorControls` (`packages/framework/src/modules/behavior.ts:580`). It walks `instance.slots` only. Inside a component's slot it already refuses a name the component doesn't declare. So the ticket's "names a control no module declares" case is already covered there; the gap is page level only.

### Why `describe_page` raises nothing
- **The audit skips it.** `auditPage` in `tools/generate/src/cli/style-audit.ts:396` only looks at a control if `controlInfo` returns something.
- **`controlInfo` needs a component.** It returns `undefined` unless the visit has a `module` (`style-audit.ts:306`). A page-level control has none, so every rule skips it. Its padding and fill even make it look fully styled.

### How the builder was misled
The builder learns the node types from the schema's own doc comments (`l1-vocabulary-core.ts`, which also generates REF-l1). The `control` field says "The module-declared element this node paints (a field name, `submit`, …)". Nothing says it only works inside a component's slot. The "an unbound name renders nothing" note is in a comment the builder may never see. Nothing points it to the right way to make a page-level button: a `text` node with a `link`.

### Proposed fix (matches the ticket's notes)
1. **Validator: refuse any `control` in a page's own tree, everywhere.** No component lookup is needed, because such a node can never render. The message would say: "a control paints a component's element and only works inside that component's slot; for a call to action use a `text` node with a `link`, fill and padding". The obvious home is `validateL1`'s structural rules.
2. **`describe_page`:** mark as `broken`:
   - any page-level control ("outside any component, paints nothing");
   - any control inside a slot whose name the component doesn't declare, which can happen on pages stored before a component changed.
3. **Builder guidance:** reword the doc comment on the `control` field so the generated vocabulary says where controls are allowed and gives the page-level button recipe. Then regenerate REF-l1.
4. **Tests:** `test_UAT_FC_BUG-220_*` covering three things: the write is refused, existing pages get the `broken` mark, and a valid control inside a component still validates and renders.

### Points to settle before I code
- **Existing pages.** `validateOrThrow` checks the whole site before any write. Once (1) lands, any stored site that already has a page-level control will refuse every edit, on any page, until that node is removed. Options:
  - accept that, since the error points at the exact node;
  - remove such nodes automatically when the site loads;
  - or make (1) a check on writes only.

  I'd accept it: the node renders nothing, so deleting it changes nothing visible. But it's your call.
- **The capture pipeline.** It runs `validateL1` too (`tools/generate/src/l1/fold.ts:5223`, `probes.ts`, `structure.ts`), and `fold.ts:5003`/`5066` create control nodes for captured forms. From reading the code they go into the form's slot, not the page's own tree. If any reach the page tree mid-pipeline, the new rule would break capture. I'd confirm this with the capture UATs before committing.
- **A first-class button primitive.** I'd leave this out, as the ticket suggests.

I haven't changed any code or the ticket. Once you agree on the approach and the existing-pages question, I'll write the design into the ticket body and start the fix on its own branch.

<!-- xgd-chat-end -->