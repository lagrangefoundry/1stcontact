---
uid: acceptance_criterion-aa26d407
id: AC-1740
type: acceptance_criterion
title: An invite creates the person, the account, the owner membership and the active
  grant, all readable back
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:18.291102+00:00'
updated_at: '2026-09-11T06:37:30.275587+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A single invite operation, given an email address, creates every record the
login path will later look for:

- a **person**, held against the platform's own tenant, recorded as invited
  (an invitation timestamp is set) and not yet seen (no first-arrival timestamp);
- an **account** that is a registered tenant the site storage will serve, not
  merely an identifier written on another record;
- a **membership** joining that person to that account in the owner role, active;
- a **grant** against that account with a plan, a source recording that an
  administrator issued it, an active status, a start, and the end the caller
  supplied (absent for an open-ended grant). The grant records the address it was
  made to as well as the account, because an address is the claim key for a grant
  made before an account exists and is also the audit record of who received it.

The operation reports that the person was newly created.

## Verification

Issue one invite for an address not seen before, then read each record back from
storage independently of the operation's own return value — an operation that
reported what it meant to write would otherwise pass having written nothing.
Assert the person's invitation stamp is set and their first-arrival stamp is
absent; the membership names the reported account with the owner role; the grant
names the same account, the plan, the administrator source, an active status and
the address; and the account is registered as an active tenant.