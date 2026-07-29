---
uid: report-24cc56f6
id: REPORT-1045
type: report
title: Claude fix_reconciliation_review report
created_by: xgd
created_at: '2026-07-29T05:11:23.394539+00:00'
updated_at: '2026-07-29T05:11:23.394539+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_reconciliation_review
  subject_uid: bundle-cceaba25
---

Both review findings are closed with evidence that distinguishes the new behaviour from the superseded one, verified by mutation testing.

## Summary

**Stories created**: none — the review found no uncovered behaviour and no ungrounded story. Both failures were Step 5b evidence holes on existing ACs.

**Stories modified**: none at story level. Four ACs under `story-24098299` had their **Verification** sections tightened to describe the evidence that now exists (Criterion text unchanged except where noted):

- `acceptance_criterion-330b48e4` (AC-705) — Verification now specifies the all-kinds fixture, the occurrence-pairing discriminator, kind-labelled residual/unmatched entries, and the control/empty-run exclusion as an observable (empty `unmatched`).
- `acceptance_criterion-09d76485` (AC-709) — Verification now specifies the multi-region-plus-survivor fixture, nested promoted paths, per-region interior gaps, and the byte-identical base-fidelity check.
- `acceptance_criterion-83e8a724` (AC-706) and `acceptance_criterion-415d7f85` (AC-707) — replaced the "retained **real** multi-region capture" qualifier with "multi-region page / fold". `storage/references` is gitignored and absent on a clean checkout, so that qualifier could never carry evidence; the substantive claim (single flat pile is insufficient) is kept and is now asserted.

**Stories deleted**: none.

**Code changes** — tests only; **zero production-code changes** (`git status` on `tools/`, `packages/`, `apps/` is empty):

- `tests/reconciliation-3probe-gate.test.ts` (+311)
  - **AC-705**: added a `mixedKindOracle` fixture (text + two images at y=200/600 + painted surface + form control + empty run). Asserts the reproduced tree carries exactly `[box, image, image, text]`; the probe gates clean (the kind-keyed *occurrence* discriminator — a kind→single-box map yields a 400px phantom dy); drift on one image → exactly one residual labelled `(image)`; surplus oracle occurrences → exactly one unmatched labelled `(image)` and `(box)`; control + empty run produce no unmatched.
  - **AC-709**: added a multi-region fixture (hero/grid/footer at pitches 60/90/60, plus a non-colliding survivor run). Asserts `promoted !== ['0']`, three nested `0.N` paths, each a flow `stack` with its own gap `[60, 90, 60]`, `pinnedDescendants(recovered) === []` (survivor included), both envelope probes hold, and base fidelity is byte-identical pre/post recovery. Tightened the whole-node case from `toContain('0')` to `toEqual(['0'])`.
  - **AC-706 / AC-707**: added the multi-region recovered-overlay assertions, plus per-width failing-width reporting and cross-band collision spread on the pinned base.
- `tests/req91-l1-pixel-mover-axes.test.ts` (+6/−4) — added an `existsSync` guard to `test_UAT_FC_REQ-91_fold_gigabytealchemy_gradient_wordmark`, matching the REQ-90/REQ-92 convention. This was the review's Observation; it was the suite's one real failure.

**Verification performed**:
- Full suite: **659/659 pass, 98 files** (was 658/659 — the req91 guard closed the gap).
- Typecheck clean on both touched test files and on `tools/generate`.
- **Mutation-tested that the new UATs bite** (production code restored and verified byte-identical to HEAD afterwards):
  - collapse region discovery to one flat pile → AC-706, AC-707, AC-709 all fail;
  - leave survivors pinned → AC-709 fails;
  - one shared median gap for every region → AC-709 fails;
  - non-text pairing keyed by kind without an occurrence cursor → AC-705 fails;
  - controls not excluded from the measure → AC-705 fails.

One correction to note: while drafting the AC-705 edit I ran a throwaway Python check containing a stray `open(p, 'w')` that truncated `.xgd/tickets/hot/acceptance_criterion-330b48e4.md` to zero bytes. I restored it from git immediately and applied the edit through `xgd ticket update`; the file is intact (4820 bytes before edit) and `git status` on `.xgd/tickets/` is clean.

**Confidence**: high for findings 1 and 2 — each remediation item the review listed is now asserted, and mutation testing proves the assertions discriminate rather than passing vacuously. Moderate-to-high on finding 3 (AC-706/707): I closed it by exercising the multi-region qualifier *and* narrowing the unverifiable "real capture" wording; a reviewer who insists the AC must name a real retained capture would need the gitignored bundles, which no clean checkout has. The FC-orphan gate (`test_UAT_FC_*` files from the bundle's commits still on disk) is a separate downstream check and was not in this review's scope, so I left those files alone.
