---
uid: report-d96ce13f
id: REPORT-7240
type: report
title: Claude reconciliation_uat_generation report
created_by: xgd
created_at: '2026-11-01T03:23:24.342574+00:00'
updated_at: '2026-11-01T03:23:24.342574+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: reconciliation_uat_generation
  subject_uid: STORY-141
---

I wrote 12 UATs for STORY-141, one per active acceptance criterion. 11 pass; 1 fails because of a real code defect: the document describer sends the model an empty system prompt.

UATs generated for story STORY-141 (plan item 7 of 7)

Story: STORY-141
Test file(s) created:
  - tests/reconciliation-material-description-digest.workers.test.ts

Tests written: 12 (AC2097, AC1688, AC1689, AC1690, AC1691, AC1693, AC1694, AC1695, AC1696, AC1697, AC1698, AC1699; AC-1692 is superseded and has no test)
Tests passed: 11
Tests failed: 1

⚠️ TESTS FAILING — downstream fix-it loop required

Failures:
  - test_UAT_AC2097_describing_a_document_opens_one_toolless_unprimed_session_that_leaves_no_record: the code doesn't match the AC.
    - **What the model receives:** the request built by `sessionTextDescriber` has `system: ""`. AC-2097 says the system content must be the fixed digest instruction (`DOCUMENT_DIGEST_SYSTEM`) and nothing else.
    - **Where:** `apps/control-app/src/ai.ts:159` passes `system: DOCUMENT_DIGEST_SYSTEM` to `lib.Role`, but the prompt never reaches the model. The Role class lives in the shared library outside the repo (`@lagrangefoundry/ai`). Reading it was denied, so I haven't confirmed why.
    - **Already failing elsewhere:** the free-coded test `test_UAT_FC_REQ_173_the_describer_is_primed_with_the_digest_prompt_and_nothing_else` in `tests/test_UAT_FC_REQ-173_describer_session.test.ts` fails the same way.
    - **The rest of AC-2097 passes:** no tools are offered, the two documents don't share context, no `chat` ticket is created, the session recovers after a failure, and the recorded describer is `<model> (text-decode)`.

Other things the fix-it loop needs to know:
- **The older file now fails 3 tests.** `tests/reconciliation-material-description.workers.test.ts` (AC1688, AC1689, AC1699) still asserts that a document's body is its own text, which REQ-173 replaced with a digest. I didn't touch it, since only new files are allowed here. It also uses the same AC IDs as the new file, so it should be retired or brought up to date.
- **AC-1694 asserts the words on the text comment, not the body.** The AC says a Markdown file with no declared type ends up with a body that "carries the file's own words". Since REQ-173 the body is a digest, so the test checks the outcome is `ok` and that the file's words are on its `material_text` comment instead. The AC wording may need updating.
- **Lint didn't run.** ESLint isn't installed locally and the sandbox blocked downloading it. `tsc` reported no errors in the new file.

test_files_created:
  - "tests/reconciliation-material-description-digest.workers.test.ts"
