---
uid: comment-fc5f7740
id: COMMENT-1258
type: comment
title: Claude response for fix_structural_validation report
created_by: xgd
created_at: '2026-08-20T04:41:28.266933+00:00'
updated_at: '2026-08-20T04:41:28.266933+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-daaf7c07
  kind: note
---

All 6 mutations committed, tree clean. **All ten violations and both warnings in `report-6d2d7d31` are now addressed.**

## This call — 6 mutations (findings 3, 4, 5 + warnings 12, 13)

**Three ACs added to STORY-75**, each grounded in code read at HEAD:

- **AC-1314** — capture-time font settling (BUG-16), all three mechanisms: the barrier positioned *after* page settle force-loading each visible run's exact face with bounded waits (`playwright-driver.ts:21-68`, re-established at `:155-159`); the offline mirrored-face rewrite and `text/css` sniff (`reextract.ts:36-55`); the full-shorthand `fontLoaded` probe (`extract.ts:389-406`). Written explicitly as AC-715's *complement*, since the story insists the two are not alternatives.
- **AC-1315** — the all-collapse body-spanning fallback (BUG-15, `extract.ts:1382-1403`), with its independence from AC-815 stated in the criterion and the byte-identical-across-two-renders signature used as the verification.
- **AC-1316** — the modern-syntax scrim probe (BUG-24, `extract.ts:265-318`, `:1055-1063`), pinning the four colour syntaxes AC-816 left unpinned plus the lossless-serialization-over-pixel-readback rule, and verifying the dependency the report identified: AC-816's translucent-fill exclusion only holds if the scrim is genuinely recorded as the overlay.

**Warning 13** — AC-1286 and AC-1289 gained their JSON clauses, including the `--clusters`-wins-over-`--collapse` precedence grounded at `index.ts:797`.

**Warning 12** — took the assessor's *retain* branch on AC-656 rather than folding it: a scope note now declares it the named REQ-58 regression anchor, with AC-1290 carrying the general registry guarantee. The overlap is declared instead of accidental.

## Attempt totals

STORY-75: 14 → 21 ACs. STORY-76: 5 → 8, one durably deprecated (AC-637's `lifecycle: deprecated` was a non-schema field leaving it `active`; now `status: deprecated`).

No code edits. The two stale comments in `validate.ts:131` and `:167` remain — out of scope for this level, but they are the likeliest reason AC-638 survived five cycles while the executed path was hex-only.

One thing the next phase inherits: the eleven new ACs carry `uat_coverage: pending`, so they are a level=uat gap by construction. They're TypeScript/browser-capture behaviours, not pytest surfaces, so I wrote each Verification section as an executable test plan rather than attempting the tests here with the wrong runner. Final report is REPORT-2369 (`report-daaf7c07`), `needs_more_work: false`.
