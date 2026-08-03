---
uid: report-09f12dfe
id: REPORT-1107
type: report
title: Claude batch_fix_assessment report
created_by: xgd
created_at: '2026-08-03T01:22:16.859967+00:00'
updated_at: '2026-08-03T01:22:16.859967+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: batch_fix_assessment
  subject_uid: story-8acc338d
  parent_report_uid: report-8922db6f
  batch_index: '0'
---

Batch 0 fixed. All three failures traced to one stale test.

## Root cause

The test asserted `a form control is ALWAYS routed to a residual`. The code (REQ-93, frozen) routes controls **with geometry** to a `contact-form` behavior-module seam — a `slot` node — and makes a control a residual only when it has **no geometry at any sampled width**. The failure was `expected ['Expressible Heading', 'slot'] to deeply equal ['Expressible Heading']`.

AC-733's body already describes the seam behavior correctly ("a control with no geometry does too"), so no upstream propagation was needed — the AC and story were already right; only the test lagged. The two "orphaned acceptance criterion" entries are the same AC uid (`acceptance_criterion-0d993a36`, one carrying a stale title snapshot); both resolve once a passing test references AC-733.

## The fix (test-only, `tests/reconciliation-l1-fold-full-language.test.ts`)

- Split the control fixture into the two cases the AC separates: one control **with** geometry, one **without**.
- The with-geometry control now asserts the real seam: exactly one `slot` leaf named `form-0` with `behavior: 'contact-form'`, geometry keyframes pinned to the control's captured rect `[20, 520, 240, 40]` at all six ladder widths, and a derived `FoldedForm` carrying field label `Email`.
- The geometry-less control asserts a typed `field` residual matching the code's actual reason (`no geometry at any sampled width — no slot to mount at`), with its captured axes and widths.
- Kept "never synthesized into a raw L1 leaf" as an assertion that no `box`/`image` leaf appears for the control's painted fill/radius/border.
- Updated the `describe` title and file header to the current AC wording.

## Verification

- Mutation check: deleting the geometry-less-control `signal(...)` call in `fold.ts` makes the test fail (`5` → `4` residuals). Production file restored — `git status` shows only the test file modified.
- `test_UAT_AC733` passes; the six fold/slot test files pass (41 tests).
- Typecheck: 296 errors before and after, zero in the changed file — all pre-existing and in unrelated files (the quality report's build step reports success).

## Not in this batch

The full suite has 3 other failures — `test_UAT_FC_BUG-17_fold_gigabytealchemy_badge_padding`, `test_UAT_AC737_gate_reports_fold_residuals_as_their_own_channel`, `test_UAT_AC705_sample_fidelity_matches_oracle_within_tolerance`. I confirmed by stashing my change that all three fail identically without it: pre-existing, belonging to BUG-17 and story-24098299 (the 3-Probe Reproduction Gate), outside this batch's scope. Left untouched.
