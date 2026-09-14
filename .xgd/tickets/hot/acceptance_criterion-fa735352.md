---
uid: acceptance_criterion-fa735352
id: AC-1801
type: acceptance_criterion
title: A single title longer than the whole budget is clipped and still named, never
  dropped
created_by: martin-github@westhead.me
created_at: '2026-09-14T06:28:32.642505+00:00'
updated_at: '2026-09-14T06:52:07.448087+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-3cf3d57b
  kind: behavior
  regression_only: false
---

## Criterion

A single document whose title is longer than the entire character budget is
**clipped and still named**, never dropped. The notice reports that one document
arrived and shows the beginning of its title, and remains bounded in length.

A notice that said something had arrived while naming nothing would announce an
event and withhold the only part of it that is actionable.

## Verification

Present one arrival whose title is several times the budget. Confirm the notice
reports one document, contains the leading characters of that title, and stays
within a small constant of the budget.