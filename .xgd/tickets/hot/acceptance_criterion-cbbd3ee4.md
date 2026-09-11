---
uid: acceptance_criterion-cbbd3ee4
id: AC-1751
type: acceptance_criterion
title: A grant whose start is in the future does not admit
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:05.030173+00:00'
updated_at: '2026-09-11T06:29:05.030173+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A grant whose start is in the future does not admit. Access written ahead of time
is a promise about the future, not access today, so an operator cannot hand out
access by scheduling it.

## Verification

Invite an address, move the created grant's start into the future leaving
everything else untouched, and attempt admission. Assert it is refused and the
reported reason is the entitlement.
