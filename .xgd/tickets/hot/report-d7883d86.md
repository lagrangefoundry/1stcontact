---
uid: report-d7883d86
id: REPORT-905
type: report
title: 'Capability-Intent Alignment: 1c Size-Aware Diffing (level=uat)'
created_by: xgd
created_at: '2026-07-24T07:42:37.567474+00:00'
updated_at: '2026-07-24T07:42:37.567474+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-18a822ac
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Size-Aware Diffing
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

The capability tree is sourced from a single reconciled intent. Both stories
carry `intent_uid = bundle-ab9e0cb6`; no `updated_by` chain touches them.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (bundle-ab9e0cb6 = REQ-58+59+62+61) | free_and_reconciled | merged_at_commit 7a42e182 | REQ-61 established size-aware diffing: shared `--size` selector on values-diff + pixel diff, per-width reference screenshots, fail-loud on missing ladder data, and the standalone `responsive-diff` cross-size table + classifier | YES |

Capability body confirms provenance: "Reproduced from the bundle-ab9e0cb6
reconciliation (REQ-61)." At the uat level the ACs are the working reference;
intent was consulted only to confirm the ledger is single-source and reconciled
— no AC appeared suspicious.

## Alignment Ledger

At uat level each element is a test; alignment outcome is whether the test
substantively exercises its AC's claimed behaviour. All tests drive the real CLI
surface (`run(argv)` at the argv boundary, or the exported `cmd*` entry points),
mocking only genuine external boundaries — a fake `BrowserDriver` for capture and
`console` spies for output. No internal component is mocked.

STORY-77 (size-aware diffing) — tests/reconciliation-size-aware-diff.test.ts:

| AC | Test | Outcome |
|---|---|---|
| AC-639 values-diff --size compares at selected width | test_UAT_AC639 (L109) | aligned — asserts `expectedSource` is the ladder rung at the selected width; mobile reflow (75⇄256) flags, desktop (256⇄256) clean |
| AC-640 omitting --size preserves single-width path (both commands) | test_UAT_AC640 (L138) | aligned — exercises both values-diff (capture.json, no ladder read) and pixel diff (screenshot.full.png) default paths |
| AC-641 values-diff --size no ladder fails loud | test_UAT_AC641 (L179) | aligned — rejects on /multistate.json…re-capture/, writes no report |
| AC-642 values-diff --size uncaptured width names available widths | test_UAT_AC642 (L196) | aligned — rejects naming requested width + carried width |
| AC-643 pixel diff --size pairs same-width screenshot | test_UAT_AC643 (L212) | aligned — ref resolves to `screenshot-<tablet>.png`, not screenshot.full.png; grey-10 clean vs the desktop-fallback contaminant |
| AC-644 pixel diff --size no same-width shot fails loud | test_UAT_AC644 (L241) | aligned — rejects on /screenshot-<mobile>.png…re-capture/, no diff artifacts written |
| AC-645 invalid --size rejected naming vocabulary | test_UAT_AC645 (L263) | aligned — both commands reject `phone`, name `mobile|tablet|desktop`, write no report |
| AC-647 capture persists per-width screenshot; matrix byte-free | test_UAT_AC647 (L333) | aligned — asserts per-rung `screenshot-<w>.png` siblings exist; multistate.json contains no IMGBYTES marker; bytes live in the PNG siblings |

STORY-78 (responsive-diff) — tests/reconciliation-responsive-diff.test.ts:

| AC | Test | Outcome |
|---|---|---|
| AC-648 N-way table, default columns | test_UAT_AC648 (L95) | aligned — three size columns mobile→tablet→desktop with widths; Hero row carries per-column values [28,40,48] |
| AC-649 --sizes selects and orders columns | test_UAT_AC649 (L126) | aligned — `mobile,desktop` yields two ordered columns, tablet omitted; unknown token rejected |
| AC-650 partitions changed/steady; flags presence flips | test_UAT_AC650 (L158) | aligned — stepper=changed, steady=unchanged, promo=presence-flip, sub-pixel jitter rounded to steady |
| AC-651 aligns repeated text occurrence-by-occurrence | test_UAT_AC651 (L195) | aligned — two "Read more" rows; weights [700,700,700] and [400,400,400] prove occurrence-0↔0 pairing, not cross-paired |
| AC-652 --classify labels moves, structural first | test_UAT_AC652 (L227) | aligned — value-step/layout-swap/presence-flip labelled; structural groups precede value-step in human output; steady site → "holds steady" |
| AC-653 terminal-fails on stale reference | test_UAT_AC653 (L284) | aligned — rejects on /multistate.json…re-capture/ + names the dir; no table printed |
| AC-654 terminal-fails on uncaptured width, lists available | test_UAT_AC654 (L305) | aligned — rejects naming missing width + carried width + re-capture; no partial table |
| AC-655 --json machine-readable; --ref required | test_UAT_AC655 (L329) | aligned — JSON parses (sizes+rows, and classifications under --classify); missing --ref → non-zero exit, /--ref/, empty stdout |
| AC-721 --out persists raw N-way table, independent of --classify | test_UAT_AC721 (L365) | aligned — --out writes raw table AND still prints; --classify --out leaves the persisted file byte-identical, classifications undefined |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-77 (8 ACs) | — | Every active AC (AC-639,640,641,642,643,644,645,647) has exactly one substantive UAT exercising the real CLI. AC numbering skips 646 — there is no AC-646 ticket; not a gap. | none |
| 2 | info | coverage | STORY-78 (9 ACs) | — | Every active AC (AC-648..655, AC-721) has exactly one substantive UAT invoking `run(argv)` at the CLI boundary. | none |
| 3 | info | consistency | all 17 UATs | — | Each test's assertions match its AC's claimed behaviour; verified by reading each body. Mocking is confined to external boundaries (fake BrowserDriver, console spies) — no internal-component mocking, so evidence validity holds. | none |
| 4 | info | exclusivity | — | — | No two tests verify the same scenario in the same shape. AC-640 (default path) and AC-645 (invalid size) each cover both commands within one test — breadth, not duplication. | none |

## Notes for the Editor

Nothing to repair. The capability derives from a single `free_and_reconciled`
intent (bundle-ab9e0cb6 / REQ-61), both feature stories are completed with
`uat_coverage: pass`, and the UAT layer is a clean 1:1 map of substantive tests
to active ACs. The story-body scope items map fully onto the AC set:
plan item 1 → AC-639, item 2 → AC-643, item 3 (fail-loud, three cases) → AC-641/642/644,
item 4 → AC-647, plus AC-640 (default preservation) and AC-645 (vocabulary);
responsive-diff scope → AC-648..655/721.
