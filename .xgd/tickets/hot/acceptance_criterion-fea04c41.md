---
uid: acceptance_criterion-fea04c41
id: AC-1759
type: acceptance_criterion
title: The check that failed is recorded for the operator, distinguished per reason
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:36.162904+00:00'
updated_at: '2026-11-01T10:15:23.372616+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The distinction the caller is not told is still available to the operator:
every refusal is recorded with the reason that caused it and the address it
concerned, and the reasons are distinguishable from one another — an unknown
person, an inactive person, no active membership, no address at all, and no
eligible grant are five different recorded answers. The first four are
admission refusals. No eligible grant is not an admission refusal (membership
admits); it is recorded when an admitted person with nothing selectable makes a
request that needs a business. The record is structured rather than prose, so
refusals can be queried out of the platform's own operational logs.

## Verification

Drive each admission refusal cause in turn and assert the reason reported for
each is distinct and names the check that failed. Then request through the
Worker as each refused caller, and as an admitted person (terms accepted) whose
only grant has lapsed asking for a business-scoped route; assert each is
refused, and that the operational log holds a structured record carrying each of
the five reasons with the address it concerned (none for the address-less
caller).
