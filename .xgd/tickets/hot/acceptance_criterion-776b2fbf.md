---
uid: acceptance_criterion-776b2fbf
id: AC-1602
type: acceptance_criterion
title: 'Every refusal is the same refusal: one uncacheable, unindexable message whatever
  the reason, with the reason available to the operator'
created_by: xgd
created_at: '2026-09-04T05:52:45.162910+00:00'
updated_at: '2026-09-04T06:00:21.907422+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-e7871ed7
  kind: behavior
  regression_only: false
---

## Criterion

Every caller who verifies as a person but is not admitted receives the same refusal,
whatever the reason: the same status, the same body telling them their access has ended and
to get in touch, byte for byte. A stranger who was never invited and an invited person whose
grant has expired cannot be told apart from the response.

The refusal arrives before any part of the surface behind it: no page, no asset and no data
is served to an unadmitted caller.

The refusal is not cacheable and not indexable, so one refusal never becomes another
caller's answer and the surface is not published by having refused.

The reason the caller is not told is nevertheless available to the operator, in a form that
can be searched out of the deployment's own logs and that names both the reason and the
email it applied to.

## Verification

Present two verified identities that fail for different reasons — one never invited, one
invited with a grant whose end has passed. Assert the two responses have identical status
and identical bodies, and that the body is the single refusal message. Assert the response
carries directives forbidding caching and indexing. Assert no content from the surface
behind the refusal appears in either response. Separately, assert the operator-facing record
of the refusal distinguishes the two reasons and names the email.