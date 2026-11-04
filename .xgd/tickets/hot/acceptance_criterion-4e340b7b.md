---
uid: acceptance_criterion-4e340b7b
id: AC-2315
type: acceptance_criterion
title: bin/seed against a store without the schema fails with guidance
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:19.693856+00:00'
updated_at: '2026-11-04T18:28:58.053022+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
If the store refuses the fixture (for example, because the schema has not been applied), `bin/seed` exits 1. It prints the store's error output on stderr, followed by guidance that names the migrations-apply command for the same target.

## Verification
Run the seed against a local D1 without the baseline schema. Assert exit 1, that stderr contains the store's error, and that stderr contains the migrations-apply command.