---
uid: report-e3e38cbe
id: REPORT-906
type: report
title: 'UAT Coverage: 1c Size-Aware Diffing'
created_by: xgd
created_at: '2026-07-24T07:47:43.782396+00:00'
updated_at: '2026-07-24T07:47:43.782396+00:00'
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

Both stories carry `intent_uid: bundle-ab9e0cb6` (BUNDLE-6 = REQ-58 + REQ-59 +
REQ-62 + REQ-61), `status: free_and_reconciled`, `merged_at_commit
7a42e182`. The capability body states it was "Reproduced from the
bundle-ab9e0cb6 reconciliation (REQ-61)". This matrix (2 stories, 17 ACs)
was authored *from* that reconciled intent on 2026-07-23 — it is the current
cumulative intent, not a drifted descendant of it. No later intent in the
ledger retires size-aware diffing, the per-viewport reference screenshots, or
the standalone `responsive-diff` command.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (REQ-61) | free_and_reconciled | 2026-07-23 | Established `--size` viewport selector on values-diff + pixel diff, per-width reference screenshots at capture, and the standalone cross-size `responsive-diff` N-way table + classifier | YES |

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-77 | bundle-ab9e0cb6 (REQ-61) | aligned | Every in-scope behavior (`values-diff --size`, `diff --size`, fail-loud on missing reference data ×3, per-viewport screenshots, default-path preservation, invalid-size rejection) supported by reconciled intent; nothing retired |
| STORY-78 | bundle-ab9e0cb6 (REQ-61) | aligned | Every in-scope behavior (N-way table, `--sizes`, occurrence-by-occurrence join, changed/steady + presence-flip, `--classify` structural-first, human/JSON/`--out`, terminal-fail stale/uncaptured) supported by reconciled intent; nothing retired |

## Findings — Categorized by Editor Action

None. Zero violations, zero warnings, zero needs_review.

## Coverage Detail

All 17 ACs are active per cumulative intent and each is substantively covered
by an executable UAT that drives a real command entry point. The tests were
executed this round: **17/17 pass** (`tests/reconciliation-size-aware-diff.test.ts`
8 tests, `tests/reconciliation-responsive-diff.test.ts` 9 tests).

STORY-77 (`tests/reconciliation-size-aware-diff.test.ts`) — real entry points
`cmdValuesDiff`, `cmdDiff`, `cmdCapturePage`, `run(argv)`:
- AC-639 values-diff --size compares at selected width (mobile flags %-vs-fixed reflow, desktop clean)
- AC-640 omitting --size preserves single-width default path (both commands)
- AC-641 values-diff --size no-ladder fails loud with re-capture guidance
- AC-642 values-diff --size uncaptured width fails loud naming available widths
- AC-643 pixel diff --size pairs against same-width reference screenshot
- AC-644 pixel diff --size no same-width shot fails loud, writes no artifacts
- AC-645 invalid --size rejected naming vocabulary (both commands), no report written
- AC-647 capture persists per-width reference screenshots; value matrix carries no image bytes

STORY-78 (`tests/reconciliation-responsive-diff.test.ts`) — real CLI boundary
`run(argv)` with authored ladder fixtures:
- AC-648 N-way per-node table with default size columns
- AC-649 --sizes selects/orders columns; unknown token rejected
- AC-650 partitions changed vs steady; flags presence flips; sub-pixel jitter stays steady
- AC-651 repeated identical text aligned occurrence-by-occurrence in document order
- AC-652 --classify labels moves (presence-flip/layout-swap/value-step), structural grouped first
- AC-653 terminal-fails on stale reference with re-capture guidance
- AC-654 terminal-fails on un-captured width listing available widths
- AC-655 --json machine-readable; --ref required
- AC-721 --out persists raw N-way table, independent of --classify

Mocking is confined to external boundaries only: the browser is faked via a
`BrowserDriver` for the capture test (AC-647), and `console.log/error` are
spied to capture CLI output. No internal component is mocked — the diff/table
logic under test runs for real.

## Notes for the Editor

Nothing to action. The matrix was freshly reconciled from bundle-ab9e0cb6 and
is fully aligned; all ACs are active and substantively evidenced.

Advisory only (not a finding): `.xgd/uat_index.json` reports every test as
`status: missing` / `last_run: null` in this regression worktree. This is the
known fresh-regression-worktree phantom (the gitignored index was not carried
into the worktree), NOT a coverage gap — all 17 tests exist as committed source
and were run green this round. No fix belongs in the coverage matrix for it.
