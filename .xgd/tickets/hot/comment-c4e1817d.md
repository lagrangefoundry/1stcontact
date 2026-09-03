---
uid: comment-c4e1817d
id: COMMENT-2184
type: comment
title: Comment on request REQ-179
created_by: xgd
created_at: '2026-09-03T20:19:44.390119+00:00'
updated_at: '2026-09-03T21:38:04.710159+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-b813aa4a
  kind: chat_transcript
---

<!-- xgd-turn id="e106e6a0-cffc-40cd-8d57-1640729b1752-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T20:17:34.915540+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ba1f1485-d6c4-4bdd-8cee-12a673d2c4d2-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T21:06:19.329151+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="ba1f1485-d6c4-4bdd-8cee-12a673d2c4d2-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-03T21:36:32.044022+00:00" -->
#### Claude
Now let me look at scope.ts and index.ts to understand how the server picks the business/site today.

Now let me record the technical scope on the ticket and mark it in progress.

Now cutting the branch.

Now the server-side changes:

Good. Now `index.ts` passes the admission through:

Now I'll add the scope prefix to `api.js`:

Now `config.js` additions and the new `business.js` module:

Now the main rewire in `app.js`:

Now rewire the `panel.getSite()` consumers and the destroy/return handle:

Now `main.js`:

Now CSS for the new chrome:

Now let's run the existing builder suites to see what breaks.

Now the toolbar-lifetime and workspace-chrome suites:

Now let me run the whole node suite to find other breakage.

Now the workers project (router / index changes):

Now let me write the endpoint UAT:

Now the chrome UAT:

All 11 pass. Now let's run the full suite again to confirm no regressions.

While that runs, let me review the final `app.js` for coherence.

<!-- xgd-turn id="b17cdc6d-d27f-4e0b-ba22-d7f1a39bd350-user" -->

<!-- xgd-chat role="user" ts="2026-09-03T21:38:04.479815+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->