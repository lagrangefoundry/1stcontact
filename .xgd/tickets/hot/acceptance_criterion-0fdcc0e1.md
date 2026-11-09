---
uid: acceptance_criterion-0fdcc0e1
id: AC-2578
type: acceptance_criterion
title: list_library filters by kind, role, placement on this site and text, combined
  with AND
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:18:40.796572+00:00'
updated_at: '2026-11-09T23:29:52.921652+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a0b20525
  kind: behavior
  regression_only: false
---

## Criterion

`list_library` narrows the catalogue by any combination of four filters, and an item must satisfy all the filters given.
- `kind`: exact match on the item's kind.
- `role`: exact match on the item's role.
- `placed`: `true` keeps only items whose `placed_on` includes the site this conversation is about. `false` keeps only items whose `placed_on` does not include it, so an item placed only on a different site of the same business counts as not placed.
- `matching`: a case-insensitive substring of the item's catalogue name, title, filename or aliases. An empty or whitespace-only value applies no text filter.

`total` and `more` describe the filtered set, not the whole catalogue.

## Verification

Seed items that differ in kind and role, one placed on the session's site, one placed only on another site of the same business, and one titled "Bakery Front". Assert each of the following:
- `kind: 'image'` returns only images.
- `role: 'reference'` returns only reference items.
- `placed: true` returns only the session-site item.
- `placed: false` includes the other-site item.
- `matching: 'bakery'` returns the "Bakery Front" item.
- A combined filter returns only items meeting every condition, and its `total` equals the filtered count.