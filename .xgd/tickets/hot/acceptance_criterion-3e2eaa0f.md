---
uid: acceptance_criterion-3e2eaa0f
id: AC-1745
type: acceptance_criterion
title: Provisioning refuses when the platform tenant is unconfigured, naming what
  is missing
created_by: martin-github@westhead.me
created_at: '2026-09-11T06:28:41.756606+00:00'
updated_at: '2026-09-11T06:28:41.756606+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7b1025b8
  kind: behavior
  regression_only: false
---

## Criterion

When the platform's own tenant is not configured, provisioning refuses rather
than guessing a default. The refusal names the missing configuration and where it
has to be set, and no person, account, membership or grant is created.

## Verification

Attempt an invite with the platform tenant setting empty. Assert the operation
fails with a configuration error naming the missing setting, and that no records
were written.
