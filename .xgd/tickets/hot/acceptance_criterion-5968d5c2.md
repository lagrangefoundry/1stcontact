---
uid: acceptance_criterion-5968d5c2
id: AC-1750
type: acceptance_criterion
title: A grant that has not ended admits and one whose end has passed refuses
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:01.303156+00:00'
updated_at: '2026-09-11T06:29:01.303156+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A grant's end date is evaluated at admission, from both sides: a person whose
account holds a grant that has not yet ended is admitted, and the same person is
refused once that grant's end has passed. The refusal reports "no eligible grant"
to the operator. An open-ended grant (no end recorded) does not expire.

## Verification

Invite an address with a grant ending in the future and assert admission
succeeds. Move that grant's end into the past and, with nothing else changed,
attempt admission again: assert it is refused and the reported reason is the
entitlement. Both directions are required — one alone would pass against code
that always denied, or against code that never evaluated the date at all.
