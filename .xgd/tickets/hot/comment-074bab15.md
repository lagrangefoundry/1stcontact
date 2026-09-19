---
uid: comment-074bab15
id: COMMENT-3271
type: comment
title: Comment on request REQ-283
created_by: xgd
created_at: '2026-09-19T19:34:01.151420+00:00'
updated_at: '2026-09-19T19:54:37.641070+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7ccc3268
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "a8d92802-4844-40a3-97d7-21a360b75fbc",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="ab369da3-90e4-4177-8136-40735578da09-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T19:33:21.663788+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ab369da3-90e4-4177-8136-40735578da09-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-19T19:54:21.253061+00:00" -->
#### Claude
Now let me make the changes. Starting with `host-core.ts`.

Now add the agent surface into `extraSurfaces`:

Now the priming/manager block:

Now add `HostDeps.summary`, the `sessionContextSurface` helper and `summaryTriggerText`:

Now I'll revise that block for the ledger-as-log design:

Now let me update `ledger-core.ts` with a read port and entry splitting:

Now `roles.ts` — the provider names, renderers and registration:

Now add the memory renderer and registration to `roles.ts`:

Now the prose in `priming.json` — templates, the reminder entry, and the stale `about` note:

Now update the "TEMPLATES ARE PROSE TOO" note, which no longer counts right:

Now finish `host-core.ts`: fix the provider registration and add the two helpers.

Now fix the `summaryTrigger` wiring I added earlier, and add `sessionContextSurface`:

Now add `sessionContextSurface` and wire imports:

Now the imports in `host-core.ts`:

Now the Worker wiring — `ai.ts` and `tickets.ts`:

Now the `read()` implementation on `chatLedger` and `append_body` on `TicketStore`:

Now `append_body` on the `TicketStore` interface:

Now let's typecheck:

Now the new UAT. Let me check the workers-test harness for D1 + the scripted model client:

Now let me write the UAT files.

<!-- xgd-turn id="ea9391ba-56a8-488b-9bfe-57f35b5f0631-user" -->

<!-- xgd-chat role="user" ts="2026-09-19T19:54:36.764886+00:00" -->
#### You
Sorry there were some last minute changes to the ticket, please re-read them

<!-- xgd-chat-end -->