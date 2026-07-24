---
uid: report-cbfb9801
id: REPORT-904
type: report
title: 'Capability-Intent Alignment: 1c Size-Aware Diffing (level=ac)'
created_by: xgd
created_at: '2026-07-24T07:39:52.010625+00:00'
updated_at: '2026-07-24T07:39:52.010625+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-18a822ac
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c Size-Aware Diffing
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Cumulative Intent Considered

Both stories carry `fields.intent_uid = bundle-ab9e0cb6`; the substantive
originating intent inside that bundle is REQ-61.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| REQ-61 (request-d6bc0d26) | free_and_reconciled | v0.0.135, bundled in bundle-ab9e0cb6 (merged_at_commit 7a42e182) | Standalone cross-size pipeline analysing one target across N discrete sizes ("looks the same at each of N sizes", no between-size transition inference); a `--size` selector on the existing `values-diff` and pixel `diff` commands; per-viewport reference screenshots at capture time; the standalone `responsive-diff` command | YES |
| bundle-ab9e0cb6 | reconciled (merged_at_commit 7a42e182) | — | Bundle carrier for REQ-61 (and the REQ-58 reproduction pass that forced the capability). No independent AC-level asks. | YES (carrier) |

No intent in the ledger retires or supersedes any behaviour in this
capability. At AC level the two story bodies are internally consistent and
clearly grounded in REQ-61, so intent history was consulted only to confirm
scope — not to resolve ambiguity.

## Alignment Ledger

STORY-77 (story-16f2793c, feature) — "Size-aware diffing" — in-scope surface
= {values-diff --size, pixel diff --size, no-flag single-width preservation,
three fail-loud cases, per-width reference screenshots}.

| AC | Story behavioural item | Outcome |
|---|---|---|
| AC-639 | values-diff --size positive path (reference from ladder, actual rendered at width) | aligned |
| AC-640 | Omitting --size preserves single-width desktop path on BOTH commands | aligned |
| AC-643 | pixel diff --size positive path (repro shot at viewport vs same-width reference screenshot) | aligned |
| AC-641 | fail-loud: values-diff --size, bundle with no persisted ladder | aligned (story in-scope item 3, case a) |
| AC-642 | fail-loud: values-diff --size at width ladder never captured, names available widths | aligned (case b) |
| AC-644 | fail-loud: pixel diff --size, no same-width reference screenshot | aligned (case c) |
| AC-647 | capture persists one per-width reference screenshot per ladder width; value matrix carries no image bytes | aligned (story in-scope item 4) |
| AC-645 | unrecognised --size value rejected, names accepted vocabulary | aligned (boundary condition of the `mobile\|tablet\|desktop` selector) |

STORY-78 (story-2c7069fe, feature) — "Responsive-diff" — in-scope surface =
{N-way table + default columns, --sizes select/order, changed-vs-steady +
presence flips, occurrence alignment, --classify, --json/--out output,
terminal-fail on stale ref / un-captured width}.

| AC | Story behavioural item | Outcome |
|---|---|---|
| AC-648 | N-way per-node table, default mobile/tablet/desktop columns, node identified by text or role | aligned |
| AC-649 | --sizes selects and orders columns; invalid token errors | aligned |
| AC-650 | partition changed vs steady, flag presence flips, sub-pixel geometry not a change | aligned |
| AC-651 | occurrence-by-occurrence alignment of repeated identical text in document order | aligned |
| AC-652 | --classify labels (presence-flip/layout-swap/value-step), structural-first grouping, holds-steady confirmation | aligned |
| AC-653 | terminal-fail on stale reference (no persisted ladder) | aligned |
| AC-654 | terminal-fail on un-captured requested width, lists available widths | aligned |
| AC-655 | --json machine output; --ref required | aligned |
| AC-721 | --out persists raw table to named file (independent of --classify/--json) | aligned |

Both stories: every in-scope behavioural item maps to at least one AC; no AC
describes behaviour absent from its story body; no two ACs within a story
describe the same criterion.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | STORY-78 / AC-648 | — | Story body's alignment "by join key (normalized text, or accessibility role for text-free nodes) in document order" — the role-based join for text-free nodes is covered implicitly by AC-648 (text-free nodes appear as role-identified rows with a per-size cell) rather than by a dedicated alignment AC. AC-651 covers the repeated-identical-text occurrence facet explicitly. Full surface is covered; no dedicated AC is required. | none |
| 2 | info | consistency | STORY-78 / AC-655 | — | AC-655 bundles two distinct criteria (`--json` output shape and the required `--ref` guard). Both follow directly from the story body and neither is duplicated by another AC, so this is a granularity observation, not drift. Could be split opportunistically if the editor ever revisits. | none |

## Notes for the Editor

No action required at AC level. The AC trees for both stories are complete,
consistent with their story bodies, and mutually exclusive. The three
fail-loud cases in STORY-77's in-scope item 3 are cleanly decomposed into
AC-641 (no ladder), AC-642 (uncaptured width), and AC-644 (no same-width
screenshot); STORY-78's two terminal-fail cases are cleanly split into AC-653
(stale reference) and AC-654 (un-captured width). Both story bodies are
grounded in the implemented CLI (STORY-78 explicitly documents the
`--ref`-flag divergence from the reconciliation plan's positional slug), so
no code-issue findings arise.
