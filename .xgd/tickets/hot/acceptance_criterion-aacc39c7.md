---
uid: acceptance_criterion-aacc39c7
id: AC-1749
type: acceptance_criterion
title: 'Arrival is recorded on every attempt: first arrival never moves, latest always
  does, refused visits included'
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:57.347593+00:00'
updated_at: '2026-09-11T06:28:57.347593+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A person's arrival is recorded whenever they present a proven address. The
first-arrival timestamp is set once and never moves afterwards; the latest-arrival
timestamp is updated on every attempt. The record is made before the admission
decision, so an attempt that is ultimately refused is recorded as an arrival too —
"did the customer whose grant expired ever try?" is a question about a refused
visit.

## Verification

Invite an address and admit it once: assert a first-arrival stamp now exists.
Admit it again at a later moment: assert the first-arrival stamp is byte-identical
to before and the latest-arrival stamp has advanced. Then make that person's
account ineligible, attempt admission again, assert it is refused, and assert the
latest-arrival stamp advanced anyway while the first-arrival stamp did not move.
