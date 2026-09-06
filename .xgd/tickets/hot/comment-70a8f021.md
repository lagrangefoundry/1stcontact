---
uid: comment-70a8f021
id: COMMENT-2298
type: comment
title: Comment on request REQ-200
created_by: xgd
created_at: '2026-09-06T19:45:54.827375+00:00'
updated_at: '2026-09-06T20:30:46.492632+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-4af0cf7f
  kind: chat_transcript
---

<!-- xgd-turn id="f82d57cf-195c-41c5-99c4-8ed016e3edb8-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T19:45:09.481814+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="f82d57cf-195c-41c5-99c4-8ed016e3edb8-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T20:16:45.800779+00:00" -->
#### Claude
Now the behaviour props seam:

Now register it in the catalog, registry, and exports:

Now the L2 preset:

Now wire the renderer to hand capabilities down:

Now `public-site`: session reading and the apex.

Now the routes change for the apex, then `index.ts`:

Now the UATs:

Now the public-site UATs:

<!-- xgd-turn id="7053a0fe-277e-48a4-b1aa-f7a0932e3349-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T20:30:46.045289+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->