---
uid: acceptance_criterion-80ce794f
id: AC-2576
type: acceptance_criterion
title: list_library returns every kind of Library material newest first with the catalogue
  item field set
created_by: workflow:reconciliation_generate_story_prompt/planner
created_at: '2026-11-09T23:18:37.984845+00:00'
updated_at: '2026-11-09T23:29:53.530186+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-a0b20525
  kind: behavior
  regression_only: false
---

## Criterion

In a hosted assistant conversation, calling `list_library` with no arguments returns the client's catalogue newest first, and it includes every kind of material the client's Library tab holds, not only pictures. A catalogue holding an image, a document and a font returns all three.

Each returned item carries exactly these fields:
- `item`: the catalogue name, which other tools accept back
- `title`: the Library's title, or the filename when there is no title
- `filename`: the client's own filename
- `kind`: image, font, document or capture
- `content_type`
- `role`: site, reference or null
- `rights`
- `republishable`: boolean
- `placed_on`: list of site slugs, which may be empty
- `source_url`: string or null
- `edits`: the edit recipe list
- `described`: an object with `status` and `by`
- `updated_at`

The listing does not include the item's full description text. An empty catalogue returns `items: []`, `total: 0` and `more: false`.

## Verification

Seed a business's material store with items of several kinds and differing timestamps. Invoke `list_library` through the assistant toolbox. Assert that the order is newest first, that every kind is present, that each item has the field set above, that no `description` field appears, and that an empty store returns the empty page shape.