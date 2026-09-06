---
uid: comment-3dd62296
id: COMMENT-2297
type: comment
title: Comment on request REQ-199
created_by: xgd
created_at: '2026-09-06T19:45:47.660547+00:00'
updated_at: '2026-09-06T20:30:59.236374+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-ee6ed740
  kind: chat_transcript
---

<!-- xgd-turn id="c7b0f3ac-6ae7-4bdc-953d-731769d0becf-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T19:45:06.512519+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="c7b0f3ac-6ae7-4bdc-953d-731769d0becf-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-06T20:16:39.013844+00:00" -->
#### Claude
Now let me rework `templates.ts` so the render works on copy, not only on a ticket.

Now I'll replace lines 497–758 of `people.ts` with the two separate acts.

Now the new `invites.ts` — the composition that renders, sends, records and transitions.

Now add a narrow single-person read to `people.ts` and clean up `invites.ts`.

Now the route paths and handlers.

Now the panel's selection state, the `+` control, and the rewritten invite modal.

Now the CSS for the new controls.

Now update the module docstring in `people.js` and fix the remaining stale references.

Now update the test suites that call the old `invitePerson`, plus the fixture.

Now the REQ-186 suite, which pinned the old insert-or-update invite.

Now REQ-199's own UATs. First the workers-side one, driving the real send path.

Now the route-level coverage for `/api/people/add` and the invite draft, driven through the Worker.

Now the wider regression scope.

Now the REQ-188 axes suites.

<!-- xgd-turn id="79c3d0b3-aba5-409f-aa37-7a82bbb77339-user" -->

<!-- xgd-chat role="user" ts="2026-09-06T20:30:58.228242+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->