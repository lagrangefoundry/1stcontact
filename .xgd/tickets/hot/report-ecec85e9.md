---
uid: report-ecec85e9
id: REPORT-11508
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T16:06:44.696927+00:00'
updated_at: '2026-11-08T16:06:44.696927+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: report-49607926
  parent_report_uid: report-b688435f
  batch_index: '0'
---

I fixed the test, but I couldn't run it here. It needs Chromium, which the sandbox can't launch, so it was skipped. It's waiting on the gate.

**What was wrong:** the test expected each line of the `<br>`-split paragraph to have a flow group (`inlineGroup`). The capture code only records a flow when it has more than one run (`extract.ts:1249`). The `<br>` splits the paragraph into two one-run segments (`extract.ts:1190-1195`), so neither line ever gets a group. The test was asking for something the code doesn't do.

**The fix** (`tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts`): the test now checks that both lines are captured as separate runs, and that neither carries `inlineGroup` or `textFlow`. If the `<br>` didn't end the flow, the two runs would form one two-run flow and both would share a group, so this test would fail. The flex-row links check was already correct and is unchanged. No production code changed.

**Upstream:** the acceptance criterion, AC-2449, already says "assert neither line carries a flow id", so it needed no edit.

**Run:** in the sandbox, the file's 3 non-browser tests pass and the 2 browser tests were skipped.

```yaml
## Assessment
status: fixed_unverified
tests:
  - name: "REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow"
    file: tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts
    cause: "Test asserted the <br>-split lines carry a defined inlineGroup; extract.ts records a flow only when it has >1 run, so one-run segments carry none."
    fix: "Assert both runs are captured and carry neither inlineGroup nor textFlow. Without the <br> split they would share one defined group."
    upstream: "None. AC-2449 already describes this behaviour."
    verification: "Browser test, not executed in-session (Chromium unavailable in the sandbox). Non-browser tests in the file pass. Awaiting the gate."
```