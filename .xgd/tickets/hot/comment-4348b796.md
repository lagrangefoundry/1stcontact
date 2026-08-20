---
uid: comment-4348b796
id: COMMENT-1316
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T14:10:11.853893+00:00'
updated_at: '2026-08-20T14:10:11.853893+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-028c1de3
  kind: note
---

**Result: FAIL** — REPORT-2451 (`report-028c1de3`), 1 violation, 1 warning, 0 needs_review.

## What I verified

All 42 active ACs across STORY-84 and STORY-86 now have an AC-named UAT (previous cycle: 34 of 42). I ran all nine reconciliation suites: **9 files / 42 tests, all passing**. Every one drives real entry points (`foldToL1`, `cmdRepro`, `evaluateLayout`, `threeProbeGate`, `cli.run`, …) over real components — the only mock is a browser driver at the external engine boundary.

I re-checked each of the previous cycle's 14 violations and 1 warning against the current code rather than trusting the fix report. **All 15 are genuinely closed** — the eight new tests exist and are substantive, and the six widened ones assert the specific clauses they were asked for (AC-691's `responsive.fontSizePx` track and no-height-on-text-keyframes; the pinned-container `clip` with both magnitudes shared across AC-706/707/710; AC-736's captured-`box-*` pair reporting the overlap; AC-731's four attribution clauses).

## The one remaining violation

**AC-1352** names two attribution rules and its Verification instructs both. The test asserts only rule 1 (band takes its response from section edges). Rule 2 — a reconstructed card inherits its representative row's response — is implemented at `tools/generate/src/l1/fold.ts:1685-1688` and asserted by **no test in the repository**, FC or AC. Deleting those two lines leaves the whole suite green. The same test also never exercises the band-disagreement refusal at `fold.ts:1572-1579` in the false direction.

This is a genuine evidence hole, not a traceability gap like the previous round — repair is one card-shaped travelling-run fixture plus two or three assertions inside the existing test. No code change, no new AC.

The warning (AC-1351) covers two unasserted clauses — the off-sample viewport-containment check for the stacked grid, and the "≥2 distinct column extents" coincidence guard. It doesn't gate the level.

## Also on record

- Two FC UATs in `tests/req88-form-labelling-and-submit.test.ts` fail here with `listen EPERM 0.0.0.0` from `serve.ts:54` — reproduced independently; the sandbox denies wildcard binds, suites binding `127.0.0.1` pass in the same run. Not a defect, touches no AC-named UAT of this capability.
- The eight new AC UATs *mirror* rather than re-home their free-coded sources (both suites still exist). Filed as `info`, not an exclusivity violation — the two chains serve different traceability purposes.

The `xgd report create` push to the remote failed (sandbox has no network); the report is committed locally.
