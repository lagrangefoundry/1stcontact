---
uid: comment-5680b786
id: COMMENT-7906
type: comment
title: Comment on bug BUG-373
created_by: xgd
created_at: '2026-11-06T20:06:31.250425+00:00'
updated_at: '2026-11-06T20:28:41.599062+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-702efd90
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "dbcb1cef-7f53-4437-bcae-8ff0c8c62b5f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="2d2845ca-b75b-461c-9a0f-5f717502efb7-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T20:06:05.645920+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="2d2845ca-b75b-461c-9a0f-5f717502efb7-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T20:28:35.260409+00:00" -->
#### Claude
Not a duplicate. Starting the free-coding flow.

Now the code. Let me look at the render control case and the checkout component.

Still mapping the code: found how the design's type roles are defined; now finding where a node's `role` becomes CSS, so I can give selects a form type default.

Design emerging: a control currently inherits its container's type (so a select in a heading slot gets heading size). I'll check whether anything depends on that before changing it.

Good template found. Now locating the "layout check" that reports problems to the consultant (item 5).

Now the BUG-370 `action_row_left` check — the closest analogue to what I need to add.

Now let me see how the BUG-370 UAT exercises the layout check.

I have enough to design. Checking two last details: where `surfaceFill`/border are emitted for a control, and where the slot template's roles get resolved.

Now the type change: controls stop inheriting their container's type.

Now the checkout's ship-to takes Continue's lettering and height.

The default preset is resolved before `checkoutActions` sees it, so its roles are already gone. I'll give the preset's ship-to Continue's role and matching padding directly.

Now the layout check for full-width or unpadded form fields.

Checking whether layout-check kinds must be registered elsewhere (priming, docs, guard tests).

Only the module itself. Typecheck time.

Typecheck is clean. Writing the UATs now, using the BUG-368 Chromium harness.

Known worktree gap (generated artifacts missing) — copying them from the main checkout per my notes.

Skipped — Chromium isn't found from this worktree. Checking my notes on the test harness.

Run with `CHROMIUM_LAUNCH_ARGS=--single-process`. I'll also give the layout fixture a second section, which the layout runner needs.

5 of 7 pass. The height is off by exactly 2px in both cases, which looks like the border compensation. Probing the computed values.

The CSS is right, so the 2px gap is in how Chromium lays out a select's line box. Measuring it.

The default page's padding should be computed the same design-aware way, so I'll drop the hard-coded padding from the preset.

All 7 pass. Removing the probe and running the neighbouring checkout and type-resolution suites for regressions.

21 failures. Most look unrelated to this change (consultant role, deploy, money). Baselining those 12 files with my source changes temporarily reverted.

Same 15 failures on the clean baseline, so they predate this change. Now baselining the remaining 6 (the platform build/deploy suites and copy-edit form presentation).

One difference: `AC1038` (copy-edit form presentation) passed on the baseline but failed with my change. Investigating.

Passes on its own with the change. The earlier failure came from running alongside the build suites, which rewrite generated files. Checking for files those suites may have rewritten.

All six are red on the clean baseline too. Adding the `BUG-237` filter.

Final regression sweep: the type change affects every control, so I'll run every remaining suite that mentions a control node.

`AC718` and `REQ-105` are about config keys and schema groups, so they're unrelated. `REQ-349` (a style audit of a control) could be mine. Baselining it and the rest.

The baseline run printed nothing. Re-running with output.

`REQ-349` is red on the baseline too. `REQ-269` skipped there because I forgot the Chromium flag, so I'm re-running it both ways.

Every remaining failure is also red on the clean baseline, so none come from this change. Now updating the ticket body (keeping the existing text and appending what landed), then committing.

Committing on the branch.

Committed. Now the merge-back and version loop: merge xgd-working into the branch, bump, fast-forward, promote.

Promoted to `free_coded`. `render.ts` auto-merged with someone else's change, so I'll re-verify the merged result (typecheck and the BUG-373 UATs) before cleaning up.

BUG-373 is fixed and merged into xgd-working, and the ticket is at `free_coded`. It wasn't a duplicate: BUG-367/368/370 cover the checkout's buttons, and nothing else covered the select. Commits are `875f4d5e` (the fix) and `18631da5` (version 0.2.806). The ticket body keeps your original text, with what landed and the test plan added below it.

**What changed**
- **Every select drawn by a module** (`render.ts`):
  - It is as wide as its longest option, never more than 480px or its column, and it fills the column on phones. A page that stretches its slot can't make it full width.
  - It sits where its container aligns its contents, so in a centred checkout it is centred.
  - Any side the page left without padding gets some, with extra room on the right for the arrow.
  - If the page gives it no look of its own, it gets a border and a dropdown arrow in its text colour.
- **Type** (`text-style.ts`): a form control no longer picks up its slot's heading or display size. It uses its own type, or the site's body type. **This applies to every control, not only selects.** The renderer can't tell a size the page set from one inherited from a heading slot, so this had to change where type is resolved. Any button or field that currently relies on its container's type will change size.
- **Checkout** (`l2/checkout.ts`): the region select takes Continue's lettering and is exactly as tall as the action buttons. Matching padding wasn't enough, because Chromium gives a select a 2px shorter line than a button in the same type. So the select, Continue and Cancel now share an explicit line height.
- **Layout check**: a new check reports a select or text field in a form or checkout as a problem in two cases:
  - **Too wide:** on desktop it is wider than 560px and spans at least ¾ of the screen.
  - **Unpadded:** at any width it has almost no inner padding.

  I added the "¾ of the screen" condition after a first run showed that, without it, ordinary contact forms in a 720px column would be flagged to the consultant.

**Tests**
- `tests/test_UAT_FC_BUG-373_checkout_select.test.ts`: 8 UATs, all passing. They cover desktop width, centring, padding and height; type; border and arrow; phone width; the default checkout page; and the new layout check, including that it doesn't flag an ordinary content column.
- The existing checkout UATs (BUG-367/368/370) all pass after the merge.
- In the wider run over the related suites, every failure is also red on clean xgd-working without my change, so none are new.
- I changed one other test: the BUG-237 hidden-text UAT now ignores the new "too wide" finding, because its test page draws form fields edge to edge. That suite was already red before this change.
- The browser tests only run in the sandbox with `CHROMIUM_LAUNCH_ARGS=--single-process`; without it they skip silently.

It is ready for you to promote to `ready_to_reconcile` when you're happy with it.

<!-- xgd-chat-end -->