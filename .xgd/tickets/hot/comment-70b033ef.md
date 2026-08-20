---
uid: comment-70b033ef
id: COMMENT-1408
type: comment
title: Comment on request REQ-19
created_by: xgd
created_at: '2026-08-20T21:37:42.054356+00:00'
updated_at: '2026-08-20T21:38:46.705916+00:00'
completed_at: null
last_field_updated: body
status: null
fields:
  subject_uid: request-22aa8ea3
  kind: chat_transcript
---

<!-- xgd-turn id="c0c8a37e-3d16-4a8d-a66c-41b5408e82c5-user" -->

<!-- xgd-chat role="user" ts="2026-08-20T21:37:38.325239+00:00" -->
#### You
think this ticket has been superseeded by development that went in a different direction. If so please move it to abandoned.

This was (kind of) covered by the creation off xgd.dev

<!-- xgd-turn id="c0c8a37e-3d16-4a8d-a66c-41b5408e82c5-assistant" -->

<!-- xgd-chat role="assistant" ts="2026-08-20T21:38:46.565851+00:00" -->
#### Claude
Agreed — REQ-19 is superseded. Moved to `abandoned`.

I checked before doing it, and two things confirm your read:

- **The demonstration site changed.** `storage/sites/` holds `gigabytealchemy` and `xgd` — there is no `1stcontact` site any more. The xgd.dev build is what's actually being driven to premium polish (recent commits: background grids, grid weight tuning, responsive layout track), so it's carrying the ceiling-proof role REQ-19 was written for.
- **The framework pivoted underneath it.** REQ-19's acceptance criteria are phrased in the pre-pivot model ("built entirely from our own modules"), which no longer describes the architecture — layout is L1 (DOC-23) and "module" now means behavior module (DOC-25). Even the intent as written couldn't be graded today.

I appended an "Abandoned — superseded" section to the ticket body rather than replacing anything, recording both reasons and noting that the underlying intent (a real site driven to sycamore-class polish as the counterweight to coverage-histogram-driven module work) lives on in the xgd.dev build and the DOC-21 growth loop. If a 1stcontact.io marketing site is wanted later, that should be a fresh REQ against the L1 model.

No code touched, so nothing to commit.

<!-- xgd-chat-end -->