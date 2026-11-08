---
uid: comment-c3b9de59
id: COMMENT-7998
type: comment
title: Claude response for batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T13:44:38.780783+00:00'
updated_at: '2026-11-08T13:44:38.780783+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-e2b21765
  kind: note
---

I fixed the AC-2449 test, but it's a browser test so it couldn't run here; whether it passes is up to the next gate run.

**What failed.** The gate's report shows the failure at `tests/reconciliation-multi-variate-text-runs.test.ts:320`: `expect(plain?.inlineGroup).toBeTruthy()` received `undefined`. That line was a "control" a previous fix pass added, claiming the two `<span>`s in the fixture's `p.uniform` paragraph share an inline flow.

**Why the control was wrong.** The two spans are the paragraph's only children and share a tag and class. Capture's `itemGroup` (`tools/generate/src/cli/capture/extract.ts:1452`) treats that pattern as repeated items, so each span goes through its own `runsUnder` call. Each one is then a flow of one, and a flow of one gets no flow id (`extract.ts:1249`). The code is right; the test's assumption was not.

**Test fix (test file only, no production code touched).** The control now uses the heading in the same fixture. The runs `19` (inside `<sup>`) and `92` (bare text after it) must carry the same defined flow id as `Serving`, `real` and `food`. That proves capture really does record flows, so the later checks still mean something:
- Both `<br>` lines carry no flow id. That follows from the code: each line is its own flow of one (`extract.ts:1190–1196`, `1249`).
- None of the flex-row links carries a flow id, because each blockified link is its own flow.

No assertion was weakened, and the fixture is unchanged since other tests share it.

**AC update.** I updated AC-2449's body (acceptance_criterion-74283589) with a specific commit message. The verification now names the heading's runs as the control, and a note explains that same-tag sibling spans are captured as separate items. The story needed no change.

**Verification.** Running the test file here: 14 passed and AC-2449 skipped because Chromium can't launch in the sandbox. That proves the file compiles, not that the test passes.

**Worth checking.** The older FC test, `test_UAT_FC_REQ_211_a_break_and_a_blockified_child_end_a_flow` in `tests/test_UAT_FC_REQ-211_runs_survive_a_capture.test.ts`, still asserts the `<br>` lines carry *defined*, differing flow ids. By the code reading above it would fail if run with a browser. It's outside this batch, so I left it alone.

```yaml
## Assessment
status: fixed_unverified
blocked_by: null
evidence: "Gate report report-7df724b6: AssertionError 'expected undefined to be truthy' at reconciliation-multi-variate-text-runs.test.ts:320:34 (the p.uniform span control). extract.ts itemGroup (1452-1459) takes p.uniform's two same-tag spans as repeated items, each runsUnder'd alone, so each is a single-run flow with no inlineGroup (extract.ts:1249)."
change: "tests/reconciliation-multi-variate-text-runs.test.ts: replaced the p.uniform control with assertions that the heading's '19' (<sup>) and '92' runs share the defined flowId. The <br> and flex-link assertions are unchanged. AC-2449 verification updated to match."
```