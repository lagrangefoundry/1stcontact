---
uid: report-6406e84b
id: REPORT-3611
type: report
title: Fix 1c Capture & Diff Fidelity (uat) — attempt 7 (cont. 3)
created_by: xgd
created_at: '2026-09-10T00:49:55.668611+00:00'
updated_at: '2026-09-10T00:49:55.668611+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-aa030c83
  level: uat
  fixes_applied: 6
  progress_made: true
  needs_more_work: true
  violations_remaining: 2
  anchor_report_uid: report-e37a6b4a
---

# Fix Summary — 1c Capture & Diff Fidelity (uat)

**Attempt**: 7 (cont. — fourth call at level=uat)
**Fixes applied this call**: 6
**Violations remaining**: 2
**Needs more work**: true

Three more `pending` ACs closed — AC-1605, AC-1606 and AC-1617 — each with mutation
evidence and each **browser-free**, which matters because two of the three had
free-coded evidence that only runs under Chromium and therefore has never executed
in this environment.

Finding 10 is now **9 of 13** done. STORY-77's pending set is now genuinely empty.

**Correction to the previous report.** `report-a3f90263` stated "STORY-77's pending
set is now empty" after closing AC-1613–1616. That was wrong: AC-1617 belongs to
`story-16f2793c` (STORY-77) and was still pending. It is closed in this call, so the
claim is true now but was not then. The remaining-work table in that same report
listed AC-1617 correctly, so the error was in the summary sentence only.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1606 (finding 10) | New file `tests/reconciliation-split-control-attribution.test.ts` — 5 tests over the real `EXTRACT_SCRIPT` → `flattenSignals` → `diffManifests` pipeline under jsdom: a faithful split control raising no shape/border/size/position delta; the **border axis** resolving to the bearing node; size measured against the backing box's rect; self-painting controls unaffected; and a manifest with no backing-surface reference staying **inert** |
| 2 | uat-add | AC-1605 (finding 10) | New file `tests/reconciliation-per-run-text-extent.test.ts` — 4 tests: a single-run element contributing its own rendered text box; each run of a `<br>`-broken paragraph matching its own text-node rect, distinct from its sibling and narrower than the shared block; a nested span giving each owner its own extent; and a one-line difference reported for that line alone |
| 3 | uat-add | AC-1617 (finding 10) | Appended to `tests/reconciliation-size-aware-diff.test.ts` — 4 tests over the real `selectProjectionAtWidth` and `cmdValuesDiff`: Chromium-at-rest preferred and stable; fallback through any-at-rest then anything; an unreached width selecting nothing; and two successive `--size` runs reading the same reference cell |
| 4 | field-update | AC-1605 | `uat_coverage`: `missing` → `pass` |
| 5 | field-update | AC-1606 | `uat_coverage`: `missing` → `pass` |
| 6 | field-update | AC-1617 | `uat_coverage`: `missing` → `pass` |

## Mutation Evidence

Each group was proven load-bearing by breaking the production line it guards,
running the FC siblings as a control, and reverting. **Production code is
unmodified.**

