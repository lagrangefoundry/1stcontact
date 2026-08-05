---
uid: report-2131c6a0
id: REPORT-1306
type: report
title: 'Capability-Intent Alignment: size_aware_diffing (level=uat)'
created_by: xgd
created_at: '2026-08-05T19:51:10.780703+00:00'
updated_at: '2026-08-05T19:51:10.780703+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-18a822ac
  level: uat
  violations: 0
  warnings: 2
  needs_review_count: 0
---

# Capability-Intent Alignment: size_aware_diffing
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 2
**Needs review**: 0

## Structural note (read first)

`capability-18a822ac` (CAP-65) was **absorbed on 2026-08-05** by the structural
rebalance into `capability-aa030c83` (CAP-63, "1c Capture & Diff Fidelity").
Ground truth confirms the reassignment landed on both former member stories:

| Story | `fields.capability_uid` (from `ticket get <uid>`) |
|---|---|
| STORY-77 (`story-16f2793c`) | `capability-aa030c83` |
| STORY-78 (`story-2c7069fe`) | `capability-aa030c83` |

**CAP-65 therefore owns zero stories, zero ACs and zero UATs — the uat-level
matrix for this capability is empty and vacuously aligned.**

The stale index (`xgd ticket list --filter fields.capability_uid=capability-18a822ac`
still returns both stories) is what routed this check here. Following the
precedent set by the ac-level run (`report-c98ee17c`), this report assesses the
two stories' UAT trees **on their merits** rather than returning a vacuous pass —
the findings hold regardless of which capability header the stories hang under.

Verified this creates **no coverage hole**: the index lists STORY-77/78 under
`capability-aa030c83` *as well* (a duplicated edge, not a moved one), so CAP-63's
own uat-level check will see the same trees. Human-ID resolution remains broken on
this worktree (`xgd ticket get STORY-77` → `TICKET_ID_NOT_FOUND`); UID lookup only.

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (`bundle-ab9e0cb6`) — REQ-58 + REQ-59 + REQ-62 + REQ-61 | free_and_reconciled (merged at `7a42e182`) | 2026-07 | REQ-61: `--size` selector on both diff commands; standalone `responsive-diff` N-way cross-size table + change classifier. REQ-58 supplied the multi-viewport ladder this reads. | YES |

Both stories carry `intent_uid: bundle-ab9e0cb6`; no `updated_by` chains present.
Per the level cascade, AC bodies are the working reference at uat level; intent was
consulted only for the AC-639 sub-clause examined below.

## Alignment Ledger

All 17 active ACs have **exactly one** AC-named UAT — a clean 1:1 map, no orphans,
no uncovered ACs. Every test drives a real entry point (`run(argv)` CLI parsing,
`cmdValuesDiff`, `cmdDiff`, `cmdCapturePage`) against authored fixtures; none is a
structural/AST-only check. Mocking is confined to the browser boundary (a fake
`BrowserDriver`) — no internal component is mocked.

**Executed this run**: 4 files, **24/24 passed in 1.09s** (17 AC UATs + 7 REQ-61
free-coded UATs). Evidence is green, not merely present.

