---
uid: report-46f5f585
id: REPORT-3284
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-02T00:41:37.245620+00:00'
updated_at: '2026-09-02T00:41:37.245620+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-e07c589b
---

```
UATs generated for story story-e07c589b (plan item 3 of 4)

Story: story-e07c589b
Test file(s) created:
  - tests/reconciliation-material-types.workers.test.ts

Tests written: 9
Tests passed: 9
Tests failed: 0

test_files_created:
  - "tests/reconciliation-material-types.workers.test.ts"
```

**AC → test mapping (1:1, all 9):**

| AC | Test |
|---|---|
| AC-1491 | `test_UAT_AC1491_the_vocabulary_names_three_material_kinds_the_conversation_kinds_and_the_attachment_record` |
| AC-1492 | `test_UAT_AC1492_material_and_reference_carry_the_same_six_part_rights_and_provenance_statement` |
| AC-1493 | `test_UAT_AC1493_an_out_of_set_ownership_or_file_sort_value_is_refused_and_leaves_no_record` |
| AC-1494 | `test_UAT_AC1494_republishability_and_exportability_are_required_true_or_false_answers` |
| AC-1495 | `test_UAT_AC1495_captured_and_fetched_material_must_name_its_address_and_an_upload_is_not_asked_for_one` |
| AC-1496 | `test_UAT_AC1496_a_brief_names_its_site_and_carries_a_document_that_is_not_blank` |
| AC-1497 | `test_UAT_AC1497_a_material_is_a_valid_record_before_any_text_has_been_extracted_from_it` |
| AC-1498 | `test_UAT_AC1498_material_may_name_the_site_it_was_gathered_for_or_belong_to_the_account_at_large` |
| AC-1499 | `test_UAT_AC1499_a_conversation_persists_as_a_record_found_by_its_session_identifier` |

All run in workerd against real D1 (tables from `db/migrations`, via `applySchema`) through `ticketStoreFor` — the Worker's own wiring point. Each test registers its own account so the "no record is stored" claims are observable as an empty listing, with a following accepted create proving the listing is non-vacuous. The borrowed shapes are imported rather than spelled: conversation kind names come from `Object.keys(chatSchemas())`, and the attachment record is asserted by identity (`toBe(ATTACHMENT_SCHEMA)`) under `ATTACHMENT_TYPE`.

**Pre-existing failures elsewhere in the workers project — not from this file, and not on this story's ACs.** A full `--project workers` run is 155 passed / 4 failed. The 4 are all R2 blob-key assertions:

- `tests/reconciliation-material-blob-storage.workers.test.ts` — `test_UAT_AC1487_…`, `test_UAT_AC1488_…` (plan item 2's story)
- `tests/test_UAT_FC_REQ-162_ticket_store.workers.test.ts` — the two attachment-bytes cases

Running those two files alone (my file not loaded) reproduces the same 4 failures, so they are independent of this change. Cause: the installed `@lagrangefoundry/ticketing` stores an attachment under `blobs.put(attachmentUid, …)` (`store.js:382-383`), so the key is `t/<account>/blob/<attachment-uid>`; those tests assert `t/<account>/blob/<sha256>`. That also undercuts AC-1488's dedup claim — a fresh uid per `attach` means the same file attached twice is two objects, not one. Flagging for the fix-it loop on that story; I left both files untouched.
