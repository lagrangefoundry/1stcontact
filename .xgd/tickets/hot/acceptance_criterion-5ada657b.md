---
uid: acceptance_criterion-5ada657b
id: AC-2194
type: acceptance_criterion
title: The server refuses a malformed email on a record change with 400 and leaves
  the row unchanged
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:33:07.559186+00:00'
updated_at: '2026-11-01T20:02:33.472928+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a55c2f35
  kind: behavior
  regression_only: false
---

## Criterion
If the email in a record change does not have a well-formed shape (exactly one `@`, a non-empty local part, a domain of at least two non-empty `.`-separated labels, no whitespace), the response is **400** with an error that names Email and says it must be an address like name@example.com. This includes an empty email. The person's stored record is unchanged, including the name if one was sent in the same request.

## Verification
Against real D1, for each malformed shape (`a@b`, `a@@b.c`, `a@.c`, `a@b.`, `@b.c`, an address with whitespace, empty), submit it as the email. Assert 400, an error message containing "must be an address like name@example.com", and that a re-read shows the original email and name.