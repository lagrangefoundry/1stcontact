---
uid: acceptance_criterion-d5433844
id: AC-2584
type: acceptance_criterion
title: place_on_site refuses non-republishable material with NOT_REPUBLISHABLE and
  a missing site store with NO_SITE
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:18:49.986393+00:00'
updated_at: '2026-11-09T23:18:49.986393+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a0b20525
  kind: behavior
  regression_only: false
---

## Criterion

`place_on_site` refuses an item whose record says it is not republishable, for example material fetched from a third-party site with `rights: third_party`. The call fails with code `NOT_REPUBLISHABLE`, and the model reads the surface's declared rights sentence. No bytes are written to the site's assets, and the item's `placed_on` is unchanged. The refusal depends only on the record: no argument to the call can bypass it.

When the conversation has no site store, `place_on_site` fails with code `NO_SITE` and nothing is written. Listing and reading still work in that case.

## Verification

Seed a material item with `republishable: false`. Call `place_on_site` and assert the error code `NOT_REPUBLISHABLE`, assert that the site's asset listing is unchanged, and assert that `get_library_item` still reports the previous `placed_on`.

Compose the surface with no site store. Assert that `place_on_site` fails with `NO_SITE`, and that `list_library` and `get_library_item` still return results.
