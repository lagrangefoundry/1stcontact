---
uid: comment-97b852a3
id: COMMENT-5564
type: comment
title: Comment on bug BUG-255
created_by: xgd
created_at: '2026-10-23T00:39:43.148354+00:00'
updated_at: '2026-10-23T00:45:11.286114+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-2cc15932
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "946eb5aa-ed55-4060-b22e-09354c1c2e06",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="badc9217-6a36-4a2a-aeaa-f39337aeca14-user" -->

<!-- xgd-chat role="user" ts="2026-10-23T00:38:14.101507+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="badc9217-6a36-4a2a-aeaa-f39337aeca14-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-23T00:45:09.445358+00:00" -->
#### Claude
I'm adding the "Don't have one" button next to Uploaded and checking the `set_ask` prompt text.

Now the edits.

Now the UAT, built on the BUG-216 harness.

Now the priming/surface budget UATs.

Copying generated artifacts into the worktree so the budget UATs can load.

Priming is 460 chars over the half-ceiling. Checking the baseline without my prompt edit:

Now the merge back into xgd-working.

Now I'll add the implementation record to the ticket, after the existing body.

BUG-255 is done and merged into xgd-working. Every plan-panel card that takes an upload now has a "Don't have one" answer, and the consultant's `set_ask` instructions now list the buttons the card offers.

- **The card:** any card that takes an upload (`input: upload` or `accepts_upload`) shows Upload / Uploaded / **Don't have one** / Skip. The new button's tooltip is "There isn't one to send". Clicking it saves an ordinary answer, "None — I don't have one", so the question moves to *What you've told us* as answered, not as Skipped. Cards that don't take uploads don't get the button. The wording is in `config.js` next to `PLAN_UPLOADED`, and the button looks the same as Uploaded.
- **The prompt:** I extended the description of `set_ask`'s `input` field in `plan-surface.json`. It now says an upload card offers pick files, "already uploaded", "don't have one" and Skip, and has no text box. So the question must never ask the client to type or say anything. When a typed alternative matters, the consultant should set `accepts_upload` on a typed question instead.

**Tests:** the new `tests/test_UAT_FC_BUG-255_upload_card_has_no_file_answer.test.ts` passes (3 tests: upload card, text question that accepts uploads, prompt wording). The existing BUG-216, BUG-196, REQ-401, REQ-389, REQ-390 and BUG-63 tests also pass.

**Two tests fail, both from before this change:**
- **BUG-129 (priming size):** it fails at 200920 against a limit of 200000, which is the same figure with and without my prompt edit. Field descriptions like this one don't count toward the priming text, so this fix adds nothing to it. The priming text is already slightly over the test's headroom limit, and that needs its own fix.
- **REQ-416 (hand-over line):** this one is a known failure on a clean checkout.

The ticket is at `free_coded` with commit `37cf7a9b`, version 0.2.585 and 2 story points. Its body has a new "Implementation (as landed)" section below the original text. Promoting it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->