| Element | Test (all in `tests/`) | Outcome |
|---|---|---|
| AC-639 values-diff `--size` compares at selected width | `reconciliation-size-aware-diff.test.ts:109` | aligned — **partial**, see finding 1 |
| AC-640 omitting `--size` preserves single-width path | `reconciliation-size-aware-diff.test.ts:138` | aligned — covers both commands |
| AC-641 no persisted ladder → fail loud | `reconciliation-size-aware-diff.test.ts:179` | aligned (+ asserts no report written) |
| AC-642 width absent from ladder → names available widths | `reconciliation-size-aware-diff.test.ts:196` | aligned |
| AC-643 pixel diff pairs same-width reference | `reconciliation-size-aware-diff.test.ts:212` | aligned — grey-10/grey-200 fixture discriminates a desktop fallback |
| AC-644 pixel diff, no same-width shot → fail loud | `reconciliation-size-aware-diff.test.ts:241` | aligned (+ asserts no artifacts) |
| AC-645 invalid `--size` rejected, names vocabulary | `reconciliation-size-aware-diff.test.ts:263` | aligned — loops both commands through real `run(argv)` |
| AC-647 capture persists per-width shots, matrix byte-free | `reconciliation-size-aware-diff.test.ts:333` | aligned — `IMGBYTES` marker proves bytes land in PNG siblings, not JSON |
| AC-648 N-way table, default columns | `reconciliation-responsive-diff.test.ts:95` | aligned |
| AC-649 `--sizes` selects and orders columns | `reconciliation-responsive-diff.test.ts:126` | aligned (+ rejects unknown token) |
| AC-650 changed/steady partition + presence flips | `reconciliation-responsive-diff.test.ts:158` | aligned — 4-way fixture incl. sub-pixel jitter case |
| AC-651 repeated text aligned occurrence-by-occurrence | `reconciliation-responsive-diff.test.ts:195` | aligned — weight fingerprint proves no cross-pairing |
| AC-652 `--classify` labels + structural-first grouping | `reconciliation-responsive-diff.test.ts:227` | aligned — all 3 kinds + ordering + steady-site case |
| AC-653 terminal-fail on stale reference | `reconciliation-responsive-diff.test.ts:284` | aligned (+ asserts no table printed) |
| AC-654 terminal-fail on un-captured width | `reconciliation-responsive-diff.test.ts:305` | aligned |
| AC-655 `--json` parseable; `--ref` required | `reconciliation-responsive-diff.test.ts:329` | aligned |
| AC-721 `--out` persists raw table | `reconciliation-responsive-diff.test.ts:365` | aligned — proves `--out` adds rather than redirects |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | AC-639 (`acceptance_criterion-c6534e1a`) | uat-edit | AC-639's Criterion has two halves: the reference is read from the ladder at the selected width, **and** "the reproduction is rendered at that same viewport". `test_UAT_AC639` proves only the first half — it supplies the actual side as a static pre-rendered manifest (`actualManifestPath`), identical for the mobile and desktop runs. The render branch at `tools/generate/src/cli/fidelity.ts:159-168`, where the selected `viewport` is threaded into `extractDraftManifest` (line 167), is never entered. Verified suite-wide: all **13** `cmdValuesDiff` call sites across `tests/` pass `actualManifestPath`; **zero** pass `slug`. Deleting the `viewport` argument at line 167 would reintroduce exactly the defect the story exists to fix (reference read at mobile while the reproduction renders at desktop) and **no test would fail**. Note the AC's own Verification section is satisfied in full — it prescribes only the reference-side assertions — so this is an under-specified verification clause, not a contradicted one. | Extend `test_UAT_AC639` with a case that drives the `slug` branch through an injected `driverFactory` (the seam already exists and is used by `test_UAT_AC647`), asserting the reproduction was rendered at the selected viewport's width. Optionally tighten AC-639's Verification section to prescribe it. |
| 2 | warning | exclusivity | AC-640/641/642/643/644 UATs vs the REQ-61 free-coded UATs | uat-edit | The reconciliation UATs and the earlier free-coded UATs verify the same scenarios in the **same shape** (offline vitest, same fixture idiom, same entry point). `test_UAT_AC643` and `test_UAT_FC_REQ-61_pixel_size_selects_matching_width_screenshot` (`req61-size-pixel-diff.test.ts:35`) are **verbatim equivalent** — same grey-10 tablet / grey-200 desktop bundle, same two assertions. AC-641/642/644 each strictly subsume their FC counterparts (`req61-size-diff.test.ts:87,98`; `req61-size-pixel-diff.test.ts:56`), adding only a "no output written" assertion; AC-640's pixel half subsumes `req61-size-pixel-diff.test.ts:72`. This is same-shape redundancy, not the acceptable unit/integration/browser split. | Retire the five superseded FC duplicates in favour of the AC-named reconciliation UATs (the durable matrix evidence). Two exceptions to keep: `test_UAT_FC_REQ-61_size_selects_matching_ladder_width` uniquely covers the **tablet** rung (AC-639 covers only mobile+desktop) — fold that assertion into `test_UAT_AC639`; and `test_UAT_FC_REQ-61_size_flag_parses_as_value` is not a duplicate (see finding 5). |
| 3 | info | — | capability-18a822ac | — | Capability is `status: active` with `merged_into: capability-aa030c83` and zero owned stories; the stale index entry is what routed this uat-level check here. Already documented in the capability body and the rebalance report as a blocked deprecation. | none — XGD index defect, not matrix drift |
| 4 | info | coverage | all 17 ACs | — | Every active AC has exactly one substantive UAT; all 24 tests in the four relevant files pass in 1.09s. No AC is uncovered and no UAT is a structural-only check. | none |
| 5 | info | exclusivity | `test_UAT_FC_REQ-61_size_flag_parses_as_value` | — | Assessed as a possible duplicate of AC-645 and cleared: it tests `parseArgs` (that `--size` is a valued flag and does not swallow the slug positional), which is the CLI-parsing scope bullet of CAP-63, whereas AC-645 tests closed-vocabulary rejection through `run()`. Distinct concerns. | none |

## Notes for the Editor

- **Neither warning affects uat-level pass/fail.** Coverage is complete (17/17 ACs
  have substantive, passing UATs) and exclusivity duplication is redundancy, not a
  correctness gap.
- **Finding 1 is the one worth acting on.** It is the only place in this tree where
  a real regression could land silently. It is cheap to close: `test_UAT_AC647`
  already demonstrates the `driverFactory` injection pattern needed, so the fix is
  a fixture, not new infrastructure. Deliberately classified `uat-edit`, not
  `code-issue` — `fidelity.ts:167` currently threads the viewport **correctly**;
  the defect is in the evidence, not the production code.
- **Findings 1 and 2 interact.** The tablet-rung assertion salvaged from the FC
  test in finding 2 and the render-branch case in finding 1 belong in the same
  extended `test_UAT_AC639`; do them as one edit.
- The two prose warnings raised by the ac-level run (`report-c98ee17c`, stale
  `CAP-NN (old name)` parentheticals in both stories' Technical Context) are
  unchanged and still outstanding — no UAT inherits them.
- If the index defect is repaired and CAP-65 is finally set to `deprecated`, this
  check should stop being scheduled here; the assessment above transfers verbatim
  to `capability-aa030c83`.
