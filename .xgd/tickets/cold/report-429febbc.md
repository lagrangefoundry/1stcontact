---
uid: report-429febbc
id: REPORT-1309
type: report
title: 'UAT Coverage: size_aware_diffing'
created_by: xgd
created_at: '2026-08-05T19:58:11.595219+00:00'
updated_at: '2026-08-05T19:58:11.595219+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: uat_coverage_check
  subject_uid: capability-18a822ac
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# UAT Coverage Assessment: size_aware_diffing

**Result**: PASS
**AC verdicts**: 17 pass, 0 fail, 0 deprecated, 0 needs_review
**Story verdicts**: 2 pass, 0 fail, 0 stale, 0 needs_review
**Capability verdict**: pass

## Scope note — this capability was absorbed mid-run, and the two stores disagree

CAP-65 was absorbed into **CAP-63 `1c Capture & Diff Fidelity`** (`capability-aa030c83`)
by the 2026-08-05 structural rebalance (REPORT-1266 / `report-bdaf6840`). The two
stores currently disagree about where its stories live:

| Store | STORY-77 / STORY-78 `capability_uid` |
|---|---|
| this regression worktree | `capability-aa030c83` (rebalance applied) |
| canonical `main` | `capability-18a822ac` (rebalance not propagated) |

Rather than return a vacuous PASS on an apparently-empty capability, I assessed the
two size-aware-diffing stories on their merits. They are this capability's subject
matter under either store, so the verdicts below hold whichever way the divergence
is later resolved. (If CAP-63's scope also runs this round the two stories are
assessed twice; the field writes are idempotent, so that is harmless — whereas
skipping them would have left 17 ACs unassessed.)

Note also that `xgd ticket list` still returns both stories under CAP-65 in *both*
stores while `xgd ticket get <uid>` returns the rebalanced value in this worktree —
the by_field index is stale, exactly the defect REPORT-1266 flagged as blocking the
capability deprecation.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (`bundle-ab9e0cb6`) = REQ-58 + REQ-59 + REQ-62 + **REQ-61** | free_and_reconciled | merged @ 7a42e182 | Established the viewport ladder (REQ-58) and, under REQ-61, the `--size` selector on both diff commands, per-width reference screenshots, and the standalone `responsive-diff` N-way table + classifier | YES |
| BUNDLE-7 (`bundle-31e474b9`) = REQ-63, REQ-79, REQ-82, REQ-83, REQ-84 +2 | free_and_reconciled | 2026-07-22 | CSS-axis capture coverage audit; L1 framework pivot. Adds capture axes; **retires nothing** in size-aware diffing | YES (additive) |
| BUNDLE-8 (`bundle-cceaba25`) = BUG-7, REQ-89..REQ-92 +5 | free_and_reconciled | 2026-07-29 | L1 layout/probe fixes, CLI hygiene. **Retires nothing** here | YES (additive) |

**Cumulative result**: every behavior both stories describe remains active. No later
intent retired the `--size` selector, the per-width reference screenshots, or
`responsive-diff`. Zero deprecation candidates.

## Alignment Ledger

| Story | Intents aligned to | Outcome | Notes |
|---|---|---|---|
| STORY-77 (`story-16f2793c`) | BUNDLE-6 (REQ-61, REQ-58) | aligned | All 4 in-scope items intact; out-of-scope list still accurate |
| STORY-78 (`story-2c7069fe`) | BUNDLE-6 (REQ-61) | aligned | Behavior aligned; one stale *structural* cross-reference (finding 1) |

## Evidence

Both UAT files were executed this run, not merely read:

```
npx vitest run tests/reconciliation-size-aware-diff.test.ts \
                tests/reconciliation-responsive-diff.test.ts
  Test Files  2 passed (2)
       Tests  17 passed (17)
```

Evidence quality — all 17 clear the substantive-cover bar:
- **Real entry points.** `cmdValuesDiff`, `cmdDiff`, `cmdCapturePage`, and the CLI
  boundary `run(argv)` are invoked directly; `responsive-diff` is driven entirely
  through `run(argv)` exactly as a user would call it.
- **Mocking is external-boundary only.** The single fake is `MarkerScreenshotDriver`
  (a `BrowserDriver` — the browser is the external system). No internal component is
  mocked. Reference ladders are authored in-memory through the real `writeMultiState`
  writer, so the persisted format is exercised rather than stubbed.
- **Assertions discriminate.** AC-643 asserts `meanDiff ≈ 0` against the tablet
  reference and notes a desktop fallback would yield ~190; AC-639 asserts the mobile
  run flags the 75⇄256 reflow while the desktop run reports the same node clean — a
  wrong width selection fails both. Fail-loud ACs (641/642/644/653/654) additionally
  assert *no artifact was written*, so a silent-fallback implementation cannot pass.

