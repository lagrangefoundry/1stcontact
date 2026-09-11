---
uid: acceptance_criterion-fea04c41
id: AC-1759
type: acceptance_criterion
title: The check that failed is recorded for the operator, distinguished per reason
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:29:36.162904+00:00'
updated_at: '2026-09-11T06:37:27.556819+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

The distinction the caller is not told is still available to the operator: every
refusal is recorded with the reason that caused it and the address it concerned,
and the reasons are distinguishable from one another — an unknown person, an
inactive person, no active membership, no eligible grant, and no address at all
are five different recorded answers. The record is structured rather than prose,
so refusals can be queried out of the platform's own operational logs.

## Verification

Drive each refusal cause in turn and assert the reason reported for each is
distinct and names the check that failed, while the caller-facing response for
each remains identical (see the refusal-shape criterion). Assert the operational
record for a refused request carries both the reason and the address.