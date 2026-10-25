---
uid: request-e3a1fbb0
id: REQ-418
type: request
title: 'L1: a row-based table element, so price lists can''t come apart'
created_by: BUG-235
created_at: '2026-10-20T16:08:01.229820+00:00'
updated_at: '2026-10-20T18:54:45.313713+00:00'
completed_at: null
last_field_updated: status
status: ready_to_reconcile
fields:
  priority: medium
  story_points: 8
  epic_parent: epic-f43a7c98
  auto_merge_back: true
  needs_review: false
  chat_comment: comment-f76b15ce
  commits:
  - working_sha: f6b641d9836d38c142fdefcc2c2a3024d3299ab0
    reconcile_sha: null
    main_sha: null
  - working_sha: d5c900a6d518fae6312d6488e43c58c06b045916
    reconcile_sha: null
    main_sha: null
  version: 0.2.557
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
## What landed

A new L1 node kind, `table` (`l1TableSchema` in `packages/site-schema/src/l1/schema.ts`):

- `columns` — one entry per column, each with an optional `align`
  (`start` | `center` | `end`; absent → `start`). Its length *is* the table's
  width: every row, and the header, must hold exactly that many cells, and the
  validator refuses any other count (`L1_STRUCTURAL_RULES.tableRowWidth`). A
  missing value is an empty cell, never a shorter row. 1–12 columns
  (`L1_ENVELOPE.tableColumns`).
- `header` (optional) — one cell per column, rendered as `<th scope="col">`.
- `rows` — at least one; each an array of cells.
- A **cell is a `text` node** (`l1TableCellSchema`) without the axes that would
  take it out of its row: `geometry`, `sticky`, `stacked`, `paintOrder`,
  `scrollTrack`, `backedBy` are refused as unknown keys. Everything text already
  does (runs, links through the href allowlist, text styles, palette colours,
  escaping, inline editing) applies to a cell unchanged.
- `narrow` — `scroll` (default: the grid keeps its shape and scrolls inside its
  own box) or `stack` (below `narrowBelowPx`, default 600, each row becomes a
  card: cells one under another, each labelled with its column's header text,
  and the header row is hidden). Neither mode makes the page scroll sideways:
  the table's box is capped at its parent's width.
- `cellPadding` (default 8px vertical, 12px horizontal), `rule` (a border
  between rows), `axes` (the shared painted surface), `type` (the type the
  table sets for every cell), plus the node-level axis groups every kind carries.

Renders as a real `<table>` with `<thead>`/`<tbody>`; a `stack` table also states
explicit ARIA roles, because changing `display` costs a table its implicit
roles in some browsers.

**Addressing.** A table's cells are its children in reading order — header
cells first, then each row left to right — so a cell's address is one more
index like any other node's (`0.3.7`). One shared helper answers "what is under
this node" (`l1Children` / `l1ChildEntries` / `setL1Child` / `withL1Children`,
`packages/site-schema/src/l1/children.ts`), and the validator, the edit
address rule (`resolveL1Node` / `replaceL1Node` — a write lands in the cell's
own row), the slot inventory, the page map (`segments.ts`, which labels a
table with its shape), the type-assign rewrite, and the consultant's page-words
read all use it. Validator refusals point at the cell (`/rows/2/1`), not its
reading-order index.

**Teaching.** Builder priming (both variants) now says a price list, opening
hours, or any item-and-its-values list is a `table` element and names the two
narrow modes; the consultant's on-screen checklist says such a list is a table
and that a brief asking for one says so. The builder's vocabulary lists the
kind automatically (it is derived from the schema). The layout check's
misaligned/split-rows findings now say "Build it as a table element, one row
per item" and stay as the backstop for column-built content.

## Design decisions made during implementation

- **Node kind, not a container layout mode** — the row has to be structure the
  document carries; a grid of loose children is exactly the shape that slid.
- **Cells are text nodes, not a new cell type** — every existing walk over text
  reaches them for free; positioning axes are removed structurally (`.omit` on
  the strict text schema) rather than by a separate rule.
- **No separate header type.** Header cells inherit the table's `type` and the
  `<th>`'s bold; a header cell can carry its own axes or `textStyle`.
- **Layout check: a scrolling box does not "clip".** Text a box scrolls to (a
  `scroll` table on a phone) is reachable, so the check no longer reports it as
  cut off along the box's scroll axis. Without this every `scroll` table wider
  than a phone would earn a false finding and a pointless repair brief.
- **Analytic layout model** (`tools/generate/src/l1/probes.ts`) estimates a
  table's height row by row (tallest cell at an even column share, plus the
  inset); it does not measure cells as leaves.
- **Out of scope:** email pages refuse `table` (not in the email target's
  kinds); capture/fold does not produce tables from a reference site; no
  automatic migration of existing column-built lists.

## UAT coverage (`tests/test_UAT_FC_REQ-418_table.test.ts`)

- validator accepts a well-formed table; refuses a row or header with the
  wrong cell count, a cell carrying `geometry`, and 13 columns;
- security: injection payloads in cell and header text are inert in the
  rendered page (including the `data-label` attribute); a `javascript:` link
  on a cell is refused;
- renders a real `<table>` with `<th scope="col">` header cells;
- a cell is addressed in reading order and a write lands in its own row;
- a table's `type` (named style) sets the type of every cell;
- builder priming (both variants) names the `table` element for price lists
  and opening hours, the consultant priming says such a list is a table, and
  the builder vocabulary lists the kind;
- real browser: an empty first cell keeps every row aligned at 375px and
  1280px, with no layout-check findings;
- real browser: a five-column table too wide for a phone, in each narrow mode,
  gives no layout-check findings and no sideways page scroll at 375px; `stack`
  renders cells as stacked blocks on a phone and a grid on desktop.

`tests/test_UAT_FC_BUG-48_the_reference_covers_its_source.test.ts` gains a
provocation for the new `tableRowWidth` rule (that suite provokes every
structural rule by key).