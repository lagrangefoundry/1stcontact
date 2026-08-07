---
uid: report-65ca9439
id: REPORT-1521
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-08-07T02:11:52.526477+00:00'
updated_at: '2026-08-07T02:11:52.526477+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-37a3921b
---

All 13 UATs pass. The one failure in the adjacent suite (`test_UAT_AC950`, story-af36c2cb — the edit render channel) is pre-existing: the working tree contains only my new untracked file, and that suite fails identically in isolation.

**What I verified beyond a green run:** I mutated one independent expectation in each of the 13 tests and confirmed all 13 then fail — no test is vacuous, each genuinely exercises the code path it claims.

Notes on two AC/code boundaries I handled explicitly rather than papering over:

- **AC-987** (malformed addresses) — the AC lists "empty" among malformed forms. An empty address is refused *before* the address rule sees it, as a missing argument, so its fault does not name the address. I assert the AC's substance for it (refused, non-zero exit, no write) and the stronger "fault names the address" claim for the eight forms that reach the parser. Comment in the test records why. I also excluded `-1` — a leading dash is consumed by any argv parser, so it would prove nothing about the address rule.
- **AC-984** (byte-for-byte) — I read the rendered bytes straight off disk rather than re-rendering, which proves the stronger clause "no re-rendering occurs" as well as byte equality. The fourth rejection class (a definition failing validation) needs a violation written first, so its snapshot is taken after that injection.

```
UATs generated for story story-37a3921b (plan item 2 of 6)

Story: story-37a3921b
Test file(s) created:
  - tests/reconciliation-copy-edit-write-path.test.ts

Tests written: 13
Tests passed: 13
Tests failed: 0

test_files_created:
  - "tests/reconciliation-copy-edit-write-path.test.ts"
```

One test per AC, at real boundaries — `run(argv)` for the command line (envelope + exit code), `startBuilder` over HTTP for the origin, and bytes on disk for the draft and both rendered channels. No runtime code and no existing test was modified.

| Test | AC |
|---|---|
| `test_UAT_AC980_a_copy_region_exposes_one_plain_string_field_holding_the_draft_words` | AC-980 |
| `test_UAT_AC981_a_region_with_nothing_editable_succeeds_with_an_empty_field_list` | AC-981 |
| `test_UAT_AC982_saving_new_words_updates_the_draft_and_re_renders_the_page` | AC-982 |
| `test_UAT_AC983_a_change_map_is_applied_whole_or_not_at_all` | AC-983 |
| `test_UAT_AC984_a_rejected_edit_leaves_the_draft_and_the_render_byte_identical` | AC-984 |
| `test_UAT_AC985_a_refusal_carries_a_code_a_path_and_a_hint_with_a_failing_exit_status` | AC-985 |
| `test_UAT_AC986_a_copy_edit_is_validated_over_the_whole_resulting_definition` | AC-986 |
| `test_UAT_AC987_a_malformed_address_is_refused_outright_and_never_coerced` | AC-987 |
| `test_UAT_AC988_an_unknown_field_or_a_non_text_value_is_refused_not_ignored` | AC-988 |
| `test_UAT_AC989_copy_in_a_module_slot_reads_and_writes_through_the_same_operation` | AC-989 |
| `test_UAT_AC990_copy_longer_than_its_box_reads_back_in_full` | AC-990 |
| `test_UAT_AC991_markup_saved_as_copy_stays_literal_text_and_every_field_is_plain_string` | AC-991 |
| `test_UAT_AC992_the_origin_is_the_same_surface_faulting_and_re_rendering_alike` | AC-992 |
