---
uid: comment-7ce3825e
id: COMMENT-4873
type: comment
title: Comment on request REQ-373
created_by: xgd
created_at: '2026-10-04T00:14:34.521076+00:00'
updated_at: '2026-10-04T00:17:37.093083+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b8a37cee
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "527d7811-e058-443d-89f4-7ceda6e4b2a2",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="6c42001c-903e-45db-91b8-efda54e181bc-user" -->

<!-- xgd-chat role="user" ts="2026-10-04T00:13:17.473990+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="6c42001c-903e-45db-91b8-efda54e181bc-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-10-04T00:17:35.996347+00:00" -->
#### Claude
REQ-373 duplicates REQ-374, which has already landed, so I'm noting that on the ticket rather than writing code.

I didn't write any code for this ticket. REQ-373 is a duplicate of **REQ-374**, which has the same title and body, and REQ-374 has already done the work.

- **What REQ-374 adds:** the shared surface group gets `borderTop`, `borderRight` and `borderBottom` alongside the existing `borderLeft`. Each one takes the same strict `{ widthPx, color, style? }` shape as `border`.
- **How it combines with `border`:** a per-side border replaces only its own side. A `borderLeft` on its own gives the pull-quote rule, and `border` plus `borderTop` gives a full box with a different top edge.
- **Rendering and validation:** web and email output both draw per-side borders, and each side gets the same width limits `border` already has.
- **Where it stands:** the commits are `48032818cb` and `a77293dcb7`. Both are already on `xgd-working` (I checked), and REQ-374 is at `ready_to_reconcile`.

I added a note to the end of the REQ-373 body saying it's a duplicate of REQ-374 and why. I left its status at `draft`, because closing a ticket (as abandoned or won't-fix) is your decision, not mine. Unless you want REQ-373 for something different from REQ-374, I'd close it.

<!-- xgd-chat-end -->