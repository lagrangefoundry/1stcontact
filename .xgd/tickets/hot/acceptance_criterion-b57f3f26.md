---
uid: acceptance_criterion-b57f3f26
id: AC-2172
type: acceptance_criterion
title: 'Only an owner of the business may add or invite into it: a non-owner, including
  a platform operator, is refused 403 on every add and invite route, the dev-open
  path is refused, an empty address or empty selection is 400'
created_by: xgd
created_at: '2026-11-01T18:27:41.242742+00:00'
updated_at: '2026-11-07T07:21:36.348690+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The add route (`POST /api/people/add`), the invite draft (`GET /api/people/invite`)
and the invite send (`POST /api/people/invite`) are all gated on the caller being
an owner of the business they are scoped to — the same condition for every
business, not the fulfilment gate:

- a customer who owns their business may add and invite into it, and is refused
  403 on each route when scoped to a business they do not own, such as the
  1st Contact business;
- holding the platform-operator capability, which opens a business without a
  membership, does not make the holder an owner: without an owner membership they
  are refused 403;
- the dev-open loopback path, which carries no admission, is refused 403;
- an add with an empty or whitespace-only address is refused 400 with a sentence
  saying an address is needed; an invite naming no contact is refused 400.

A refused add or invite writes nothing and sends nothing.

## Verification

As an owner of a customer business, add an address and invite the resulting
contact; assert both succeed. Scoped to the 1st Contact business without an owner
membership there, assert the add, the invite draft and the invite send are each
refused 403. As a platform-operator holder with no owner membership on the scoped
business, assert 403 on each. On the dev-open loopback path, assert 403 on each.
As an owner, post an empty address to add and assert 400; post an invite with no
ids and assert 400. After each refusal, assert no person row was written and the
mail port received no message.
