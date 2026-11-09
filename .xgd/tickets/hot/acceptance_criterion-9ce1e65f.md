---
uid: acceptance_criterion-9ce1e65f
id: AC-2580
type: acceptance_criterion
title: An ambiguous or unknown item name is refused with AMBIGUOUS or NOT_FOUND naming
  the candidates
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:18:43.870101+00:00'
updated_at: '2026-11-09T23:18:43.870101+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-a0b20525
  kind: behavior
  regression_only: false
---

## Criterion

A name that does not mean exactly one catalogue item is refused, never guessed. This applies to both `get_library_item` and `place_on_site`, and in both cases nothing is placed.
- **A name that fits two or more items** (for example, two uploads sharing a filename) fails with code `AMBIGUOUS`. The diagnosis lists the catalogue name of every candidate.
- **A name that fits no item** fails with code `NOT_FOUND`. The diagnosis lists up to 12 existing catalogue names, followed by an ellipsis when there are more. When the catalogue is empty, the diagnosis instead says the client has not given anything yet.

## Verification

Seed two items with the same filename and call `get_library_item` and `place_on_site` with that filename. Assert that both calls fail with `AMBIGUOUS`, that both candidate names appear in the diagnosis, and that the site's assets are unchanged.

Call `get_library_item` with an unknown name against an empty catalogue and against a catalogue of 13 or more items. Assert the code `NOT_FOUND` in both cases. Assert the empty-catalogue wording in the first case, and at most 12 names followed by an ellipsis in the second.
