---
uid: acceptance_criterion-b79fbd8c
id: AC-2283
type: acceptance_criterion
title: Template lookup returns the newest ticket for a key in the business's own store,
  seeding the default once when none exists
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-04T17:32:23.106628+00:00'
updated_at: '2026-11-04T18:00:33.701678+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-7d255580
  kind: behavior
  regression_only: false
---

## Criterion
Looking up the template for a key in a business returns the most recently created template ticket carrying that key; older templates for the key remain stored. When the business holds no template for the key (never had one, or all were archived), the lookup writes that key's default template as an ordinary template ticket in that business's own store and returns it; a subsequent lookup returns the same ticket and creates nothing further. Ensuring all templates yields one in-force template for each of `invite`, `signin` and `lapsed`, seeding only those absent. Templates written in one business's store are never returned for another business.

## Verification
In a fresh business store, look up `invite`; assert one template ticket now exists with key `invite` and seed content, and a second lookup returns the same uid with the ticket count unchanged. Create a newer `invite` ticket; assert lookup returns it and the older still exists. Archive all `signin` tickets; assert lookup re-seeds. In a second business's store, assert its lookup does not return the first business's templates.