---
uid: comment-73f279d5
id: COMMENT-774
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-07T17:33:29.604527+00:00'
updated_at: '2026-08-07T17:33:29.604527+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-498c81de
  kind: note
---

Report created and schema-verified: **REPORT-1594** (`report-498c81de`), `result: pass`, `report_kind: capability_validation`, `subject_uid: capability-12fee326`, `level: ac`, `violations: 0`, `warnings: 0`, `needs_review_count: 0`.

## Result: PASS

The fix call (report-c5644f16) between invocations claimed four fixes. I re-checked each against the artefact rather than the fix report:

- **AC-1028** (`acceptance_criterion-26ffac6d`) is now `status: active` (commit `3893e61a0`), body byte-for-byte unchanged — no rename toward `segmentFieldsOf`. Project-wide `pending` ACs fell 3 → 2, and neither remaining one is in this capability. Violation closed.
- **STORY-101** body (commit `cf3d14309`) now carries the n=0 clause on the "A form over that region's fields" bullet, stating AC-1000's criterion clause for clause. Every other bullet and all eleven Technical Context notes are unchanged. Warning closed.
- **Test renames** — `git log -p` on `tests/req118-image-selection.test.ts` shows commit `7d834b257` changing exactly two `it()` title strings and nothing else. Both now resolve to AC-1028 through `extract_ac_id_from_test_name`.

I re-ran the four affected suites rather than trusting the fix report's numbers: `4 passed / 33 passed | 5 skipped (38)`, matching its claim. A per-test verbose run confirms `test_UAT_AC1028_clicking_an_image_segment_offers_a_picker_of_the_sites_assets` **passes**, so AC-1028 will not be orphaned by `check_active_ac_coverage`. Its second UAT skips with the whole `skipIf(!WEBUI_INSTALLED)` origin suite — that is STORY-101's declared Known coverage caveat, not a regression. Working tree clean.

All 28 ACs are `active` and align: 15 under STORY-101, 13 under STORY-98, each story's set covering its body's behavioural surface with no orphan and no true duplicate.

Four items recorded as info, none blocking. Two are worth carrying:

- **CAP-87's body still reads "the page showing the new words"**, narrowing the post-save outcome to copy after REQ-118 routed image selection through the same gesture. This has now survived three reports, each correctly declining to edit an upper-layer element from the wrong level. It's contained — no AC inherits it — but it will reappear in every ledger until a capability- or story-level cycle takes it. Replacement wording is in the report.
- **Nine `test_UAT_FC_REQ-118_*` names remain** in that test file. I verified the FC orphan invariant text at `xgd_source/system_docs/FREE-CODING.md:862-885`: the prose obliges renaming every such *test*, while the `check_fc_orphans` gate scans only for `test_UAT_FC_*` *files* — so a REQ-named file's titles were never gated. Those nine cover write-path and asset-store behaviour, which CAP-87's body explicitly assigns to Structured Copy Editing, so they are CAP-86's to map, not a gap here.
