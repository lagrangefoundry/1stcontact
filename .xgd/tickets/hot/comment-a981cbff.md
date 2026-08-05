---
uid: comment-a981cbff
id: COMMENT-677
type: comment
title: Claude response for uat_coverage_check report
created_by: xgd
created_at: '2026-08-05T22:29:21.344290+00:00'
updated_at: '2026-08-05T22:29:21.344290+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-ec51a235
  kind: note
---

Report schema is correct (`result: fail`, `report_kind`, `subject_uid`, integer counts).

## Assessment complete — REPORT-1321 (`report-ec51a235`), result **FAIL**

**Verdicts written**: 24 ACs `pass` · STORY-86 `pass` · STORY-84 `needs_review` · CAP-71 `fail`. Counts: 0 violations, 0 warnings, 1 needs_review.

### Coverage is genuinely good
All 24 named UATs exist and pass (`4 files, 24 tests`). They drive real entry points — `foldToL1`, all three probes, `threeProbeGate`, `promoteToFlow`, `evaluateLayout`, `validateL1`, `renderL1Document`, `cmdCapturePage`, `cmdL1Gate`, and the `1c` CLI via `run(argv)`. No internal mocking; the only mock is a fake browser driver at the true external boundary. Several tests encode explicit discriminators rather than just asserting success (AC-705 shows a text- or kind-keyed map would produce phantom deltas; AC-735 runs a closed-upper-bound counterfactual; AC-736 proves its exception is load-bearing, not vacuous).

Two prompt artifacts worth flagging, since both would mislead a future attempt:
- `.xgd/uat_index.json` reports `status: "missing"` for all 24 — that's stale run-status, not absence.
- The prompt's lookup snippet uppercases the AC key; the index keys are lowercase (`ac705`), so it returns nothing. That likely explains some of the 3 prior attempts.

### The one real finding
BUNDLE-10 (`free_and_reconciled`) records fold behaviors — BUG-17 padding folding, BUG-18 per-width responsive text tracks, BUG-14 band tiling + card grouping + `borderLeft`, BUG-20 box treatments on runs. Neither story body nor any AC (swept all 87) describes them — **and they're absent from the code on this branch too**.

The matrix and the code agree; both disagree with the ticket store. Verified: `borderLeft` is present on `reconcile-BUNDLE-10` (1 hit) and `xgd-working` (2), but **zero on `main` and this branch**, even though `2d59a3b6` is tagged `xgd/merged/BUNDLE-10` and is an ancestor of HEAD.

I did not classify this as a coverage violation, and deliberately did not author UATs for it — the behavior isn't in the code, so those tests would fail against absent implementation. Either BUNDLE-10's fold payload never reached `main` (a reconcile repair, after which STORY-84 needs body + ac-add + uat-add, and AC-691/AC-731 need edits because they describe pre-BUG-18/pre-BUG-14 behavior), or that work was deliberately superseded and the bug statuses are stale (ticket hygiene only; the matrix is already correct). The `borderLeft` divergence points toward the first, but that's an operator call, so I routed it rather than guessing.

STORY-86 needs no action — body, 11 ACs, and both test files are mutually consistent and green.
