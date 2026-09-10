---
uid: report-a3f90263
id: REPORT-3609
type: report
title: Fix 1c Capture & Diff Fidelity (uat) — attempt 7 (cont. 2)
created_by: xgd
created_at: '2026-09-10T00:41:16.542420+00:00'
updated_at: '2026-09-10T00:41:16.542420+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: uat
  fixes_applied: 5
  progress_made: true
  needs_more_work: true
  violations_remaining: 2
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — 1c Capture & Diff Fidelity (uat)

**Attempt**: 7 (cont. — third call at level=uat)
**Fixes applied this call**: 5
**Violations remaining**: 2
**Needs more work**: true

This call cleared **all four remaining STORY-77 `pending` ACs** — the multi-viewport
mode itself (AC-1613) and its three reporting layers (AC-1614 `--collapse`, AC-1615
`--clusters`, AC-1616 the roll-up honesty rules). Finding 10 is now 6 of 13 done;
STORY-77 has no pending ACs left.

The two remaining violations (findings 3 and 4) are unchanged and remain blocked on
an operator decision and on a runner with Chromium respectively.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1613 (finding 10) | New file `tests/reconciliation-multi-viewport-reporting.test.ts` — 4 tests driving the real `diffMultiState` / `formatMultiViewportReport` / `cmdValuesDiffMultiViewport`: one cell per persisted rung with none skipped, worst-cell-first ordering produced (not assumed), clean cells collapsing to one line with a loud missing cell, and the no-ladder refusal emitting no report |
| 2 | uat-add | AC-1614 (finding 10) | Same file — 4 tests over the real `collapseMultiViewport` / `formatCollapsedReport`: the un-collapsed per-cell view is the default and reports one row per rung; a six-rung ladder collapses to one row naming every rung; an all-width and a narrow-only defect are distinguished within one run; the headline counts defects (2), not cells (8) |
| 3 | uat-add | AC-1615 (finding 10) | Same file — 3 tests over the real `clusterDefects` / `formatClusterReport`: the shape+border → "control styling" merge at `fix`; representatives; count-first then worst-tier ranking; `@all` vs `@320,375` width scope; summary totals agreeing |
| 4 | uat-add | AC-1616 (finding 10) | Same file — 2 tests: a derived axis is never a cause and never counted, while still reachable and stated in the report; **an untaxonomised property is kept under its own name at `review` and counted** — the clause with no evidence anywhere in the repo |
| 5 | field-update | AC-1613, AC-1614, AC-1615, AC-1616 | `uat_coverage`: `missing` → `pass` |

## Mutation Evidence

Each new group was proven load-bearing by breaking the production line it guards,
re-running against the FC siblings as a control, and reverting. **Production code is
unmodified** — `git status` shows one new test file and no modified files.

| Mutant | Result |
|---|---|
| `fidelity.ts` `clusterDefects` — drop untaxonomised properties instead of falling back to `{ cause: d.property, disposition: 'review' }` | **32 passed, 2 failed.** All 25 FC siblings in `req63-values-diff-coverage.test.ts` stayed green; only the new AC-1616 fallback test and AC-1615's summary-totals test caught it |
| `values-diff.ts` `diffMultiState` — remove `out.sort((a, b) => worst(b) - worst(a))`, the worst-cell-first ordering | **15 passed, 2 skipped, 2 failed.** Every FC sibling in `req58-multi-viewport.test.ts` stayed green — because `test_UAT_FC_REQ-58_multiviewport_formatter_missing_fail_clean` hands the formatter a **pre-ordered** array and so asserts that order is *preserved*, never that it is *produced*. Only the new AC-1613 tests caught it |

That second control is the clearest statement of what these tests add: the ranking
that makes `--multi-viewport` useful — the worst rung leading without the caller
naming it — had no test anywhere that would notice if it stopped happening.

## Verification

```
Test Files  11 passed (11)
     Tests  91 passed | 10 skipped (101)
```

Across the new file plus every adjacent suite: `req58-multi-viewport`,
`req63-values-diff-coverage`, `reconcile-values-diff-fidelity`,
`reconciliation-responsive-diff`, and the six files from the two previous calls. No
regressions. The 10 skips are browser-gated (no Chromium in this environment).

## Finding 10 — running total

**6 of 13 done.** STORY-77's pending set is now empty.

| Done | AC | Call |
|---|---|---|
| ✅ | AC-1609, AC-1610 | previous |
| ✅ | AC-1613, AC-1614, AC-1615, AC-1616 | this call |

| Remaining | Story | Sibling to build from |
|---|---|---|
| AC-1605 | STORY-75 | `tests/bug25-multiline-run-geometry.test.ts:102-182` |
| AC-1606 | STORY-75 | `tests/bug22-split-control-surface.test.ts:109-171` |
| AC-1607 | STORY-75 | `tests/bug16-webfont-load-before-extract.test.ts:94-186` |
| AC-1608 | STORY-75 | `tests/bug24-scrim-alpha.test.ts:82-202` |
| AC-1611, AC-1612 | STORY-76 | **No sibling under any name** — author from the Verification directly. `grep -rln "REQ-72" tests/` still returns nothing |
| AC-1617 | STORY-77 | **No sibling** — but note it is now the only pending AC left on STORY-77, and `selectProjectionAtWidth` (`values-diff.ts:2714-2724`) is the mechanism it describes, so it is straightforwardly reachable next call |

## Code Edits

None. All three mutation experiments (this call and the two prior) were reverted;
`git status` shows only `tests/reconciliation-multi-viewport-reporting.test.ts` as
new, and no modified files.

## needs_review Items Forwarded

Unchanged from the previous two calls; repeated so the record is complete in one
place.

| Element | Assessor said | Operator decision needed |
|---|---|---|
| AC-720 (finding 3, **violation**) | "Either (a) add a browser-gated end-to-end leg … or (b) if judged genuinely un-automatable, **ac-edit** AC-720 to drop the end-to-end clause" | Which branch? (a) is blocked — no Chromium here. Seventh consecutive filing. If the aligned-crops browser+sharp pipeline is expected to stay manually verified, (b) is the honest repair and I can apply it next iteration, but removing an assertion from an AC is a scope call I should not make unilaterally |
| AC-815 (finding 4, **violation**) | "Extend `bug27-nested-backdrop.html` with (i) an `overflow: hidden` carousel … and (ii) a conventionally laid-out band" | Authored in the first call, but unexecutable here — `chromiumAvailable()` is false, so the tests report SKIPPED. Can this loop run on a host with Chromium? Otherwise AC-815 will keep failing uat validation regardless of what is written |
| AC-1610 | — (found by this step in the previous call, not the assessor) | Its Verification sentence "assert exactly one delta is reported" overreaches its own Criterion: a row shift also fires an independent `position` delta. Needs an `ac-edit` at the next ac-level pass; not actionable at level=uat |
