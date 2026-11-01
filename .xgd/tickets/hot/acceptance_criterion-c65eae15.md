---
uid: acceptance_criterion-c65eae15
id: AC-1748
type: acceptance_criterion
title: An invited person is admitted with the deterministic set of businesses they
  operate, each bound to its own effective grant
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:53.383038+00:00'
updated_at: '2026-11-01T01:33:25.108440+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

An invited person presenting their proven address is admitted, and the admission
reports the set of businesses they operate — each business carrying its own
identifier, its name and the single effective grant its access is running on. The
set is deterministic: the same person with the same memberships always receives
the same businesses in the same order. The admission carries no single top-level
account or grant beside that set.

## Verification

Invite an address, then attempt admission with it. Assert the attempt succeeds and
that the reported set holds exactly one business: the business the invite
created, with the name it was given and the grant the invite created. Assert the
admission exposes no top-level account identifier or grant. Repeat the admission
and assert the same set is reported, in the same order, both times.
