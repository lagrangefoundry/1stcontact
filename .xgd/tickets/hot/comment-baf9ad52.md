---
uid: comment-baf9ad52
id: COMMENT-1269
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-20T06:51:27.529390+00:00'
updated_at: '2026-08-20T06:51:27.529390+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-3562dc75
  kind: note
---

**PASS** — report `REPORT-2394` (`report-3562dc75`): 0 violations, 3 warnings, 0 needs_review.

## What I verified (attempt 10, level=uat)

**The attempt-9 violation is genuinely closed** — checked at source and by execution, not taken from the fix report. AC-815's tests no longer sit behind the vacuous `itA` wrapper (`bug27:98-99` is now `it.runIf(browserOk)`), the hook guard precedes `serveDir`, and 5 new headless UATs (`bug27:244-303`) drive the real `EXTRACT_SCRIPT` under jsdom. `bug27` ran clean here; in attempt 9 it was a 180s hook timeout and a FAILED suite.

**Independent re-derivation, not trust in prior reports:**
- AC→test index rebuilt from source: all 63 non-deprecated ACs carry ≥1 AC-linked test; AC-637 (deprecated) correctly carries none.
- Gating shape counted per AC — the check that would have caught the nine-attempt blind spot: **every AC now carries ≥1 *ungated* test**, so no AC is entirely skipped headlessly.
- All 22 capability test files executed in one run: **172 passed, 23 skipped, 0 failures, 9.28s**. Every skip is an honest `it.runIf`; no `describe.skip`/`.todo` anywhere.
- Clause-by-clause read of the surface every prior attempt confirmed but never opened: STORY-77 and STORY-78 (17 ACs). Both drive real entry points (`cmdValuesDiff`, `cmdDiff`, `cmdCapturePage`, `run(argv)`) — no structural stand-ins.

## The three warnings

1. **AC-1310 contradicts its own tests** (`ac-edit`). Its Verification says a wrapping element yields "one run per line", but `extract.ts:1097-1125` counts runs **per text node**, and `bug25:282-287` asserts the opposite in as many words. The AC's normative rule ("one run per text node") is correct and fully tested — only the phrasing is wrong, inherited from BUG-25's loose description of a `<br>`-split hero. Fix the AC, not the test.
2. **AC-1311 has one uncovered case of six** (`uat-add`): the pre-`surface` legacy-bundle inertness clause. The other five are well covered.
3. **AC-1307's oklch case** — carried forward unchanged, browser-gated, honest, already documented in the AC. No action possible without a Chromium runner.

One thing worth your attention (recorded as info, not a finding): `xgd ticket list --filter "fields.uat_coverage=fail"` still returns six of this capability's ACs as failing, while `xgd ticket get` on each returns `pass`. The index lags the tickets. If any gate keys off the filtered list rather than the tickets, this capability stays red no matter what the matrix says.
