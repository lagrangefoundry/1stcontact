---
uid: comment-b164723c
id: COMMENT-7901
type: comment
title: Comment on bug BUG-369
created_by: xgd
created_at: '2026-11-06T02:22:45.305867+00:00'
updated_at: '2026-11-06T02:40:52.267531+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-1ff04fdc
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d36970f9-6427-4dc0-86ac-02499c1ec379",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="f7b377ff-b469-41f9-bcda-c6ac8647d7d5-user" -->

<!-- xgd-chat role="user" ts="2026-11-06T02:22:20.824933+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
If this bug is a dupe, please close it as wont_fix with an explanation in its body referencing the duplicate

<!-- xgd-turn id="f7b377ff-b469-41f9-bcda-c6ac8647d7d5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-06T02:40:51.600377+00:00" -->
#### Claude
Checking the checkout component: the `cancel` control looks like an `<a>` while `continue` is a `<button>`, which would explain the height difference.

Next I'll render the ticket's exact tree (stretch row → `button.*` boxes → controls) in Chromium to confirm the cause before changing anything.

Setting up the worktree's `node_modules` links (per the known recipe) so tests run against the branch's framework.

The worktree already had `node_modules` provisioned by `branch cut`. As a result, my linking loop created stray symlinks *inside* directories it already linked to. Finding and removing them.

Main checkout untouched; the strays are all inside the worktree. Removing them.

Worktree ready. Now writing the failing Chromium UAT that reproduces the ticket's tree.

Writing the Chromium UAT now (the ticket's exact row/box/control tree).

Skipped — Chromium isn't reachable from a plain vitest run in the sandbox. Checking how browser suites are meant to be run.

Using the single-process Chromium workaround that sandboxed sessions use.

Reproduced exactly: Cancel's label is 11px off-centre, and the hug boxes differ by 22px (the ticket saw ~21). Implementing the fix.

Close — a 2px difference remains. Measuring the two controls directly.

GREEN. Now the regression scope: suites that render controls or boxes, plus checkout.

zsh doesn't word-split `$FILES`; re-running with `${=FILES}`.

50 failures, mostly worktree/environment suites (env files, dev server, builder origin). Running the same files against the unchanged renderer to separate pre-existing failures from mine.

The only differences are 4 tests in `builder-workspace-origin`. That suite serves webui components and is known to break in worktrees. Re-running it alone with the fix applied.

Clean. Checking this project's version-bump convention before committing.

Committing the fix and UAT first, then updating the ticket body.

Now merging back: lock → merge xgd-working into the branch → bump → commit → `xgd-merge` → `move-to-free-coded`, retried in case another session's ticket commit races the version check.

BUG-369 is fixed: both checkout buttons now come out the same height with their labels centred. The fix is merged into `xgd-working` (version 0.2.799) and the ticket is at `free_coded`. It isn't a duplicate: BUG-367/368 dealt with controls that draw their own button look, not controls wrapped in a `button.*` box.

**Cause** (both in `packages/framework/src/l1/render.ts`):
1. A `box` was drawn as a plain block, so its control sat at the top. When the row stretched the box taller than the control, the label stayed at the top.
2. A link control (`cancel` is an `<a>`) with no fill or border of its own stayed inline. Its 12px top and bottom padding was drawn but took no space, while a `<button>`'s padding did. That's the ~21px height difference you saw.

**Fix:**
- A box that holds exactly one control now centres it vertically. The control fills the box's width, so its own `textAlign` still sets the horizontal position.
- An unpainted link control now counts its padding like a button does. Links that draw their own fill or border keep BUG-367's existing centring.

**Verification:**
- **New test:** `tests/test_UAT_FC_BUG-369_control_centred_in_its_box.test.ts` uses your exact layout and runs in Chromium. It failed before the fix (Cancel 11px off-centre, the two boxes 22px apart) and passes after.
  - In a row where both boxes shrink to fit, they still differ by 2px. That's `button.secondary`'s own 1px border on each edge, not the bug.
- **Older tests:** I ran 119 test files that cover controls, boxes and checkout. Every failure also fails with the old code and is an environment problem in the sandbox.
  - In that batch run, 4 tests in `reconciliation-builder-workspace-origin` failed only with the fix. Re-run on their own they pass, so they look like load-related flakes.
- **Typecheck:** the framework package typechecks clean.
- **Browser:** the sandbox can only start Chromium in a reduced mode (`CHROMIUM_LAUNCH_ARGS=--single-process`), so you may want to run the new test once outside it.

**To see it in the builder:** run `bin/deploy --env dev`, because dev serves a frozen snapshot until redeployed.

<!-- xgd-chat-end -->