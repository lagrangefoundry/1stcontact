---
uid: acceptance_criterion-2b82c3cf
id: AC-2045
type: acceptance_criterion
title: list_references lists every captured reference with its name, recorded address
  and capture time, and an empty list when nothing is captured
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-10-27T21:19:06.225730+00:00'
updated_at: '2026-10-28T03:56:17.149714+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-31204812
  kind: behavior
  regression_only: false
---

## Criterion
`list_references` returns `{references: [...]}` with one entry per captured reference held for the site. Each entry carries `bundle` (its name), plus `url` and `capturedAt` taken from that bundle's own capture record (not decoded from the name). With nothing captured it returns `{references: []}` and no error.

> Aligned to code per fix_plan iteration 6 ruling (aligned_to_tip): the earlier clause "null when a bundle has no capture record" is retired. `readCapture` throws on a bundle with no `capture.json`, so that case is not part of this AC (see STORY-159 Known gaps).

## Verification
With an empty reference store, assert `{references: []}`. Seed two captures whose names are not reversible slugs of their URLs, and assert both entries are present with the URLs and capture times from their records.
