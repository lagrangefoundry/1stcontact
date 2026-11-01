---
uid: acceptance_criterion-71a76c49
id: AC-2231
type: acceptance_criterion
title: A failed request that is not a 401 is handled exactly as before
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T20:50:02.488615+00:00'
updated_at: '2026-11-01T21:29:09.374649+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e674c60a
  kind: behavior
  regression_only: false
---

## Criterion

Only the two signs in the expired-session criterion count as an ended session:
a 401, or a fetch that rejects. Every other response is handled exactly as it
was before.

- **An origin that merely failed (for example a 500) is not a session
  failure.** No session notice appears. The opening calls keep their earlier
  defaults: a failed status call mounts the builder unblocked, and a failed
  businesses call leaves no switcher and an unscoped session. A site listing that
  fails for any reason other than a refused session is still treated as an empty
  list.
- **A valid session is never told it ended.** When every call succeeds, the
  builder loads normally, across a reload too, and no session-ended path runs.
  A client that reacts to authentication failure must not sign out someone whose
  session is working.
- **Other callers keep their own error contracts.** A copy that the validator
  rejects still reports the validator's sentence. The assistant's stream still
  turns a refusal into a frame in the conversation. A 401 on any of these calls
  additionally raises the session strip, but does not change what the caller
  itself reports.

## Verification

Answer the status and businesses calls with 500 and assert the builder mounts,
with no session notice and the documented defaults in place. Answer every call
successfully, load twice, and assert that no session-ended subscriber is ever
notified. Answer a non-load call (for example a copy save) with 401 and assert
two things: the strip appears, and the call's own error reaches its caller in the
same form it did before.