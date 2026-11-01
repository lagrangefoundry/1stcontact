---
uid: acceptance_criterion-b57f3f26
id: AC-2172
type: acceptance_criterion
title: 'Only an owner of the business may invite into it: a non-owner, including a
  platform operator, is refused 403, the dev-open path is refused, an empty address
  is 400'
created_by: xgd
created_at: '2026-11-01T18:27:41.242742+00:00'
updated_at: '2026-11-01T18:27:41.242742+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The invite route is gated on the caller being an owner of the business they are
scoped to — the same condition for every business, not the fulfilment gate:

- a customer who owns their business may invite into it, and is refused 403 when
  scoped to a business they do not own, such as the 1st Contact business;
- holding the platform-operator capability, which opens a business without a
  membership, does not make the holder an owner: without an owner membership they
  are refused 403;
- the dev-open loopback path, which carries no admission, is refused 403;
- an invite with an empty or whitespace-only address is refused 400 with a
  sentence saying an address is needed.

A refused invite writes nothing.

## Verification

As an owner of a customer business, invite an address into it and assert success.
Scoped to the 1st Contact business without an owner membership there, assert the
invite is refused 403. As a platform-operator holder with no owner membership on
the scoped business, assert 403. On the dev-open loopback path, assert the invite
is refused 403. As an owner, post an empty address and assert 400. After each
refusal, assert no person row was written for the address.
