---
uid: acceptance_criterion-c7cfa975
id: AC-1743
type: acceptance_criterion
title: Re-inviting a known address reports the existing person and account and creates
  nothing
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:33.821547+00:00'
updated_at: '2026-09-11T06:28:33.821547+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Inviting an address that already has a person behind it reports that person and
the account they already own, and reports that nothing was created. It does not
fail with a uniqueness error, and it does not create a second person, a second
account or a second membership.

## Verification

Invite one address twice. Assert the second call reports "not created", reports
the same person and the same account as the first, and does not raise. Then count
the stored people for that address and assert exactly one.
