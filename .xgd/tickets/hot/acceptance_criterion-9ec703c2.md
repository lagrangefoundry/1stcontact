---
uid: acceptance_criterion-9ec703c2
id: AC-2184
type: acceptance_criterion
title: Several grants on one business sit under a single Business and Role cell spanning
  one line per grant
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-01T19:00:45.144904+00:00'
updated_at: '2026-11-01T19:00:45.144904+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-0034d937
  kind: behavior
  regression_only: false
---

## Criterion
When a person's detail covers several grants on the same business, the joined table shows one line per grant. A single Business cell and a single Role cell span all of those lines, so the grants read as several grants on one business rather than as several businesses. No grant is dropped or merged into a single "current" value.

## Verification
Seed a person who runs business X and has two grants on X. Open their detail. Assert X's business name appears in exactly one cell, spanning 2 rows. Assert the role cell also spans 2 rows. Assert both grants' plans appear on separate lines.
