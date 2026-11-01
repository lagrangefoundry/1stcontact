---
uid: acceptance_criterion-c7cfa975
id: AC-1743
type: acceptance_criterion
title: Re-inviting a known address reports the existing person and creates nothing
  — no second person, no business, no grant
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:33.821547+00:00'
updated_at: '2026-11-01T18:26:37.045911+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Inviting an address that already has a person in the business reports that
person and reports that nothing was created. It does not fail with a uniqueness
error, and it creates no second person, no business, no membership and no grant —
the invite never writes a business or a grant, so re-inviting cannot either.

## Verification

As an owner, invite one address twice through the invite route. Assert the second
call succeeds, reports "not created" and reports the same person id as the first.
Count the stored people for that address in the business and assert exactly one;
assert the number of businesses, memberships and grants is unchanged by both
calls.
