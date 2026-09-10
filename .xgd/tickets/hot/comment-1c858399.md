---
uid: comment-1c858399
id: COMMENT-2629
type: comment
title: Comment on request REQ-223
created_by: xgd
created_at: '2026-09-10T23:02:44.599599+00:00'
updated_at: '2026-09-10T23:33:16.979348+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-7d9f8b2e
  kind: chat_transcript
---

<!-- xgd-turn id="e6705588-4436-41fc-a493-8faf091b0c68-user" -->

<!-- xgd-chat role="user" ts="2026-09-10T23:02:26.154406+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="e6705588-4436-41fc-a493-8faf091b0c68-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-10T23:33:16.730314+00:00" -->
#### Claude
Now let me set up the branch and start work.

Good. Now the RPC entrypoint in control-app.

Now wire it into `public-site/src/index.ts`.

Now the wrangler config for public-site.

Now let me write the main workers UAT.

<!-- xgd-chat-end -->