---
uid: acceptance_criterion-6dec52fd
id: AC-1071
type: acceptance_criterion
title: The declaration and its grant are checkable before anything runs, reporting
  no problems and naming the surface and the role they configure
created_by: xgd
created_at: '2026-08-10T09:05:53.786391+00:00'
updated_at: '2026-08-10T09:05:53.786391+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-93905de4
  kind: behavior
  regression_only: false
---

## Criterion

The surface's declaration and the grant that configures a consumer are data, and
they can be checked together against the declaration format at author time —
before any session exists. For the pair shipped in this repository the check
reports an empty problem list, an overall pass, the single surface it declares,
and the role the grant configures.

## Verification

Run the format check over the shipped declaration and grant. Assert: problems is
an empty list; the overall result is a pass; the reported surface set is exactly
the one surface; the reported role set contains the builder assistant's role.
