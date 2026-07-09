---
uid: acceptance_criterion-b707bd3a
id: AC-474
type: acceptance_criterion
title: Ambiguous or missing screenshot target fails with an error
created_by: xgd
created_at: '2026-07-09T20:20:14.122571+00:00'
updated_at: '2026-07-09T20:20:14.122571+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-3ae5b34e
  kind: behavior
  regression_only: false
---

## Criterion
`1c shot` requires exactly one target. Supplying both a `<slug>` and `--url` fails with an error stating the two are mutually exclusive. Supplying neither a slug nor `--url` fails with an error indicating a target is required. In both cases no PNG is written.

## Verification
Invoke the shot command with both a slug and `--url` and assert it raises/exits with a mutual-exclusivity error. Invoke it with neither and assert it raises/exits with a missing-target error. Assert no output PNG is produced in either case.
