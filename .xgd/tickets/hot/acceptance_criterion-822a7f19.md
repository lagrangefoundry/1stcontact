---
uid: acceptance_criterion-822a7f19
id: AC-2316
type: acceptance_criterion
title: Applying the schema migrations never applies the development fixture
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T18:17:20.452135+00:00'
updated_at: '2026-11-04T18:17:20.452135+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-5b5be809
  kind: behavior
  regression_only: false
---

## Criterion
Applying the migration set to an empty store (as every environment does) yields the schema with none of the fixture's people, addresses or businesses. The fixture is reached only by running `bin/seed`.

## Verification
Apply all migrations to an empty D1 and assert that none of the seeded addresses or business names exist. Assert that the fixture is not part of the migration set.
