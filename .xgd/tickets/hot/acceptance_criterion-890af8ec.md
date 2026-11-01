---
uid: acceptance_criterion-890af8ec
id: AC-1744
type: acceptance_criterion
title: An address differing only in case or padding is the same person, at the invite
  route and at login
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:37.516685+00:00'
updated_at: '2026-11-01T18:27:05.644094+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

An email address identifies a person irrespective of letter case and surrounding
whitespace, on both paths. The invite route stores the address casefolded and
trimmed, and an invite for an address differing from a person already in the
business only in case or padding is recognised as that person: the same row is
reported, nothing is created, and no second row exists. A login presenting a
differently-cased or padded form of an address on record is admitted as that
person.

## Verification

As an owner, invite a mixed-case address padded with spaces and assert the stored
address is lower-cased and trimmed. Invite the same address in a different case
and assert the response reports "not created" with the same person id, and that
exactly one person holds the address in the business. Provision a business for
that person, then attempt admission with an upper-cased form of the address and
assert it is admitted as that person.
