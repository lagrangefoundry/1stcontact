---
uid: comment-bd9950c6
id: COMMENT-7882
type: comment
title: Comment on bug BUG-365
created_by: xgd
created_at: '2026-11-05T23:10:55.997761+00:00'
updated_at: '2026-11-05T23:28:14.681074+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-313c192b
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fd62e4b4-735f-46d8-9a01-aa02e88d0308",
  "role": "chat2",
  "backend": "claude_code+km",
  "filter_tool_use": false,
  "backend_ref": "a549ecd3-4255-4d82-ab6d-f61d2a62cca3",
  "chat_ticket_uid": "bug-313c192b"
}
-->

<!-- xgd-turn id="7ca8535388444710bcfe27037cae8c93-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T23:13:49.773279+00:00" -->
#### You
Triggered by: martin-github@westhead.me

Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

<!-- xgd-turn id="7ca8535388444710bcfe27037cae8c93-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T23:14:36.963456+00:00" -->
#### Claude
I'm reading the free-coding protocol, then I'll look at BUG-355's change and the overlay renderer.

Now the code: BUG-355's commit.

Reading the L1 sizing schema and how geometry-placed nodes are positioned.

Cutting the branch and marking work started; then I'll try to find the real hero's definition in the dev store to confirm its exact shape.

Now a probe: render the ticket's hero shape with the current code and measure it, to confirm the diagnosis before fixing.

Writing the regression test now (RED first).

Fresh worktree lacks generated artifacts; copying them from the main checkout.

Diagnosis confirmed: today the hero renders 128px tall (just the composition's padding) instead of 720. Now the fix in `composeSection`.

The fix works; the remaining failure is my test's shade detector catching something. Checking what it matched.

The video's own pause button matched the scrim's colour. I'll narrow the detector to the hero's direct layers.

Both suites green (9/9). Now the wider tests touching compositions, against the base for comparison.

19 files fail; checking them against the base by reverting my source change in place and rerunning just those.

Same 56 failures with and without the fix — all pre-existing, none introduced. Committing.

Now updating the ticket body with what landed, then merging back.

<!-- xgd-turn id="463b01a386bb41a18c1426a74cc4c072-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T23:25:38.114968+00:00" -->
#### You
Triggered by: martin-github@westhead.me

please complete the free-coding of this ticket

Blocking details:
- branch `free-BUG-365` still exists at `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365`
- branch HEAD: `3d9cc7746f7e0cb11b9d90d5400768defb29b4fb`

<!-- xgd-turn id="463b01a386bb41a18c1426a74cc4c072-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T23:26:06.746936+00:00" -->
#### Claude
Already merged and promoted (version 0.2.794, both SHAs recorded). Only the branch clean is left.

The free-coding of BUG-365 is finished. The only step left was removing the branch, and that's now done: `free-BUG-365` is cleaned up (worktree removed, branch deleted, lock released).

The earlier steps had already gone through:
- **Merged:** the fix (`60fe3c4b5d`) and the version bump to 0.2.794 (`3d9cc7746f`) are in `xgd-working`, through merge commit `12487de86b`.
- **Recorded:** the ticket lists both commits and has version 0.2.794.

The first clean attempt failed with "Operation not permitted" because I ran it after a `cd`. Running it on its own as `xgd branch clean BUG-365` worked.

I couldn't add a note to this conversation's summary: `lagrangefoundry.ai.agent_cli` isn't installed in the Python this shell uses.

<!-- xgd-turn id="c55e8c83c9534fa69ab472da19027304-user" -->

<!-- xgd-chat role="user" ts="2026-11-05T23:27:42.191129+00:00" -->
#### You
Triggered by: martin-github@westhead.me

please complete the free-coding of this ticket

Blocking details:
- branch `free-BUG-365` still exists at `/Users/martin/.xgd/worktrees/git_github.com_lagrangefoundry_1stcontact.git/free-BUG-365`
- branch HEAD: `3d9cc7746f7e0cb11b9d90d5400768defb29b4fb`

<!-- xgd-turn id="c55e8c83c9534fa69ab472da19027304-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-11-05T23:28:13.533935+00:00" -->
#### Claude
BUG-365 is fully free-coded. The blocking details you sent are out of date: `free-BUG-365` and its worktree were already gone by the time I ran `xgd branch clean BUG-365`, which reported "nothing to clean". I don't know what removed them.

Current state:
- **Ticket:** `free_coded`, version 0.2.794, with the fix commit `60fe3c4b5d517a74a88e1f2144b0b7fa3afa61b5` and the version bump `3d9cc7746f7e0cb11b9d90d5400768defb29b4fb` recorded.
- **Landed:** both commits are on `xgd-working`.
- **Clean-up:** no branch or worktree is left (and no prunable worktrees), and `.xgd/_locks` holds no BUG-365 merge lock.

**The fix** (in `packages/site-schema/src/l1/design.ts`, the `overlay` case of `composeSection`):
- **The cause:** on the code as it stood, a hero shaped like yours rendered 128px tall, which is just the composition's padding. It also had a full-section scrim added that it never had before BUG-355.
- **Text already placed over the clip:** the hero is now left exactly as built. Its markup is identical to the same hero with no composition: 720px, no scrim, the text group's gradient at its own size. Your shop's hero is this case.
- **Text in the normal flow (BUG-355's case):** the text still goes over the clip, and the section's minimum height is now the clip's stated height.

**Tests:** the new `tests/test_UAT_FC_BUG-365_overlay_hero_keeps_its_clips_height.test.ts` checks the 720px height at 375, 768 and 1280, and confirms there is no scrim. BUG-355's own tests still pass. Across the 187 related test files, 56 tests fail both with and without the change, so none of those failures come from it.

**Not covered** (also written into the ticket):
- A clip that states only an aspect ratio, not a height, gives the section no minimum height. Sections have no aspect-ratio setting in L1 yet.
- I didn't add the check that flags a hero whose height changes by more than 25% with no edit. It would need a before-and-after record of each page that the host doesn't keep. The regression test pins this shape instead, which the ticket accepts as the minimum.

<!-- xgd-chat-end -->