---
uid: comment-8f06c5b1
id: COMMENT-2408
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-09-10T00:41:32.560103+00:00'
updated_at: '2026-09-10T00:41:32.560103+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-a3f90263
  kind: note
---

Report filed as `report-a3f90263`.

## What I did

Cleared **all four remaining STORY-77 pending ACs** in one new file, `tests/reconciliation-multi-viewport-reporting.test.ts` (13 tests):

- **AC-1613** — the ladder-wide mode: one cell per persisted rung with none skipped, worst-cell-first ordering, clean cells collapsing to one line with a loud missing cell, and the no-ladder refusal emitting no report.
- **AC-1614** `--collapse` — the un-collapsed per-cell view is the default (8 rows), collapse yields 2 defects, narrow-only vs all-width distinguished in one run, headline counts defects not cells.
- **AC-1615** `--clusters` — the shape+border → "control styling" merge at `fix`, representatives, count-then-tier ranking, `@all` vs `@320,375` width scope, summary totals.
- **AC-1616** — derived axes uncounted but still stated; untaxonomised properties kept under their own name at `review`.

All drive the real `diffMultiState` / `collapseMultiViewport` / `clusterDefects` / the two formatters.

Two mutation tests, each run against the FC siblings as a control:

| Mutant | Result |
|---|---|
| `clusterDefects` drops untaxonomised properties | 25 FC siblings green; only the new AC-1616 + AC-1615 tests caught it |
| `diffMultiState` loses its worst-first sort | Every FC sibling green; only the new AC-1613 tests caught it |

That second one is worth calling out: the existing `test_UAT_FC_REQ-58_multiviewport_formatter_missing_fail_clean` hands the formatter a **pre-ordered** array, so it asserts the order is *preserved*, never that it's *produced*. The ranking that makes `--multi-viewport` useful — the worst rung leading without the caller naming it — had nothing anywhere that would notice if it stopped happening.

`Test Files 11 passed | Tests 91 passed | 10 skipped`. Production code untouched; `git status` shows one new file and nothing modified.

## Where finding 10 stands

**6 of 13 done.** Remaining: AC-1605/1606/1607/1608 (STORY-75, each with a usable sibling), AC-1611/1612 (STORY-76 — no sibling under any name; `grep -rln "REQ-72" tests/` still returns nothing), and AC-1617.

## Still blocked, unchanged

Findings 3 (AC-720) and 4 (AC-815) are on their seventh consecutive filing and neither will clear here. AC-720 needs your choice between a browser-gated leg and dropping the AC's end-to-end clause — removing an assertion from an AC isn't mine to decide. AC-815's fixture and assertions were written in the first call but can't execute without Chromium; they now correctly report SKIPPED rather than falsely green.
