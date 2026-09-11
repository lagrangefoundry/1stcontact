---
uid: acceptance_criterion-17f275a7
id: AC-1741
type: acceptance_criterion
title: The account's identifier is opaque and derived from nothing a human chose;
  the label is separate
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:26.036516+00:00'
updated_at: '2026-09-11T06:28:26.036516+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

An account's identifier is opaque: it is not a function of anything the invite
supplied, and it is not a function of anything a human chose. Two invites
carrying identical human inputs — the same account name, the same display name —
for two different people produce two unrelated identifiers, and neither
identifier contains any word it was given. The human-readable label supplied with
the invite is stored on the account, where it can be changed later without
changing the identifier.

## Verification

Issue two invites differing only in email address, with an identical account name
and display name. Assert the two account identifiers differ, that neither
contains any fragment of the supplied name, and that the supplied label is
readable back from the account record.
