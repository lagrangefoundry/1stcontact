---
uid: report-9ad1c893
id: REPORT-2450
type: report
title: 'Fix L1 Reproduction Pipeline: Fold & Acceptance Gate (uat) — attempt 7 (call
  3, complete)'
created_by: xgd
created_at: '2026-08-20T14:00:34.218726+00:00'
updated_at: '2026-08-20T14:00:34.218726+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-2049c9ec
  level: uat
  fixes_applied: 8
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-2485c83c
---

# Fix Summary — L1 Reproduction Pipeline: Fold & Acceptance Gate (uat)

**Attempt**: 7 (call 3, complete)
**Fixes applied this call**: 8
**Violations remaining**: 0
**Needs more work**: false

All 14 violations and the 1 warning from report-420214de are now addressed.

| Call | Findings closed | Report |
|---|---|---|
| 1 | 9–15 (seven `uat-edit`, incl. the warning) | report-b41fe36e |
| 2 | 1, 2, 3, 8 (`uat-add`: AC-1345/1346/1347/1352) | report-906d32ce |
| 3 | 4, 5, 6, 7 (`uat-add`: AC-1348/1349/1350/1351) | this report |

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | uat-add | AC-1350 (finding 6) | Authored `test_UAT_AC1350_column_is_fitted_from_content_and_rejected_unless_every_sample_reproduces` in `tests/reconciliation-l1-fold-measured-axes.test.ts`. Covers the clean fit (container/inset/cap) *and* that it reproduces every sampled origin and extent within a pixel; **modal origin** (a header set 8px wider than the content column does not capture the fit); **full-bleed exclusion**; content cap present vs absent; and all four rejection paths — no centred column, one perturbed sample rejecting the *whole* column, a two-width capture, and a column nothing anchors to. |
| 2 | uat-add | AC-1351 (finding 7) | Authored `test_UAT_AC1351_column_anchors_are_fitted_per_axis_with_cap_track_and_refusals` in the same file. Both-axes anchor plus the closed-form CSS (with the old between-samples lerp asserted absent); **per-axis independence** (three runs sharing a left edge all anchor `x`, only the fitting one anchors `width`); the **capped extent** and its over-determination refusal (three samples below the cap admit it, two refuse it); the **plausible-share guard** (a width fitting exactly at fraction 2.5 is refused); the **keyframed residual inset** with segments inherited from the node's own geometry (asserted to contain a `snap`); and the **full-bleed refusal**. |
| 3 | uat-add | AC-1348 (finding 4) | Authored `test_UAT_AC1348_seam_config_derives_the_six_facts_and_records_every_gap` in the new `tests/reconciliation-l1-seam-config-and-repro.test.ts`. Walks the AC's six-item enumeration (field list with unique slugified keys, labels, label placement from the a11y name source, types, endpoint, submit copy) with an empty gap list; then each honest default *with* its gap — missing input type → typed from height, unnamed control → positional label, no action → no endpoint, unsafe action → **dropped**; then channel separation (the fold's typed element-residual list is byte-identical across variants and carries no `field` residual for a mounted form). |
| 4 | uat-add | AC-1349 (finding 5) | Authored `test_UAT_AC1349_repro_materializes_seams_and_localizes_every_handle` in the same new file, driving the real `cmdRepro` CLI against bundles written to a temp dir: page body is the folded document with one module per seam bound by slot name and carrying its derived config; assets mirrored into the site; every handle (background-image, image `src`, font resource) localized with no origin surviving; the bundle's own `l1.json` still carrying the captured handles (materialization ≠ fold); an unmirrored handle failing the run with a re-capture instruction; an unreferenced mirrored image reported as a fold gap while the run succeeds (a stylesheet is not); a part-stale bundle refused; and idempotence with a stray file removed. |
| 5–8 | uat-add (field) | AC-1348, AC-1349, AC-1350, AC-1351 | `uat_coverage` moved `fail` → `pass` on each, paired with its test in the same call. All eight ACs in the group verified `active` / `pass`. |

## Test Execution Evidence

The nine AC-named reconciliation suites (the seven the assessor ran, plus the two
files added across calls 2 and 3):

