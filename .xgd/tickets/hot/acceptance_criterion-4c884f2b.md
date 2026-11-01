---
uid: acceptance_criterion-4c884f2b
id: AC-2125
type: acceptance_criterion
title: Store openers refuse an empty scope with a programming-error refusal distinct
  from the configuration error
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T10:26:21.640815+00:00'
updated_at: '2026-11-01T10:26:21.640815+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-7102ffe3
  kind: behavior
  regression_only: false
---

## Criterion
Opening the site store or the ticket store with a scope whose business id is empty fails at construction, before any data access, with an error stating that the opener was given a scope with no business id and that it was constructed by hand. The error is not the "TENANT_ID is not configured" configuration error and not an "unknown tenant" error. No store handle scoped to the empty string is produced.

## Verification
Call each store opener with `{ businessId: '' }` and assert that it throws an error identifying the opener and the empty scope, and that the error is neither the configuration nor the unknown-tenant error.
