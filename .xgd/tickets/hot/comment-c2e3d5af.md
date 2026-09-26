---
uid: comment-c2e3d5af
id: COMMENT-3951
type: comment
title: Comment on request REQ-326
created_by: xgd
created_at: '2026-09-25T23:51:16.519971+00:00'
updated_at: '2026-09-26T06:50:23.777393+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-da2bf042
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "d5d010e6-c848-4639-87a7-1e6b8984f088",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="0b1d61fe-9b14-4882-be27-35d038e72771-user" -->

<!-- xgd-chat role="user" ts="2026-09-25T23:50:03.106799+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="0b1d61fe-9b14-4882-be27-35d038e72771-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T00:23:29.125121+00:00" -->
#### Claude
Now let me record the implementation shape on the ticket and mark it as being worked.

Now cutting the branch.

Now the schema union.

Now types.ts and the l1 index exports.

Now the validator: envelope bound, structural rules, and the per-behaviour checks.

Now the renderer.

Now the BUG-48 provocation map must gain the two new rules.

Now let me write the UATs.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="a4fcdb96-5f6c-4df2-8e5b-123e113d28cb-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T06:50:22.665127+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->