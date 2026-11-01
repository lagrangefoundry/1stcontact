---
uid: acceptance_criterion-3f2339e0
id: AC-2190
type: acceptance_criterion
title: A malformed email address is refused inline in the panel without being sent
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:00.960693+00:00'
updated_at: '2026-11-01T19:33:00.960693+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
When the operator confirms an Email edit whose value is not a well-formed address, the edit control stays open and shows the message **"must be an address like name@example.com"**, and no save is sent. A well-formed address has exactly one `@`, a non-empty local part, a domain of at least two non-empty `.`-separated labels, and no whitespace. Each of these is refused: `a@b`, `a@@b.c`, `a@.c`, `a@b.`, `@b.c`, an address containing whitespace, and an empty value (Email is required, so clearing it is refused and not saved as nothing). `a@b.c` is accepted and sent. The panel and the server apply the same rule, so any address the panel accepts is also accepted by the server's shape check, and the reverse holds too.

## Verification
In the panel, for each malformed case, type the value into Email and confirm. Assert the control is still open, the message is visible, and the transport recorded no call. Type `a@b.c`, confirm, and assert the transport was called. Run the same list of shapes against the server write and assert the outcomes match (malformed → 400, well-formed → 200).
