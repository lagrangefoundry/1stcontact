---
uid: acceptance_criterion-c65eae15
id: AC-1748
type: acceptance_criterion
title: An invited person is admitted and bound to an account and one effective grant,
  deterministically
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:53.383038+00:00'
updated_at: '2026-09-11T06:37:29.135988+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

An invited person presenting their proven address is admitted, and the admission
reports both an account they may operate — resolved deterministically, so the
same person with the same memberships always resolves to the same account — and
the single effective grant their access is running on.

## Verification

Invite an address, then attempt admission with it. Assert the attempt succeeds,
that the reported account is the account the invite created, and that the
reported grant is the grant the invite created. Repeat the admission and assert
the same account is reported both times.