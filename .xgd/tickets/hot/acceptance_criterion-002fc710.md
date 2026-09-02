---
uid: acceptance_criterion-002fc710
id: AC-1499
type: acceptance_criterion
title: A conversation persists as a record found by its session identifier, with the
  transcript as a comment and the body left for a summary
created_by: xgd
created_at: '2026-09-02T00:31:17.727707+00:00'
updated_at: '2026-09-02T00:42:25.097278+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e07c589b
  kind: behavior
  regression_only: false
---

## Criterion

Because the conversation shapes share this vocabulary, an assistant session can be stored in the same
store as the client's material, and the whole mapping is observable:

- A session is created as a record of the conversation kind carrying its session identifier, and is
  accepted with the open state that kind's own lifecycle gives it — no state has to be supplied.
- Asking the account's store for records of the conversation kind whose session identifier matches
  returns exactly that record and no other.
- The transcript is kept as a comment on that record, marked as a transcript, and is listed back
  under it.
- The record's own body is not the transcript's home — it is left free for a maintained summary, so a
  session created without a body stays without one after its transcript comment is added.

## Verification

Through an account-scoped store, create a conversation record carrying a session identifier and
confirm it is accepted in the open state. Add a transcript comment to it, then list the record's
comments and confirm exactly one is returned, marked as a transcript, carrying the text supplied.
Query the store for records of the conversation kind matching that session identifier and confirm
exactly the created record is returned. Read the record back and confirm its body is still empty.