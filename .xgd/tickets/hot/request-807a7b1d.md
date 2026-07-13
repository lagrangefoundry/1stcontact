---
uid: request-807a7b1d
id: REQ-57
type: request
title: Richer text block kinds — tables, code, rich/nested blockquotes, headings,
  nested list items
created_by: xgd
created_at: '2026-07-13T15:53:30.219724+00:00'
updated_at: '2026-07-13T18:05:08.043355+00:00'
completed_at: null
last_field_updated: status
status: bundled
fields:
  priority: medium
  auto_merge_back: true
  needs_review: false
  commits:
  - working_sha: ef6f6b1508f660ee0f784c2bb9f4812cfa19a350
    reconcile_sha: null
    main_sha: null
  version: 0.0.104
  bundled_in: bundle-d9c2e655
---

## Goal

Extend the styled-text **block-document model** ([[DOC-22]]) with the block
kinds deferred from [[REQ-54]]. REQ-54 landed the foundation — the block tree
(`{ baseline, blocks[] }`) with inline-run leaves — plus `paragraph` and `list`
(bullet + ordered) blocks, which covers 1stcontact. This ticket adds the
remaining *kinds* the operator wants to represent: **tables, code blocks,
rich/nested blockquotes, headings-within-prose, and nested / multi-block list
items**.

**Spec:** [[DOC-22]] §8 (Out of scope / deferred) is the backlog this ticket
drains. Each item is a genuinely new *block kind* — not a dial on an existing
one — because it carries structure no current block has: a table is 2-D (rows ×
cells), a code block owns raw text + a language, a nested list item holds blocks
rather than runs. Per the "generalize before adding" rule, `list` stays one kind
(the `ordered` dial); these are the cases where a new kind is genuinely warranted.

## Motivation

The driving UX is the semantic WYSIWYG editor (DOC-22 §3.2): users author text
blocks in a ProseMirror/TipTap- or Lexical-shaped editor whose native document
is exactly a block-tree-with-marks. Those editors ship tables, code blocks,
blockquotes and nested lists out of the box; our storage model must be able to
hold what the editor can produce (and what the capture can read from a DOM),
so the two stay lossless.

## Block kinds to add (each: model + notation + render + capture + diff)

- **table** — `{ kind: "table", rows: Cell[][] }`; a cell holds inline `runs`
  (later: blocks). Notation: pipe tables (`| a | b |`) or an explicit fenced
  form. 2-D pairing in the diff.
- **code-block** — `{ kind: "code", language?, text }`; raw text, no inline
  parsing. Notation: fenced ``` ``` ``` blocks.
- **heading** — `{ kind: "heading", level, runs }`. Notation: `#`…`######`.
- **blockquote (rich/nested)** — promote today's paragraph-level `blockquote`
  flag to a container block that can hold child blocks (nested quotes, multi-
  paragraph quotes, attribution).
- **nested / multi-block list items** — a `ListItem` holding `blocks` (a nested
  list, multiple paragraphs) rather than only `runs`.

## Workstreams (mirror REQ-54)

1. **Model:** add the block kinds to the `Block` union (framework
   `text-markup.ts` types) and, where an item/cell must hold structure, widen
   `ListItem`/cell to carry `blocks`.
2. **Notation parse/serialize:** extend the block classifier + serializer with
   the fenced-code, pipe-table, `#`-heading, and nested-list forms. Keep the
   round-trip invariant ([[DOC-22]] §5) as the lead test over the widened space.
3. **Schema / render / capture / diff:** carry each new kind through the same
   five workstreams REQ-54 defines, once the schema/render/capture stages exist.

## Acceptance criteria (UATs) — sketch

- `test_UAT_*_table_roundtrips` — a 2-D table parses/serializes losslessly.
- `test_UAT_*_code_block_is_raw` — a fenced code block preserves its text
  verbatim (no inline `[..]{..}` interpretation) and its `language`.
- `test_UAT_*_heading_levels` — `#`…`######` map to `heading` levels 1–6.
- `test_UAT_*_nested_list_item` — a list item containing a nested list
  round-trips.
- `test_UAT_*_rich_blockquote` — a multi-paragraph / nested blockquote
  round-trips.
- Extend the REQ-54 round-trip **property test** generator to emit these kinds.

## Notes

- Blocked on [[REQ-54]]'s foundation (merged). This ticket only adds kinds; it
  does not revisit the tree shape or the run leaf.
- No dual-model: when the rich blockquote container lands, the paragraph-level
  `blockquote` flag is replaced by it, not kept alongside.


---

## Free-coding scope decisions (REQ-57)

Locked before implementation, per DOC-22 §4/§5. This ticket implements
**workstreams 1 & 2 only — model + notation** (the pure `text-markup.ts` unit).
Workstream 3 (schema / render / capture / diff) is **not actionable now**:
`text-markup.ts` is a standalone notation unit wired into no render/schema/
capture/diff path yet, and DOC-22 §8 gates it on "once those stages exist".
The AC list's capture/diff clauses are therefore deferred with it; the round-
trip invariant over the widened block space is the lead (and gating) test.

Decisions:

1. **Recursive grammar.** The REQ-54 parser was flat (blank-line split →
   classify each chunk). The new kinds nest (blockquote holds blocks, list
   items hold blocks, table cells hold blocks), so the parser/serializer become
   proper recursive descent over the block tree. Block boundary = a blank line
   *or* a line whose block type differs from the current block.

2. **Tables use an explicit fenced form, not pipe tables.** Pipe tables are
   round-trip-hostile (cell-internal `|` escaping, the `|---|` separator row,
   whitespace padding) and cannot hold block-bearing cells. Canonical form is
   nested `:::` structural fences: `::: table` / `::: row` / `::: cell` … `:::`
   (distinct from the `::: {attrs}` baseline fence, whose opener is `::: {`, and
   from the ```` ``` ```` code fence). Cell content is recursively serialized
   blocks. Diff pairs cells 2-D by (row, col).

3. **`ListItem` and table cells always carry `blocks`, never `runs`** (no dual-
   model, per the ticket's blockquote note). A single-line item still serializes
   as `- text`; it parses to `{ blocks: [{ kind: 'paragraph', runs: […] }] }`.
   Consequence: REQ-54's item-shape assertions are updated to the widened model
   — the *notation* round-trip is unchanged, only the in-memory item shape.

4. **No dual-model for blockquotes.** The paragraph-level `blockquote?` flag is
   removed and replaced by a `{ kind: 'blockquote', blocks }` container.

New block kinds: `heading` (`#`…`######`, `level` 1–6, inline `runs`), `code`
(```` ``` ```` fenced, `language?`, verbatim `text`, no inline parsing),
`blockquote` (container of blocks), `table` (`rows: Cell[][]`, cells hold
blocks), and nested/multi-block list items (via the widened `ListItem`).