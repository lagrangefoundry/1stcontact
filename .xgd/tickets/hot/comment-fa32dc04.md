---
uid: comment-fa32dc04
id: COMMENT-5523
type: comment
title: Comment on bug BUG-231
created_by: xgd
created_at: '2026-10-19T23:41:15.551577+00:00'
updated_at: '2026-10-20T00:03:57.773205+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-fd780c38
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "fdaafc34-cfa3-4eaa-a462-e547c829f21f",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="171c1a5d-d375-4864-b361-fd8393e3123a-user" -->

<!-- xgd-chat role="user" ts="2026-10-19T23:40:54.290404+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="171c1a5d-d375-4864-b361-fd8393e3123a-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-19T23:48:49.207149+00:00" -->
#### Claude
Ticket scope is clear; I've cut the `free-BUG-231` branch and am now surveying all banners and the existing close-control styling.

Writing the shared helper now.

Now the edits in app.js.

Now the CSS, placed beside the banner rules (not at the file tail, per REQ-408).

Now the UATs. Checking how the existing suites mount the blocked states.

All four pass. Checking the suites that scan `builder.css` and the builder source.

These look unrelated; baselining them against the unchanged code.

All three fail identically without my change, so they're pre-existing; the file-level import failures are the known worktree-location artifact. Checking lint/version bump.

No lint script; per my notes the free_coded gate bumps the version itself. Committing.

Now updating the ticket body before merging.

The gate bumped the version itself (0.2.546) and recorded both commits. Tearing down the branch.

I've implemented BUG-231: banners the client can act on now have a dismiss ×, and the banners that explain why the builder is locked don't. The work is merged into `xgd-working` and the ticket is at `free_coded`. I didn't promote it to `ready_to_reconcile`; that's your call.

**What changed**
- **One shared helper.** A new file, `apps/control-app/src/builder/banner.js`, builds every builder banner. Turning on its `dismissible` option adds a real `<button aria-label="Dismiss">` at the top right, and Escape anywhere inside the banner closes it too. Either way it only removes the banner: a failed publish is still unpublished, and a second failure with the same message draws a fresh banner. The rule about which banners can be dismissed is written at the top of that file.
- **Dismissible:**
  - the "This site was not published" banner;
  - the operator banner in `business.js`, which keeps its "back" button with the × after it.
- **Not dismissible:**
  - "this builder is not configured";
  - the no-business banner;
  - the progress banner while a publish runs.
  - I also left the "Sign in again" notice (`session.js`) alone. It's the same kind of "this is why nothing works" message, and I didn't convert it.
- **Look:**
  - The builder has no × on its modals, so I matched the chip remove control: a muted × with no box that goes full strength on hover or keyboard focus.
  - The builder had no minimum tap size defined anywhere, so I used 44px, which applies on touch screens.
  - The × is drawn by CSS, so a banner's text is still exactly its message when copied.

**Tests**
- The four new UATs in `tests/test_UAT_FC_BUG-231_dismissible_banners.test.ts` pass, along with the existing banner suites for REQ-173, REQ-179, REQ-222, REQ-250, REQ-367 and BUG-207 (58 tests).
- Three other UATs fail (BUG-52, BUG-53, REQ-259), but they fail the same way with my changes removed, so the failures were already there. Many more test files failed to load at all; that's the known problem with running from a worktree, not this change.

**Ticket**
- The ticket now has a "What landed" section added to its body; your original text is unchanged.
- It records two commits: the code commit `6c2cc30` and `75da3b2`, where the gate bumped the version to 0.2.546.

**One loose end:** `xgd branch clean BUG-231` refused to run because the BUG-230 session holds the merge lock. The work is merged, so only the worktree is left over. Running `xgd branch clean --stale` once that lock is released will remove it.

<!-- xgd-turn id="b9951970-e638-49fe-a14f-853293d3f67d-user" -->

<!-- xgd-chat role="user" ts="2026-10-20T00:03:56.720008+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->