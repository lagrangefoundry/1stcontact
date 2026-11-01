---
uid: report-be59bb03
id: REPORT-842
type: report
title: 'UAT Coverage: 1c Size-Aware Diffing'
created_by: xgd
created_at: '2026-07-23T10:50:27.483624+00:00'
updated_at: '2026-07-23T10:50:27.483624+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-18a822ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# UAT Coverage Assessment: 1c Size-Aware Diffing

**Result**: PASS
**AC verdicts**: 17 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 2 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-61 (via BUNDLE-6 / bundle-ab9e0cb6) | free_and_reconciled | reconciled @ 7a42e18 | Established size-aware diffing: `--size` on values-diff + pixel diff, fail-loud on missing per-viewport reference data, per-width reference screenshots at capture, and the standalone `responsive-diff` N-way table + change classifier | YES |

Both stories in this capability (STORY-77, STORY-78) carry `intent_uid: bundle-ab9e0cb6`. The bundle is `free_and_reconciled` (merged at 7a42e182). No later intent retires any of this behavior — the whole capability is currently active per cumulative intent.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-77 | REQ-61 (bundle-ab9e0cb6) | aligned | Story body's four in-scope claims (`values-diff --size`, pixel `diff --size`, fail-loud on missing reference data, per-viewport reference screenshots) all supported by the reconciled intent; each maps to a substantive AC/UAT. |
| STORY-78 | REQ-61 (bundle-ab9e0cb6) | aligned | Standalone `responsive-diff` (N-way table, `--sizes`, changed/steady + presence flips, occurrence alignment, `--classify`, `--json`/`--out`, terminal-fail) all supported; CAP-65 body explicitly reserves this downstream command. `--out` claim (AC-721) is named in the story body. |

## Findings — Categorized by Editor Action

None. Zero violations, zero warnings, zero needs_review.

Every active AC and both story bodies are intent-supported and substantively covered:

- **17/17 active ACs** have exactly one substantive UAT that drives a real entry point (`run(argv)`, `cmdValuesDiff`, `cmdDiff`, `cmdCapturePage`) with fixtures injected only at external boundaries (the browser driver is faked; console is spied). No internal mocking of the logic under test.
- Assertions are discriminating, not structural: e.g. AC-643 asserts the same-width tablet reference is used (mean ≈ 0) where a desktop fallback would read ≈ 190; AC-650 proves sub-pixel box jitter rounds away to "steady" while a real font step reads "changed"; AC-721 proves the persisted `--out` file is byte-identical with and without `--classify`.
- Both story bodies are fully covered — no behavioral claim lacks a corresponding AC/UAT.
- Full suite green: 17/17 passing (`reconciliation-size-aware-diff.test.ts`, `reconciliation-responsive-diff.test.ts`), 1.46s.

## Notes for the Editor

No editor action required. The prior fix cascade (AC-721 activation + its UAT, commit 636c329c) closed the one gap from the earlier validation round; this coverage check confirms the capability is now fully aligned and substantively covered. AC-646 is absent from the active set (superseded upstream) and is correctly not counted as a gap.