| Mutant | Result |
|---|---|
| `values-diff.ts` `const actBorder = surface ? surface.border : act.border` → `act.border` | **9 passed, 2 failed.** All 6 BUG-22 FC siblings stayed green — they never author a border at all — and only the two new AC-1606 border tests caught it |
| `extract.ts` `var ownRun = runCounts.get(el) === 1` → `true` (every run takes its element's box — the BUG-25 pathology) | **3 passed, 4 skipped, 2 failed.** All four BUG-25 FC siblings **skipped** (browser-gated, no Chromium), so nothing in this environment would have noticed. Only the new AC-1605 tests caught it |
| `values-diff.ts` `selectProjectionAtWidth` → `return atWidth[0]` (iteration order) | **11 passed, 3 failed.** Every pre-existing test in the size-aware suite stayed green — AC-639 asserts the reference comes from the ladder *at the width*, never *which cell* — and only the three new AC-1617 tests caught it |

The second row is the sharpest: AC-1605's capture claim had **no executing evidence
whatsoever** in a browserless environment, and the mutant demonstrates that
directly — the guard tests skip while the behaviour silently regresses.

## Verification

```
Test Files  13 passed (13)
     Tests  100 passed | 14 skipped (114)
```

Across the two new files, the amended size-aware suite, both FC sibling suites
(`bug25-multiline-run-geometry`, `bug22-split-control-surface`) and every suite
touched in the three previous calls. No regressions. The 14 skips are browser-gated.

## AC-body discrepancy found while authoring (candidate `ac-edit`, not applied)

**AC-1605's Criterion and Verification disagree about the nested-span case**, and
only one of them can be true of the code.

- The **Criterion** says "An element contributes its own rendered text box only when
  it owns *exactly one* text run." For `<h2>Outer bit <span>inner bit</span></h2>`
  the `<h2>` owns exactly one text node and the `<span>` owns exactly one, so both
  take the `ownRun` branch and are measured at element level. That is precisely what
  `extract.ts:1123` (`runCounts.get(el) === 1`) does.
- The **Verification** asks that each run of "a heading with a nested span" match
  "that run's own text-node rect". For the `<h2>`'s run it does not — verified
  empirically: the run's extent comes back as the element measurement (1200px wide),
  not the text node's (120px).

The Criterion is satisfiable and is what the test asserts; the pathology the AC
exists to prevent — the runs coming out *identical* — genuinely does not occur for
this shape. Suggested repair at the next ac-level pass: drop "a heading with a nested
span" from the Verification's fixture list, or restate that clause as "each run
carries a distinct extent" rather than "matching that run's own text-node rect". No
behaviour change is implied. This is the same class of issue as the AC-1610 wording
gap forwarded two calls ago.

## Finding 10 — running total

**9 of 13 done.** STORY-77 (`story-16f2793c`) now has no pending ACs.

| Done | AC | Call |
|---|---|---|
| ✅ | AC-1609, AC-1610 | 2nd |
| ✅ | AC-1613, AC-1614, AC-1615, AC-1616 | 3rd |
| ✅ | AC-1605, AC-1606, AC-1617 | this call |

| Remaining | Story | Sibling |
|---|---|---|
| AC-1607 | STORY-75 | `tests/bug16-webfont-load-before-extract.test.ts:94-186` |
| AC-1608 | STORY-75 | `tests/bug24-scrim-alpha.test.ts:82-202` |
| AC-1611, AC-1612 | STORY-76 | **No sibling under any name.** `grep -rln "REQ-72" tests/` still returns nothing, so AC-1612's in-browser hexification of modern-colour-space gradient stops is untested outright and both must be authored from their Verification text |

## Code Edits

None. All four mutation experiments this call were reverted; `git status` shows two
new test files and one modified test file (`reconciliation-size-aware-diff.test.ts`,
+121 lines, the AC-1617 section), and no production changes.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| AC-720 (finding 3, **violation**) | "Either (a) add a browser-gated end-to-end leg … or (b) if judged genuinely un-automatable, **ac-edit** AC-720 to drop the end-to-end clause" | Which branch? (a) is blocked — no Chromium here. Eighth consecutive filing. If the aligned-crops browser+sharp pipeline is expected to stay manually verified, (b) is the honest repair and I can apply it next iteration, but removing an assertion from an AC is a scope call I should not make unilaterally |
| AC-815 (finding 4, **violation**) | "Extend `bug27-nested-backdrop.html` with (i) an `overflow: hidden` carousel … and (ii) a conventionally laid-out band" | Authored in the first call, unexecutable here — the tests report SKIPPED. Can this loop run on a host with Chromium? Otherwise AC-815 will keep failing uat validation regardless of what is written |
| AC-1610, AC-1605 | — (found by this step, not the assessor) | Two ACs whose Verification sentence overreaches its own Criterion (details above and in `report-e2c8368a`). Both need an `ac-edit` at the next ac-level pass; not actionable at level=uat |
