---
uid: report-687c4cfb
id: REPORT-840
type: report
title: Fix 1c Size-Aware Diffing (uat) — attempt 1
created_by: xgd
created_at: '2026-07-23T10:43:29.440348+00:00'
updated_at: '2026-07-23T10:43:29.440348+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-18a822ac
  level: uat
  fixes_applied: 2
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-9260fc31
---

# Fix Summary — 1c Size-Aware Diffing (uat)

**Attempt**: 1
**Fixes applied this call**: 2
**Violations remaining**: 0
**Needs more work**: false

The single violation in report-31c711c0 was a `uat-add` coverage gap: AC-721
(`responsive-diff --out <file>` persists the raw N-way table, independent of
`--classify`/`--json`) had zero executable evidence. Behavior is reconciled
intent (bundle-ab9e0cb6) and already implemented in code — a RED→GREEN cycle was
not needed; the UAT passes against current code, exactly as the assessor's notes
predicted. Resolved with one `uat-add` plus AC activation.

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-721 (acceptance_criterion-1dc0667c) | Authored `test_UAT_AC721_out_persists_raw_table_independent_of_classify` in `tests/reconciliation-responsive-diff.test.ts`. Drives the real CLI entry point `run(argv)`; asserts (a) `responsive-diff --ref <ladder> --out <file>` writes the raw table (size columns + per-node rows, Hero cells 28/40/48) to the named path AND still emits the table to stdout; (b) `--classify --out <file2>` leaves the persisted file byte-identical to (a) — raw table, `classifications` undefined — while stdout carries the `value-step` classification. Proves `--out` is additive and independent of `--classify`. Passes (9/9 in the file). |
| 2 | ac-activate | AC-721 (acceptance_criterion-1dc0667c) | Status `pending` → `active` now that the behavior is proven at the uat layer (matches its 8 active siblings). |

## uat_coverage field note

The uat-add recipe mentions setting `uat_coverage: pass`, but every one of the 8
active sibling ACs under story-2c7069fe carries `uat_coverage=None`; coverage is
evidenced by the `test_UAT_AC<n>_*` test existing + `status=active`, not by a
`uat_coverage` field. Setting that field on AC-721 alone would diverge from the
matrix convention and leave it *less* consistent. AC-721 now matches its siblings
exactly (active, no divergent field, one substantive entry-point-exercising UAT).

## Code Edits (if any)

None. `--out` is a missing test, not a code bug — the code path
(`tools/generate/src/cli/responsive-diff.ts:197` writes the raw table;
`tools/generate/src/cli/index.ts:509` wires `--out`) already matches AC-721's
criterion. Only test + AC-status mutations were made. (One-line import addition
of `existsSync`/`readFileSync` to the test file's `node:fs` import is test-only.)

## Verification

`npx vitest run tests/reconciliation-responsive-diff.test.ts` → **9 passed (9)**,
including the new UAT. No previously-passing test regressed.

## needs_review Items Forwarded

None. The single finding was unambiguous (`uat-add`) and is resolved.
