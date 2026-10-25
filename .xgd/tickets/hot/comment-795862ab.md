---
uid: comment-795862ab
id: COMMENT-5496
type: comment
title: Comment on bug BUG-228
created_by: xgd
created_at: '2026-10-19T00:08:44.572115+00:00'
updated_at: '2026-10-19T00:19:58.841215+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-774e7e64
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "471b12ef-1509-4982-b589-6397e9183e75",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="70452c69-cb3a-4c57-9d83-7aa90e425127-user" -->

<!-- xgd-chat role="user" ts="2026-10-19T00:06:53.099226+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="70452c69-cb3a-4c57-9d83-7aa90e425127-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-19T00:19:57.275501+00:00" -->
#### Claude
Scope is clear. Let me look at access-sim and any existing tests for it.

The BUG-59 test is the closest pattern (forwarding to a stub upstream).

Now the fix in the worktree.

All green. Quick check that the new streaming test actually fails against the old buffering code:

Now commit. Let me check my notes on this project's version gate before committing.

So: commit without a manual bump, merge back, and let `move-to-free-coded` bump itself.

Merged. Now update the ticket body (preserving it, adding what landed), then promote.

I've fixed BUG-228: `bin/access-sim` no longer holds a response back until it has all of it. The chat's event stream now reaches the browser as the builder writes it. The ticket is at `free_coded`, merged into `xgd-working`.

**What changed in `bin/access-sim`:**
- **Streaming:** every response is now passed through as it arrives, not just the chat stream. Status and headers go out as soon as the builder answers, and the body follows piece by piece with no `content-length`. The existing header rules are unchanged: framing and encoding headers are dropped and all `set-cookie` values are kept.
- **Closed tabs:** if the browser disconnects mid-turn, the request to the builder is cancelled, so a closed tab no longer holds a builder connection open.
- **Unchanged:** builder redirects are still passed back rather than followed, and an unreachable builder still gets the 502 message.

**Tests:** I added `tests/test_UAT_FC_BUG-228_access_sim_streams.test.ts`, which runs the real `access-sim` in front of a stub builder. It checks three things:
- The first stream event arrives before the builder sends the second.
- A JSON response arrives with its status, body and both cookies.
- A client that disconnects closes the connection to the builder.

All three pass. I also ran the stream and disconnect tests against the old code and both failed there, so they do catch the bug. The other `access-sim` suites (BUG-59, REQ-192, REQ-204, BUG-152) still pass.

**Records:** fix commit `59dccd2060df9bee23eb858b8aa49102fcd390ba`, plus the version bump to 0.2.540 that the promotion step added. I updated the ticket body with a "What landed" section and the final test plan, and kept the original text. The branch and worktree are cleaned up.

One thing to know: this fix only covers responses. Request bodies are still read in full before being forwarded, which is fine for the chat.

Whether to promote to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->