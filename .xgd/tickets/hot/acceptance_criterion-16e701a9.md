---
uid: acceptance_criterion-16e701a9
id: AC-2174
type: acceptance_criterion
title: GET /api/people reports canInvite and canFulfil as two separate flags
created_by: xgd
created_at: '2026-11-01T18:27:49.545479+00:00'
updated_at: '2026-11-01T18:27:49.545479+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The people list reports, beside the people, two separate flags: `canInvite`,
true when the caller is an owner of the business they are scoped to, and
`canFulfil`, true only when the caller is an owner of the 1st Contact business,
whose product is businesses. An owner of a customer business therefore sees
`canInvite` true and `canFulfil` false. Neither flag is the gate: each route asks
its own question again.

## Verification

Request the people list as an owner of the 1st Contact business scoped to it and
assert both flags are true. Request it as an owner of a customer business scoped
to theirs and assert `canInvite` is true and `canFulfil` false. Request it as a
caller holding no owner membership on the scoped business and assert `canInvite`
is false.
