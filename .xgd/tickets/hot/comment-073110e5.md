---
uid: comment-073110e5
id: COMMENT-3956
type: comment
title: Comment on request REQ-330
created_by: xgd
created_at: '2026-09-26T18:59:54.199450+00:00'
updated_at: '2026-09-26T19:46:04.271932+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-c217d41a
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "77557323-855b-4d08-b329-4514b1b730ac",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ccfa099b-a920-4879-96f2-0f3da6eb8eaa-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T18:59:05.445031+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ccfa099b-a920-4879-96f2-0f3da6eb8eaa-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T19:32:08.282671+00:00" -->
#### Claude
I'll start by reading the ticket to understand what's being asked.

I have the full picture. Let me record the design on the ticket before coding.

Ticket is scoped. Cutting the branch now.

Now the validator rule for set-chrome agreement.

Now the invariant rules.

Now I'll rewrite `zoomHtml` and add the set machinery.

Now let me finalise the block with the auto-name refinement and splice it in.

Now the autoname attribute, the `ZoomGroup` type, state field, and the zoom script.

Now wire the flush and the script into document/fragment assembly.

Now the UAT suite.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="c2308b34-1db9-4f1a-ab68-52e47b0258af-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T19:46:01.830870+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->