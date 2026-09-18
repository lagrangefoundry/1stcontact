---
uid: comment-dfecee22
id: COMMENT-3145
type: comment
title: Comment on request REQ-275
created_by: xgd
created_at: '2026-09-18T22:38:58.064168+00:00'
updated_at: '2026-09-18T23:10:17.191070+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-2a60571e
  kind: chat_transcript
---

<!-- xgd-session
{
  "id": "2d62049d-a1e2-432e-895b-16016b082d1a",
  "role": "chat",
  "backend": "claude_code",
  "filter_tool_use": false,
  "backend_ref": ""
}
-->

<!-- xgd-turn id="b3e8fa6e-f158-44b2-987e-b2b39a19df55-user" -->

<!-- xgd-chat role="user" ts="2026-09-18T22:38:07.889645+00:00" -->
#### You
Please implement this ticket following the FREE CODING protocol. If you have any questions that you need to answer before implementation please ask them here

Project note (additive — does not override the above):
Please make sure you have clarity on the user interaction model and the core design. That you understand the API contracts, what you should be built from scratch and when code must be reused. We try to minimise external dependencies and maximise code reuse because the cost of code is not just in its creation but its maintenance.
Please do make implementation decisions and low level UI decisions yourself. It is generally cheaper to fix the details in a working system than it is to try to get them all right upfront, provided the general shape is correct

<!-- xgd-turn id="b3e8fa6e-f158-44b2-987e-b2b39a19df55-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-09-18T23:10:16.340789+00:00" -->
#### Claude
Chromium works in this sandbox with `--single-process` (REQ-262's escape hatch), so I can run the probe over all three references rather than just shipping it. Starting the protocol.

Now the prototype probe, to see what real reference pages actually surface.

Design settled. Writing the probe module.

Now the triage core and the runner.

Now factor the loopback server out of `reextract.ts` so both callers share it.

Now the CLI subcommand.

Clean. Now run the audit for real across all three references.

Now landing the four axes the audit surfaced.

Now the raw→capture projection in `sections.ts`.

Now register the four axes in `CAPTURE_SCHEMA_AXES`, bump the schema once, and record them in the coverage register.

Now the fixture and UATs.

⚠️ Chat generation failed: Claude Code CLI streaming timeout (>1800s)

<!-- xgd-chat-end -->