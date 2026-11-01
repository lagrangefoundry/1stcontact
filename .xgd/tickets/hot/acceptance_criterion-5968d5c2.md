---
uid: acceptance_criterion-5968d5c2
id: AC-1750
type: acceptance_criterion
title: A grant whose end has passed makes its business unselectable; the person is
  refused only when no business holds an admitting grant
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:01.303156+00:00'
updated_at: '2026-11-01T01:33:27.009156+00:00'
completed_at: null
last_field_updated: title
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

A grant's end date is evaluated at admission, from both sides: a business whose
grant has not yet ended is selectable and reports that grant, and the same
business becomes unselectable — reporting no grant — once that grant's end has
passed. An open-ended grant (no end recorded) does not expire. The person is
refused, with "no eligible grant" reported to the operator, only when none of
their businesses holds an admitting grant; a lapsed business alongside an
entitled one does not refuse them.

## Verification

Invite an address with a grant ending in the future and assert admission succeeds
with that business selectable. Move that grant's end into the past and, with
nothing else changed, attempt admission again: assert the business is reported
unselectable with no grant, and — since it is the person's only business — that
admission is refused with the entitlement as the reported reason. Drive the
all-lapsed refusal with two businesses, both lapsed, so it cannot pass on code
that stops at the first. Both date directions are required — one alone would pass
against code that always denied, or that never evaluated the date at all.
