---
uid: comment-ecbaa13f
id: COMMENT-2921
type: comment
title: Comment on request REQ-243
created_by: xgd
created_at: '2026-09-13T23:00:39.181953+00:00'
updated_at: '2026-09-13T23:30:44.187562+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-a0910456
  kind: chat_transcript
---

<!-- xgd-turn id="9adb8171-c391-413e-8733-c8900e1f8b6b-user" -->

<!-- xgd-chat role="user" ts="2026-09-13T23:00:16.866501+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="9adb8171-c391-413e-8733-c8900e1f8b6b-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-13T23:30:44.119134+00:00" -->
#### Claude
I'll start by reading the ticket to understand the scope.

Now let me look at the test harness for workers tests.

Working tree is clean and REQ-242 has already merged. Let me set up the branch.

Now I'll implement. Starting with the framework module.

Now the meta and migration:

Now the migration step:

Now open the template vocabulary in `control-app/src/templates.ts`:

Now add the store-contents check and the reserved-key policy to `templates.ts`:

Now the send path in `lead.ts`:

Now update `captureLead` and the reporting:

Now wire the publish check into the router:

Now update the test fixture and typecheck:

Clean. Now let's run the existing regression scope:

Now the node-side tests and the new UAT file:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-chat-end -->