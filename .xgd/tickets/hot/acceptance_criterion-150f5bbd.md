---
uid: acceptance_criterion-150f5bbd
id: AC-1756
type: acceptance_criterion
title: A person whose own record is not active is refused, without disturbing their
  account
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:24.426928+00:00'
updated_at: '2026-09-11T06:37:27.971299+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A person whose own record is not active is refused, and the refusal is about the
person rather than about their account: the account's membership and grant are
not consulted and are left untouched, so suspending one person does not disturb
the account other people are living on. The reason reported to the operator names
the person's status rather than the membership or the entitlement.

## Verification

Invite an address, set that person's record to a status other than active leaving
the membership and grant intact, and attempt admission. Assert it is refused, that
the reported reason names the person's status, and that the membership and grant
read back unchanged and still active.