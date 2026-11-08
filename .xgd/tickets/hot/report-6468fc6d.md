---
uid: report-6468fc6d
id: REPORT-11515
type: report
title: 'Report: blocked_by_handoff for report-49607926'
created_by: xgd
created_at: '2026-11-08T16:26:13.531861+00:00'
updated_at: '2026-11-08T16:40:15.716315+00:00'
completed_at: null
last_field_updated: ruling
fields:
  report_kind: blocked_by_handoff
  subject_uid: report-49607926
  rule: code_frozen
  evidence: |-
    The gate already ran my earlier fix and the test passed, so I made no new edits. Its report is staged at `.xgd/_staging/rr_b41_q1.json`, timestamped 2026-11-08T16:07:05Z. It ran after my edit (committed in `3ef55bf62c`) and lists `test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow` as `passed`, with the vitest suite at 275 passed and 0 failed. Its companion test in the same group, `test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence`, also passed.

    The fix it ran:
    - **Line-break case:** both lines are captured as separate runs and neither carries a flow group or flow text. The capture code only records a flow with more than one run (`extract.ts:1249`), and a `<br>` turns each line into a one-run flow. If the `<br>` did not end the flow, the two lines would share one group and the test would fail.
    - **Flex row case:** neither the "Home" nor the "About" link carries a flow group.

    No production code changed. The acceptance criterion, AC-2449, already says neither line carries a flow id, so it needed no edit.

    ```yaml
    ## Assessment
    status: fixed
    tests:
      - name: "REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow"
        file: tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts
        cause: "The original test expected a flow group on each <br>-split line. extract.ts only records a flow with more than one run, so one-run segments carry none."
        fix: "Assert both lines are captured as separate runs with no flow group or flow text. Without the <br> split they would share one defined group. Committed in 3ef55bf62c."
        upstream: "None. AC-2449 already says neither line carries a flow id."
        verification: "Gate report at 2026-11-08T16:07:05Z (.xgd/_staging/rr_b41_q1.json) lists this test as passed. Suite: 275 passed, 0 failed."
    ```
  proposed_change: '(none stated: the builder made no edits and gave no verdict; see
    evidence)'
  batch_index: 0
  parent_report_uid: report-b688435f
  anchor_ticket: bundle-0d00566a
  ruling: declined
  ruling_reason: 'Rung 1 decided that the code is right: REQ-211 and AC-2449 require
    a <br> to end a flow, and extract.ts already does this. The fix belonged to the
    test and was already made inside the rule (test-only commit 3ef55bf62c, gate passing).
    code_frozen therefore stands and no production file needs to change.'
---

# Builder blocked by `code_frozen`

**Evidence**: The gate already ran my earlier fix and the test passed, so I made no new edits. Its report is staged at `.xgd/_staging/rr_b41_q1.json`, timestamped 2026-11-08T16:07:05Z. It ran after my edit (committed in `3ef55bf62c`) and lists `test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow` as `passed`, with the vitest suite at 275 passed and 0 failed. Its companion test in the same group, `test_UAT_FC_REQ_211_an_inline_element_stays_in_its_sentence`, also passed.

The fix it ran:
- **Line-break case:** both lines are captured as separate runs and neither carries a flow group or flow text. The capture code only records a flow with more than one run (`extract.ts:1249`), and a `<br>` turns each line into a one-run flow. If the `<br>` did not end the flow, the two lines would share one group and the test would fail.
- **Flex row case:** neither the "Home" nor the "About" link carries a flow group.

No production code changed. The acceptance criterion, AC-2449, already says neither line carries a flow id, so it needed no edit.

```yaml
## Assessment
status: fixed
tests:
  - name: "REQ-211 the capture records which runs are one flow test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow"
    file: tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts
    cause: "The original test expected a flow group on each <br>-split line. extract.ts only records a flow with more than one run, so one-run segments carry none."
    fix: "Assert both lines are captured as separate runs with no flow group or flow text. Without the <br> split they would share one defined group. Committed in 3ef55bf62c."
    upstream: "None. AC-2449 already says neither line carries a flow id."
    verification: "Gate report at 2026-11-08T16:07:05Z (.xgd/_staging/rr_b41_q1.json) lists this test as passed. Suite: 275 passed, 0 failed."
```

**Proposed change**: (none stated: the builder made no edits and gave no verdict; see evidence)

## Ruling: declined

Rung 1 decided that the code is right: REQ-211 and AC-2449 require a <br> to end a flow, and extract.ts already does this. The fix belonged to the test and was already made inside the rule (test-only commit 3ef55bf62c, gate passing). code_frozen therefore stands and no production file needs to change.
