---
uid: report-77eb6a65
id: REPORT-836
type: report
title: 'Capability-Intent Alignment: 1c Size-Aware Diffing (level=ac)'
created_by: xgd
created_at: '2026-07-23T10:26:29.640309+00:00'
updated_at: '2026-07-23T10:26:29.640309+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-18a822ac
  level: ac
  violations: 1
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Size-Aware Diffing
# Level: ac

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| bundle-ab9e0cb6 (BUNDLE-6, reproduces REQ-61; also carries REQ-58/59/62) | free_and_reconciled | merged_at_commit 7a42e182 | Established the 1c size-aware diffing capability: shared `--size` selector on `values-diff` and pixel `diff`, per-viewport reference screenshots at capture, and the downstream `responsive-diff` cross-size analysis command | YES |

Both stories (STORY-77, STORY-78) carry `intent_uid=bundle-ab9e0cb6`, as does the capability. No other intent has touched this capability's tree. The single reconciled intent is the sole reference; ledger is trivially chronological.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-77 (Size-aware diffing: `--size` on both diff commands) | bundle-ab9e0cb6 | aligned — 8 ACs cover the full behavioral surface |
| AC-639 (values-diff --size compares at selected width) | bundle-ab9e0cb6 | aligned — In-scope item 1 |
| AC-640 (omitting --size preserves single-width path) | bundle-ab9e0cb6 | aligned — "Without --size … unchanged" (both commands) |
| AC-641 (values-diff --size, no ladder → fail loud) | bundle-ab9e0cb6 | aligned — In-scope item 3, case 1 |
| AC-642 (values-diff --size, width not in ladder → names widths) | bundle-ab9e0cb6 | aligned — In-scope item 3, case 2 |
| AC-643 (pixel diff --size pairs same-width screenshot) | bundle-ab9e0cb6 | aligned — In-scope item 2 |
| AC-644 (pixel diff --size, no same-width shot → fail loud) | bundle-ab9e0cb6 | aligned — In-scope item 3, case 3 |
| AC-645 (invalid --size rejected, names vocabulary) | bundle-ab9e0cb6 | aligned — natural closure of the `mobile|tablet|desktop` vocabulary |
| AC-647 (capture persists per-width reference screenshots, no image bytes in matrix) | bundle-ab9e0cb6 | aligned — In-scope item 4 |
| STORY-78 (responsive-diff: cross-size N-way node analysis) | bundle-ab9e0cb6 | gap: In-scope option `--out <file>` has no AC (see finding 1) |
| AC-648 (N-way table, default columns, node id by text/role) | bundle-ab9e0cb6 | aligned — table build + role-based identification |
| AC-649 (--sizes selects/orders columns) | bundle-ab9e0cb6 | aligned |
| AC-650 (changed vs steady partition, presence flips, sub-pixel ignored) | bundle-ab9e0cb6 | aligned |
| AC-651 (repeated identical text aligned occurrence-by-occurrence) | bundle-ab9e0cb6 | aligned |
| AC-652 (--classify labels; structural moves grouped first) | bundle-ab9e0cb6 | aligned |
| AC-653 (fail loud on stale reference / no ladder) | bundle-ab9e0cb6 | aligned |
| AC-654 (fail loud on un-captured width, lists available) | bundle-ab9e0cb6 | aligned |
| AC-655 (--json machine output; --ref required) | bundle-ab9e0cb6 | aligned — but covers only --json + --ref, not --out |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | STORY-78 (story-2c7069fe) | ac-add | STORY-78 body In-scope list explicitly names "optional `--out <file>` to persist the table" as a first-class output option alongside `--json`. `--json` is covered by AC-655; no AC (AC-648–655) covers `--out`. This is an uncovered user-visible behavioral surface (persisting the table to a named file). Intent bundle-ab9e0cb6 (free_and_reconciled) is the source of this scope. | Author an AC under STORY-78 asserting that `--out <file>` writes the N-way table (and, with `--classify`, the classification) to the named file; verify the file is created with the expected content and that stdout behaves as specified. |

## Notes for the Editor

- STORY-77's AC tree is complete and symmetric with its In-scope list (including going slightly beyond the body to add AC-645 for invalid `--size` vocabulary — a good closure of the enum, not a defect).
- The STORY-78 gap is an asymmetry oversight: the two output-mode options in the same In-scope sentence ("`--json` for machine consumption; optional `--out <file>` to persist the table") were split — `--json` earned AC-655, `--out` earned nothing. The fix is a single ac-add; no story-body edit is needed (the body already correctly describes `--out`, and intent supports it).
- No exclusivity issues in either story: the paired fail-loud ACs (AC-641/642/644; AC-653/654) each describe distinct failure conditions, and the default-partition (AC-650) vs `--classify`-labelling (AC-652) ACs describe different command modes, not the same criterion.
