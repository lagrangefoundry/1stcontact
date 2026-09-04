---
uid: report-db7097af
id: REPORT-3490
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-09-04T04:22:48.664531+00:00'
updated_at: '2026-09-04T04:22:48.664531+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: story-724e4e8c
---

All 10 UATs pass. The 6 failures in adjacent files are pre-existing — identical with and without my file (they're in `reconciliation-material-ingestion.workers.test.ts` and `test_UAT_FC_REQ-163_ingestion.workers.test.ts`, covering the fetch guard and the vector index, and the runner warns it is routing fetches through a proxy from the environment).

```
UATs generated for story story-724e4e8c (plan item 8 of 15)

Story: story-724e4e8c
Test file(s) created:
  - tests/reconciliation-material-description.workers.test.ts
  - tests/reconciliation-material-typeface-description.test.ts

Tests written: 10
Tests passed: 10
Tests failed: 0

test_files_created:
  - "tests/reconciliation-material-description.workers.test.ts"
  - "tests/reconciliation-material-typeface-description.test.ts"
```

**AC → test mapping** (1:1, all ten):

| AC | Test |
|---|---|
| AC-1548 document's own text | `test_UAT_AC1548_document_text_becomes_its_description` |
| AC-1549 no extractable text | `test_UAT_AC1549_no_extractable_text_is_kept_not_refused` |
| AC-1550 image depicts | `test_UAT_AC1550_image_described_by_what_it_depicts` |
| AC-1551 nothing configured to look | `test_UAT_AC1551_no_describer_configured_is_still_kept` |
| AC-1552 too large to look at | `test_UAT_AC1552_image_above_the_looking_ceiling_is_stored_whole` |
| AC-1553 typeface from name table | `test_UAT_AC1553_typeface_is_read_from_its_own_name_table` |
| AC-1554 unreadable material | `test_UAT_AC1554_unreadable_material_is_kept_and_marked_unreadable` |
| AC-1555 reached and failed | `test_UAT_AC1555_a_failed_describer_never_fails_the_upload` |
| AC-1556 outcome + producer queryable | `test_UAT_AC1556_outcome_and_producer_are_queryable_on_every_material` |
| AC-1557 bounded description | `test_UAT_AC1557_a_bounded_description_states_its_own_truncation` |

**Two files, because the repo splits by runtime.** Nine UATs go through `route()` against real D1 and R2 in workerd — real `unpdf`, real ticket store, bytes read back out of R2 via `/api/material/file`, with only the vision describer doubled (it is a supplied capability by design). AC-1553 needs the checked-in `heading-font.ttf` off a filesystem, which workerd does not have, so it runs in the node project per `vitest.config.mts`'s `*.workers.test.ts` convention. Each workers test uses its own `TENANT_ID` so AC-1556's "exactly these records" claims mean something in a shared database.

**One interpretation worth flagging.** AC-1549 asks to ingest "an empty text file". A zero-byte upload is refused one step earlier by `ingestUpload`'s empty-file guard, which STORY-132 owns and this story puts explicitly out of scope. I ingested a whitespace-only file instead — bytes present, decoded text empty — which is the branch the criterion is actually about ("read successfully but yields no text") and which `describe.ts` reports as `no_text` with the body "The file is empty." This is noted in a comment in the test. Everything else in that AC (kept whole, honest wording, page count, filename title, byte-for-byte readback) is asserted as written.

No runtime code was modified and no existing test file was touched.
