---
uid: comment-35466d76
id: COMMENT-5488
type: comment
title: Comment on bug BUG-223
created_by: xgd
created_at: '2026-10-18T16:47:18.016913+00:00'
updated_at: '2026-10-18T16:50:23.082030+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: bug-7b4972f5
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d7996751-b874-4f7a-9713-186a766902ab",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ddf01b90-97d8-458c-8542-24af8a7d5478-user" -->

<!-- xgd-chat role="user" ts="2026-10-18T16:46:16.582162+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ddf01b90-97d8-458c-8542-24af8a7d5478-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-18T16:50:21.524683+00:00" -->
#### Claude
Ticket is clear; I've taken the session lock and am making the one-line declaration fix plus a UAT.

Now the UAT, modelled on REQ-356's in-memory plan port.

Confirming the UAT is red without the fix:

Red before, green after. Bumping version and committing only my files.

Committed. Now updating the ticket body with what landed, then moving it to `free_coded`.

I fixed BUG-223 and the ticket is now at `free_coded`.

**The fix:** in `tools/generate/src/cli/ai/plan-surface.json` I declared a new param type, `audience_list` (an array of objects), and pointed `update_brief.audiences` at it. This is the same fix REQ-408 used for `pin_notes`. No core code changed, because `update_brief` already stores the audiences list as it is given. `constraints` is still a list of strings, as its description says.

**Tests:** I added `tests/test_UAT_FC_BUG-223_update_brief_audiences.test.ts`, which goes through the real Toolbox (`box.run`):
- One `update_brief` call sends `audiences: [{who, priority}, …]` along with `business`, `constraints` and `quote`. The test checks what was actually stored: the audience objects, the other brief fields, and the quote in the plan body. It fails without the fix and passes with it.
- An object sent in `constraints` is still refused, and nothing is stored.

The new file and the REQ-356 and REQ-408 plan-surface suites all pass (20 tests).

**Commits:** `b8fac98` is the fix. The free_coded gate then added its own version bump, `7d39310` (0.2.532), and recorded both commits on the ticket. I worked directly on `xgd-working` under the session lock, so there was nothing to merge, and the lock is now released. I only committed my own three files. The other uncommitted edits in the tree (`cadence-core.ts`, `module-assets.ts`, a request ticket) belong to other work, and I left them alone.

Moving it to `ready_to_reconcile` is your call.

<!-- xgd-chat-end -->