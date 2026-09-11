---
uid: acceptance_criterion-890af8ec
id: AC-1744
type: acceptance_criterion
title: An address differing only in case or padding is the same person, at invite
  and at login
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:37.516685+00:00'
updated_at: '2026-09-11T06:28:37.516685+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

An email address identifies a person irrespective of letter case and surrounding
whitespace, on both paths. An invite for an address differing from a known one
only in case or padding is recognised as the same person and creates nothing new;
a login presenting a differently-cased form of an invited address is admitted.

## Verification

Invite an address, then invite the same address upper-cased and padded with
spaces: assert the operation reports "not created" and reports the same person.
Then attempt admission with the upper-cased form and assert it is admitted.