Caveat for the reader: `.xgd/uat_index.json` reports `status: "missing"` for all 17
tests. That is a run-record gap, not an authoring gap — the named tests exist and
pass, as above. Same index fragility REPORT-1266 documented.

## AC Verdicts

| AC | Behavior | Test | Verdict |
|---|---|---|---|
| AC-639 | `values-diff --size` compares at selected width | `test_UAT_AC639_values_diff_size_compares_at_selected_viewport_width` | pass |
| AC-640 | Omitting `--size` preserves single-width path (both commands) | `test_UAT_AC640_omitting_size_preserves_single_width_path_on_both_commands` | pass |
| AC-641 | `values-diff --size` fails loud with no ladder | `test_UAT_AC641_...no_ladder` | pass |
| AC-642 | Fails loud at uncaptured width, names available widths | `test_UAT_AC642_...names_available_widths` | pass |
| AC-643 | Pixel `diff --size` pairs same-width reference | `test_UAT_AC643_...same_width_reference` | pass |
| AC-644 | Pixel diff fails loud without same-width shot | `test_UAT_AC644_...without_same_width_reference` | pass |
| AC-645 | Invalid `--size` rejected naming vocabulary | `test_UAT_AC645_...accepted_vocabulary` | pass |
| AC-647 | Capture persists per-width shots; matrix byte-free | `test_UAT_AC647_...matrix_has_no_image_bytes` | pass |
| AC-648 | N-way table, default size columns | `test_UAT_AC648_...default_size_columns` | pass |
| AC-649 | `--sizes` selects and orders columns | `test_UAT_AC649_...rejects_unknown` | pass |
| AC-650 | Changed vs steady partition; presence flips | `test_UAT_AC650_...presence_flips` | pass |
| AC-651 | Repeated text aligned occurrence-by-occurrence | `test_UAT_AC651_...document_order` | pass |
| AC-652 | `--classify` labels; structural grouped first | `test_UAT_AC652_...structural_first` | pass |
| AC-653 | Terminal-fail on stale reference | `test_UAT_AC653_...recapture_guidance` | pass |
| AC-654 | Terminal-fail on uncaptured width | `test_UAT_AC654_...listing_available_widths` | pass |
| AC-655 | `--json` parseable; `--ref` required | `test_UAT_AC655_json_is_parseable_and_ref_is_required` | pass |
| AC-721 | `--out` persists raw table, independent of `--classify` | `test_UAT_AC721_out_persists_raw_table_independent_of_classify` | pass |

## Findings — Categorized by Editor Action

| # | Severity | Level | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | story | STORY-78 | story-body-edit | Technical Context says "Belongs to CAP-65 (1c Size-Aware Diffing), whose body already reserves this downstream `responsive-diff` command". In this worktree the story's `capability_uid` is now `capability-aa030c83` (CAP-63), and CAP-65 carries an ABSORBED banner — the sentence points at a capability that no longer holds the story | Re-point to CAP-63 `1c Capture & Diff Fidelity`, or drop the capability name and keep the REQ-61 provenance. **Defer until the branch/main divergence is resolved** — editing now against the wrong store would have to be redone |
| 2 | warning | story | STORY-77 | story-body-edit | Technical Context says "Generalizes CAP-63 (1c Values-Diff Fidelity)". Post-rebalance the story lives *inside* CAP-63, so "generalizes" now reads as self-reference | Reword to name the single-width `values-diff` behavior rather than the capability. Same deferral as finding 1 |
| 3 | warning | capability | CAP-65 | (blocked — system defect) | Capability is absorbed but still `status: active`; deprecation blocked by the stale by_field index. Already reported in REPORT-1266 as an xgd-repo bug | No project-level edit available. Track under REPORT-1266; re-run deprecation once `xgd ticket rebuild-index` can run for this store |

Zero violations, zero needs_review → **PASS**. All three findings are warnings and
do not affect the verdict.

## Notes for the Editor

**Do not treat findings 1 and 2 as coverage work.** No AC or UAT changes are implied
by them — the behavior is fully covered and passing. They are cosmetic
cross-references that the rebalance left behind precisely because it deliberately
modified only `capability_uid` and no story content.

**Sequence matters.** Both story-body findings should wait on the CAP-65/CAP-63
divergence being reconciled between this worktree and `main`. If the rebalance is
propagated to `main`, edit both bodies to name CAP-63. If the rebalance is rolled
back, finding 1 evaporates and finding 2 is already correct as written. Editing
before that decision guarantees rework in one of the two branches.

**The real blocker is upstream.** Everything unresolved in this capability — the
un-deprecated status, the stale `list` results, the all-zero `uat_index` run
records — traces to the two index defects REPORT-1266 raised against the xgd system
repo (`/Users/martin/lagrangefoundry/xgd`), not to this project's matrix. No amount
of ticket editing here will clear them.
