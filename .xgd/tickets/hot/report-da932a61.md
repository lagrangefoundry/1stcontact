---
uid: report-da932a61
id: REPORT-11518
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T16:41:44.941160+00:00'
updated_at: '2026-11-08T16:41:44.941160+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-49607926
  parent_report_uid: report-bfdc6c51
  batch_index: '0'
---

Both tests in this batch already have the correct fix, and I made no edits this pass. The test file and the capture code are unchanged since the test-only fix commit `3ef55bf62c`. The only modified files in the tree are XGD bookkeeping (`.xgd/_changes/*`).

I could not run either test in this session. Both need Chromium (`it.runIf(await chromiumAvailable())`), and Chromium can't start in the sandbox, so a local vitest run of the file showed 3 passed and the 2 batch tests skipped. The evidence that they pass comes from the gate: its report at 2026-11-08T16:10:54Z lists both as `passed`, with 275 passed, 0 failed and 0 skipped. That run came after the fix commit (16:06:59Z).

Each test exercises the real capture path: a loopback server serves the fixture into `cmdCapturePage` and Chromium, and the test asserts specific flow fields.
- **`test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence`**: the three runs ("Serving", "real", "food") share one `inlineGroup`, carry `inlineIndex` 0, 1, 2 and the flow root's `inlineBox`, `textFlow` keeps the separating whitespace, and a superscript reports `verticalAlign: 'super'`. If flow recording were removed, this test would fail.
- **`test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow`**: the two `<br>`-split lines are captured as separate runs with no `inlineGroup` or `textFlow`, and neither link in the flex row carries a group. If the `<br>` or the blockified child did not end the flow, the runs would share a group and the test would fail.

These tests match REQ-211 and AC-2449 (a `<br>` and a blockified child each end a flow, and a one-run segment carries no flow id). No production code, AC or story change is needed, and no mode rule blocks the fix.

```yaml
## Assessment
status: fixed
tests:
  - name: "REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow"
    file: tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts
    cause: "Fixed earlier by the test-only commit 3ef55bf62c. extract.ts records a flow only when it has more than one run, so <br>-split lines carry no flow id."
    fix: "No edit this pass. The test already asserts that both lines are captured as separate runs with no inlineGroup or textFlow, and that neither flex-row link carries a group."
    upstream: "None. AC-2449 already describes this behaviour."
    verification: "Browser test, skipped in this sandbox (Chromium cannot launch). The gate report at 2026-11-08T16:10:54Z (.xgd/_staging/rr_b41_q1.json), after 3ef55bf62c: passed; suite 275 passed, 0 failed, 0 skipped. The file and the capture code are unchanged since."
  - name: "REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence"
    file: tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts
    cause: "Not failing. Planner blast-radius companion in the same describe group."
    fix: "No edit."
    upstream: "None."
    verification: "Browser test, skipped in this sandbox. The same gate report lists it as passed. The file and the capture code are unchanged since."
```