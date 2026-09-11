---
uid: acceptance_criterion-766fc357
id: AC-1758
type: acceptance_criterion
title: Every refusal is byte-identical to the caller, forbidden rather than a challenge,
  and neither cached nor indexed
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:32.280175+00:00'
updated_at: '2026-09-11T06:29:32.280175+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

Every refused caller receives the same answer, whatever the reason. A caller with
no record and a caller whose grant has expired receive byte-identical responses:
the same status and the same single message, which tells the visitor their access
has ended and to get in touch, and names no check. The refusal is a forbidden
answer rather than an authentication challenge — the caller already proved who
they are, so sending them back round the login loop would produce the same
identity and the same refusal forever — and it is marked as neither storable by a
cache nor indexable, because one cached refusal would become everybody's answer,
including the entitled.

## Verification

Request the builder as a fully verified identity that was never invited, and then
as an invited person whose grant has been expired. Assert both responses carry
the same status and the same body bytes, that the status is the forbidden one
rather than the authentication-challenge one, that the body contains no hint of
which check failed, and that the response declares itself non-storable and
non-indexable.