```
npm test -- tests/reconciliation-l1-fold.test.ts tests/reconciliation-l1-fold-full-language.test.ts \
  tests/reconciliation-l1-fold-framing-and-adjustment.test.ts tests/reconciliation-l1-fold-seams-and-refold.test.ts \
  tests/reconciliation-l1-fold-measured-axes.test.ts tests/reconciliation-l1-seam-config-and-repro.test.ts \
  tests/reconciliation-3probe-gate.test.ts tests/reconciliation-3probe-gate-evaluator.test.ts \
  tests/reconciliation-cross-gate-reconciliation.test.ts
→ Test Files 9 passed (9) · Tests 42 passed (42)
```

That is the assessor's original 34 plus the 8 AC-named UATs added across calls 2–3.
Both new files typecheck clean under the project's `tsconfig.base.json` settings.

### Two pre-existing environmental failures — NOT introduced by this work

A wider sweep including the FC source suites reported 2 failures:

```
npm test -- <9 reconciliation suites> tests/req88-viewport-relative-and-nowrap.test.ts \
  tests/req88-form-labelling-and-submit.test.ts tests/bug17-fold-padding.test.ts \
  tests/bug23-repro-local-assets.test.ts tests/bug24-scrim-alpha.test.ts \
  tests/bug14-fold-surface-hierarchy.test.ts tests/bug18-responsive-text-axes.test.ts
→ Test Files 1 failed | 15 passed (16) · Tests 2 failed | 106 passed | 3 skipped (111)
```

Both failures are in `tests/req88-form-labelling-and-submit.test.ts`, a file this
work never touched:

- `test_UAT_FC_REQ-88_placeholder_labelling_renders_inside_the_box_and_stays_accessible`
- `test_UAT_FC_REQ-96_a_bound_submit_control_is_the_only_button`

Both fail with `Error: listen EPERM: operation not permitted 0.0.0.0` from
`tools/generate/src/cli/serve.ts:53` via `serveOneModulePage`. This session's
sandbox denies binding to `0.0.0.0`; suites that bind `127.0.0.1` explicitly
(`bug23`, `bug24`, `req88-surface-attribution`) all pass in the same run. It is an
environment limitation, not a code or test defect, and it is not something this
role can resolve from inside the sandbox — flagging it so it is on record rather
than reported as green.

The 3 skips are likewise pre-existing: two browser-gated (`chromiumAvailable`) and
one gated on the gitignored `storage/references/` bundle.

## Code Edits (if any)

None across all three calls. No `code-issue` finding was filed by the assessor and
none was warranted — every behaviour asserted was already implemented.

## needs_review Items Forwarded

None. The report carried `needs_review_count: 0`.

## Non-Vacuity Notes

Several clauses in this batch pass trivially if written carelessly, so each was
given a discriminating contrast:

- **AC-1350's "a column nothing refers to is not emitted"** — the same page whose
  single run keeps its identity across the ladder (so it spans enough frames to
  anchor) *does* carry the column. The fit was never the variable.
- **AC-1350's perturbation rejection** — contrasted against the unperturbed
  fixture asserted at the top of the same test.
- **AC-1351's width refusals** (steep coefficient, shallow cap, shrink-to-fit) —
  each also asserts the `x` anchor is still present, so "no width anchor" cannot
  pass by the node having no anchor at all.
- **AC-1348's uniqueness clause** — asserts the labels really are duplicated and
  the derived keys are `your-name` / `your-name-2`, not merely that a set is the
  right size.
- One assertion was **found vacuous and fixed** before finalizing: the channel
  separation check filtered element residuals on `kind === 'control'`, which is
  not a member of `FoldResidual['kind']` (`'image' | 'field' | 'box' | 'text'`),
  so it could never have failed. It now filters on `'field'` — the kind an
  un-foldable control would actually produce — and asserts it empty on both the
  clean and the gap-bearing folds.

## Handing Back

`needs_more_work: false`. All 14 violations and the 1 warning are addressed; the
assessor can verify. Nothing is left in a partial state: every new AC-named UAT
passes, and every AC in the group carries `status: active` / `uat_coverage: pass`.
