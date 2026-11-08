---
uid: report-53a3f7fc
id: REPORT-11415
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T11:33:26.903958+00:00'
updated_at: '2026-11-08T11:33:26.903958+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-d87c1fe2
  parent_report_uid: report-5998da78
  batch_index: '0'
---

`test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor` passes, so I made no edits. The `code_frozen` rule stands and I touched no production file.

**What ran:** I re-ran all five test files in the scope on the current HEAD. 52 tests passed, 10 were skipped and none failed.
- AC2380 passed, as did every AC2379–AC2391 case in `tests/reconciliation-consultant-image-generation.workers.test.ts`.
- AC2392 passed in `tests/reconciliation-consultant-image-generation-deploy.test.ts`.
- The `test_UAT_FC_REQ-208_*` suite passed, and so did `tests/test_UAT_FC_REQ-209_measure_a_drawing.test.ts`.

AC-2380 still proves its claim as currently worded: the tool's own channels never name the vendor. I did not widen it to the stored material body or to knowledge-base search, which belong to BUG-381 (bug-da5f9050).

**Not verified:** in `tests/test_UAT_FC_REQ-209_measure_in_a_browser.test.ts`, 10 of the 11 tests skipped with "no Chromium could be launched". Only the "measuring script is valid JavaScript" check ran. That includes `test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved` (fix `a5a337c47c`), which stays unverified until the gate runs that file with nothing skipped. I left it unedited, as instructed.

Two files show as modified, `.xgd/_changes/log.ndjson` and `.xgd/_changes/meta.json`. I didn't edit them; they come from the ticket tooling.

```yaml
## Assessment
status: no_change_needed
failures:
  - test: tests/reconciliation-consultant-image-generation.workers.test.ts::test_UAT_AC2380_nothing_the_model_sees_names_the_image_vendor
    status: no_change_needed
    evidence: "vitest run over the 5 scoped files: 52 passed, 10 skipped, 0 failed; AC2380 passed"
  - test: tests/test_UAT_FC_REQ-209_measure_in_a_browser.test.ts::test_UAT_FC_REQ_209_the_font_metrics_are_the_face_that_resolved
    status: skipped_unverified
    evidence: "skipped: no Chromium could be launched in the builder sandbox; the gate must run it"
edits: []
```