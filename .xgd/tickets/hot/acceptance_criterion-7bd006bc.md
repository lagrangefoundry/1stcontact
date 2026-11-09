---
uid: acceptance_criterion-7bd006bc
id: AC-2579
type: acceptance_criterion
title: get_library_item returns one item with its description, by catalogue name,
  filename or title
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:18:42.343670+00:00'
updated_at: '2026-11-09T23:18:42.343670+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a0b20525
  kind: behavior
  regression_only: false
---

## Criterion

`get_library_item` with an `item` naming exactly one catalogue item returns that item's full listing field set plus `description`. The description is the text recorded on the material for what the file shows or says, which is the same text the client's Library detail pane shows.

The item may be named by any one of:
- its catalogue name
- the client's filename
- its title

All three spellings return the same item.

## Verification

Seed a material item with a distinct catalogue name, filename, title and description body. Call `get_library_item` three times, once with each spelling. Assert that each response has the same `item` value, carries every listing field, and has `description` equal to the recorded description.
