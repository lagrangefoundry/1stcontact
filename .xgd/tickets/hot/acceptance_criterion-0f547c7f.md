---
uid: acceptance_criterion-0f547c7f
id: AC-2384
type: acceptance_criterion
title: A generated picture is marked as generated where the Library shows where a
  file came from
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-08T06:42:28.530581+00:00'
updated_at: '2026-11-08T06:42:28.530581+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-39c992d3
  kind: behavior
  regression_only: false
---

## Criterion
A generated material has `origin` = `generated`, a value of the material origin field that is separate from description_model. The Library shows that value under its "Where it came from" information for the file. Predicates over material can select generated material by origin.

## Verification
After a generation, read the material through the Library and assert that its origin is `generated` and that "Where it came from" shows it. Run a ticket query with the predicate `fields.origin = generated` for the business and assert that it returns exactly the generated material and no uploaded material.