---
uid: comment-9ebd9398
id: COMMENT-3959
type: comment
title: Comment on request REQ-329
created_by: xgd
created_at: '2026-09-26T19:02:06.592176+00:00'
updated_at: '2026-09-26T19:45:59.239957+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-9f377353
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "0ab0626a-2f10-4e6e-985d-bed5a8540c11",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="cb43bcf5-4e18-4ce7-a517-96d45256f3b6-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T19:01:17.052373+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="cb43bcf5-4e18-4ce7-a517-96d45256f3b6-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-26T19:32:53.049214+00:00" -->
#### Claude
Now let me write the unified claim projection in `motion.ts`.

Now the schema — the scroll-motion union:

Now update the `l1` index to export the new projection helpers:

Now the validator: replace `oneMotionDriver` with the per-property exclusivity rule, and handle a list of tracks.

Now the walk body — replace the scroll-track block:

Now add the two new checker functions next to `checkEntrance`:

Now the renderer — make `scrollTrackRules` handle a list of tracks.

Now update the tests that encode the superseded rule.

Now the shared-axis-group sweep, where `scrollTrack` was an alternative:

Now fix the stale prose in `req105` and write the REQ-329 UAT suite.

Now the REQ-329 UAT suite:

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-turn id="e9751c85-fd40-4777-ada7-ff4d3051b20d-user" -->

<!-- xgd-chat role="user" ts="2026-09-26T19:45:57.954450+00:00" -->
#### You
please complete the free-coding of this ticket

Project note (additive — does not override the above):
Please be aware that in this current chat environment, background jobs die. Please be sure to run any tests in the foreground.

<!-- xgd-chat-end -->