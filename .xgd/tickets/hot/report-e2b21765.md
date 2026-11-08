---
uid: report-e2b21765
id: REPORT-11458
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-11-08T13:38:32.322664+00:00'
updated_at: '2026-11-08T13:38:32.322664+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-1e340c9a
  parent_report_uid: report-10515fdd
  batch_index: '0'
---

I fixed the AC-2449 test, but I couldn't run it. It needs a real browser, which this sandbox can't launch, so it was skipped here and only the validation gate can confirm it.

**Why it failed:** The gate stopped at line 318 with "expected undefined to be defined". The capture code (`tools/generate/src/cli/capture/extract.ts:1247-1256`) only records a flow id when a flow has **two or more runs**. The comment at `types.ts:537-538` says the same: "a single-run flow carries none of them." The `<br>` splits `p.broken` into two flows of one run each, so neither line gets a flow id. The code is right; the test wrongly expected every run to have one. The flex-link check had a related gap: it threw away runs without an id before comparing, so it would have passed no matter what.

**Test fix** (`tests/reconciliation-multi-variate-text-runs.test.ts`):
- **New control:** two inline spans in one `<p>` (`p.uniform`, already in the fixture) must share a flow id. This shows that a missing id below means "a flow of one", not "capture recorded nothing".
- **`<br>` lines:** both lines must be found, and neither has a flow id. If the `<br>` didn't end the flow, the two lines would share an id like the control does.
- **Flex links:** all three must be found, and each has no flow id. This replaces the check that passed regardless.
- The sentence checks (shared id, ascending positions, root box, kept spaces, `super` alignment) are unchanged; the gate shows they already pass.

**AC fix:** I updated AC-2449 (`acceptance_criterion-74283589`) to say flow membership is recorded only for runs that share a flow, and that a run alone in its flow has none. The story's wording still fits, so I didn't change it.

**Checks run:** in this file, 14 tests pass and the AC-2449 browser test skips (no Chromium here). The file typechecks with no errors. I didn't touch any production code.

```yaml
## Assessment
status: fixed_unverified
tests:
  - name: test_UAT_AC2449_runs_of_one_sentence_share_a_flow_and_breaks_or_blockified_children_end_it
    status: fixed_unverified
    reason: "Browser test; can't run in this sandbox. The fix follows the gate's failure at line 318 and the code's rule that only flows of 2+ runs get a flow id (extract.ts:1249, types.ts:537-538)."
upstream:
  - ticket: acceptance_criterion-74283589
    change: "Criterion now says flow membership is recorded only for runs that share a flow; a <br>-split line or a blockified link carries no flow id"
```