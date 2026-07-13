---
uid: acceptance_criterion-0e301b8b
id: AC-608
type: acceptance_criterion
title: contentWidth is honored uniformly across the width-bearing content modules
created_by: xgd
created_at: '2026-07-13T20:38:26.945509+00:00'
updated_at: '2026-07-13T20:38:26.945509+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-d555b990
  kind: behavior
  regression_only: false
---

## Criterion
The same `contentWidth` dial caps the content column consistently across every width-bearing content module — hero (its subhead measure), text-block, and services-grid. A given `contentWidth` value produces the same resolved measure regardless of which of these modules it is set on (a named step resolves to that step's measure; a literal to its exact value).

## Verification
Set the same `contentWidth` value (e.g. `"4xl"` and a literal `896`) on a hero, a text-block, and a services-grid; confirm each renders its content column capped to the identical resolved measure.
