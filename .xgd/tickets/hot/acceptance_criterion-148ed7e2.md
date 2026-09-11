---
uid: acceptance_criterion-148ed7e2
id: AC-1747
type: acceptance_criterion
title: A proven address with no person behind it is refused, and the refusal creates
  nothing
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:49.519820+00:00'
updated_at: '2026-09-11T06:28:49.519820+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A proven email address with no person behind it is refused, and the refusal
creates nothing: no person, no account, no membership and no grant. Arrival at
the door is not a route to existing.

## Verification

Count the stored people. Attempt admission with an address that was never
invited. Assert the attempt is refused, that the reported reason is "no such
person", and that the count of stored people is unchanged afterwards.
