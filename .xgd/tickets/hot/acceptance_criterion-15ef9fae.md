---
uid: acceptance_criterion-15ef9fae
id: AC-1753
type: acceptance_criterion
title: A membership that is not active refuses that person and leaves the account's
  grant untouched
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:12.668299+00:00'
updated_at: '2026-09-11T06:37:28.394715+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A membership that is no longer active refuses that person whatever the account's
grant says, and leaves the grant untouched — removing one person from an account
must not remove the access the account's other people are living on. A membership
refuses when it is withdrawn, when its status is not active, and when its own
expiry has passed; the reported reason is the membership rather than the
entitlement.

## Verification

Invite an address, withdraw the created membership leaving the grant alone, and
attempt admission: assert it is refused, that the reported reason is the
membership, and that reading the account's grant back still shows it active.
Repeat for a membership whose status is set to something other than active and
for one whose expiry is in the past.