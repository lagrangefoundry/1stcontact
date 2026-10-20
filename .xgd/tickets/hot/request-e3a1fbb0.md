---
uid: request-e3a1fbb0
id: REQ-418
type: request
title: 'L1: a row-based table element, so price lists can''t come apart'
created_by: BUG-235
created_at: '2026-10-20T16:08:01.229820+00:00'
updated_at: '2026-10-20T16:08:01.229820+00:00'
completed_at: null
last_field_updated: created_at
status: draft
fields:
  priority: medium
  story_points: 8
  epic_parent: epic-f43a7c98
  auto_merge_back: true
  needs_review: false
---

## Why

Bob's salon 2's colour price table was built as parallel columns; an empty
first cell in the name column took no height, so every treatment slid up a row
beside the wrong prices. It was right in the data and wrong on screen, and it
passed every word check. REQ-415 added builder guidance ("a list of items with
prices is one row per item") and a layout check that flags misaligned rows, and
explicitly deferred a structural fix to here.

Guidance and detection cost tokens every time: builders get it wrong, the host
flags it, the consultant reads the report and briefs a repair. The operator is
tracking cost closely (2026-10-20); the cheapest fix is a structure in which the
mistake can't be built.

## What changes

A typed **row-based table** element in L1 (`packages/site-schema/src/l1`,
rendered by `packages/framework/src/l1`):
- a table is a list of rows; each row is a list of cells; a header row is
  optional; column count is fixed per table and validated;
- cell content is the existing text primitives (no freeform HTML/CSS, per the
  security policy); empty cells are allowed and still occupy their row;
- styling via existing tokens (text styles, palette, borders, spacing);
- responsive behaviour at narrow widths is declared, not ad hoc: at least
  "scroll within the table" and "stack each row as a card", chosen per table,
  with neither ever making the page scroll sideways;
- renders as a real `<table>` (or equivalent with table semantics) for screen
  readers;
- validator and renderer caps as for other L1 elements.

Builders and the consultant are taught it: price lists, opening hours and any
"item and its values" content use it. REQ-415's "rows not columns" guidance then
points at this element. The layout check's misaligned-rows finding stays as a
backstop for content built the old way.

Existing pages are not migrated automatically; a page with a column-built price
list is converted when next edited.

## Test plan
- Validator accepts a well-formed table and rejects a row with the wrong cell
  count; envelope security UATs cover table cell text.
- A table with an empty first cell renders with every cell in its row aligned
  (layout check reports no misaligned rows) at desktop and phone.
- Each narrow-width mode renders without sideways page scroll at 375px.
- Builder priming names the element for price lists and hours.
