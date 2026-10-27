---
uid: acceptance_criterion-2b82c3cf
id: AC-2045
type: acceptance_criterion
title: list_references lists every captured reference with its name, recorded address
  and capture time, and an empty list when nothing is captured
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:06.225730+00:00'
updated_at: '2026-10-27T21:19:06.225730+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
`list_references` returns `{references: [...]}` with one entry per captured reference held for the site. Each entry carries `bundle` (its name), `url` (taken from the capture's own record, not decoded from the name) and `capturedAt`, the latter two being null when a bundle has no capture record. With nothing captured it returns `{references: []}` and no error.

## Verification
With an empty reference store, assert `{references: []}`. Seed two captures whose names are not reversible slugs of their URLs, and assert both entries are present with the URLs and capture times from their records.
