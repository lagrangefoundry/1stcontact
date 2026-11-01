---
uid: acceptance_criterion-3a93576d
id: AC-2079
type: acceptance_criterion
title: A person who exists but holds no business is refused as no_membership, and
  re-inviting them provisions a business
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T01:33:58.556817+00:00'
updated_at: '2026-11-01T01:33:58.556817+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A person whose record exists but who holds no live business is refused at login,
with the membership reported as the reason. Re-inviting that person repairs it:
a business is provisioned for them and they are admitted to it, while the
re-invite reports that the person was not newly created and no second person
exists for the address. Re-inviting a person who already holds a business is
unchanged — it reports the first business they hold and writes nothing.

## Verification

Create a person with no membership. Attempt admission and assert it is refused
with the membership as the reason. Re-invite the same address and assert the
result reports "not created" with a newly provisioned business; attempt admission
again and assert it succeeds listing that business as selectable; count stored
people for the address and assert exactly one.
