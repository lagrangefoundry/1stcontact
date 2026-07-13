---
uid: report-5b3fceee
id: REPORT-522
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-07-13T21:05:53.348529+00:00'
updated_at: '2026-07-13T21:05:53.348529+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-8b5ebbf7
---

All 11 test names conform to the enforced `^test_UAT_AC\d+_\w+$` pattern, one UAT per AC (AC-618 through AC-628), and all pass.

```
UATs generated for story story-8b5ebbf7 (plan item 8 of 8)

Story: story-8b5ebbf7
Test file(s) created:
  - tests/reconciliation-styled-text-block-document.test.ts

Tests written: 11
Tests passed: 11
Tests failed: 0

test_files_created:
  - "tests/reconciliation-styled-text-block-document.test.ts"
```

**Coverage — one UAT per acceptance criterion, verified against the existing `text-markup` module through its public entry points (`parseStyledText` / `serializeStyledText` / `normalizeStyledText`):**

| AC | Test | What it proves |
|----|------|----------------|
| AC-618 | `test_UAT_AC618_roundtrip_invariant_over_all_block_kinds` | Property test, 500 seeds spanning every block kind nested; `parse(serialize(x)) === x` and `normalize(x) === x` for the normalized subset |
| AC-619 | `test_UAT_AC619_per_run_overrides_via_attribute_span` | `[text]{field=value}` yields exactly the listed override axes; no-span run inherits all |
| AC-620 | `test_UAT_AC620_markdown_shorthands_desugar_to_model` | `*`/`**`/`***`, `#`…`######`, `>`, `- `/`N. `, and plain lines desugar to the model |
| AC-621 | `test_UAT_AC621_literal_delimiters_and_leading_markers_are_escaped` | Literal delimiters and leading block markers (`-`, `1.`, `>`, `#`, `:`) round-trip as paragraph text, not structure |
| AC-622 | `test_UAT_AC622_bullet_and_ordered_lists_one_kind_ordinals_and_start` | One list kind via `ordered`; positional ordinals; non-1 `start` survives; start-at-1 records no `start` |
| AC-623 | `test_UAT_AC623_adjacent_same_type_lists_merge_on_normalization` | Adjacent same-type lists merge to one block, retaining the first list's `start` |
| AC-624 | `test_UAT_AC624_headings_map_atx_levels_and_carry_inline_runs` | Levels 1–6 round-trip; styled runs inside a heading survive |
| AC-625 | `test_UAT_AC625_code_blocks_preserve_verbatim_text_and_language` | Verbatim text (no inline parsing), optional language, fence widening for backtick runs |
| AC-626 | `test_UAT_AC626_blockquotes_are_containers_of_child_blocks` | Multi-paragraph / nested / list-containing blockquotes round-trip |
| AC-627 | `test_UAT_AC627_tables_roundtrip_as_grid_of_block_cells` | Grid dimensions + per-cell block content preserved |
| AC-628 | `test_UAT_AC628_list_items_hold_child_blocks` | Nested sub-list, multi-paragraph item, and compact single-line item |

No runtime code, existing tests, or tickets were modified — only the new test file was created.
