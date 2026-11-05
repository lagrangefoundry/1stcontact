---
uid: acceptance_criterion-cabfdebc
id: AC-2328
type: acceptance_criterion
title: The baseline migration carries the change-log tables ticket_changes and ticket_change_floor
  as the ticket component declares them
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-05T21:07:09.874483+00:00'
updated_at: '2026-11-05T21:07:09.874483+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-1500b111
  kind: behavior
  regression_only: false
---

## Criterion

The database baseline migration creates the change-log tables `ticket_changes` and
`ticket_change_floor` (with their indexes) with the same columns, keys and constraints as the
ticket component's own schema statements, so a database built from the baseline supports the
Library's change feed with no further migration. `ticket_change_floor` is keyed by tenant — one
row per business — consistent with the schema's rule against composite keys made of data.

## Verification

Apply the baseline migration to an empty database and compare the two tables' definitions with
those the ticket component declares: identical. Open a change subscription against that database
and observe it deliver a material write.
