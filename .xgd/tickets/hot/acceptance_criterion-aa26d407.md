---
uid: acceptance_criterion-aa26d407
id: AC-1740
type: acceptance_criterion
title: An invite creates the person, then the business's owner membership and active
  grant together, all readable back
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:18.291102+00:00'
updated_at: '2026-11-01T01:33:34.756445+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A single invite operation, given an email address, creates every record the
login path will later look for — the person first, then the person's first
business with its owner membership and active grant written together:

- a **person**, held against the platform's own tenant, recorded as invited
  (an invitation timestamp is set) and not yet seen (no first-arrival timestamp);
- a **business** that is a registered tenant the site storage will serve, named
  with the label the invite supplied (the address when none is supplied), not
  merely an identifier written on another record;
- a **membership** joining that person to that business in the owner role, active;
- a **grant** against that business with a plan, a source recording that an
  administrator issued it, an active status, a start, and the end the caller
  supplied (absent for an open-ended grant). The grant records the address it was
  made to as well as the business, because an address is the claim key for a
  grant made before an account exists and is also the audit record of who
  received it.

The operation reports that the person was newly created and the one business it
provisioned.

## Verification

Issue one invite for an address not seen before, then read each record back from
storage independently of the operation's own return value — an operation that
reported what it meant to write would otherwise pass having written nothing.
Assert the person's invitation stamp is set and their first-arrival stamp is
absent; the membership names the reported business with the owner role; the grant
names the same business, the plan, the administrator source, an active status and
the address; and the business is registered as an active tenant.
