---
uid: report-9d1764f7
id: REPORT-832
type: report
title: 'Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene (level=ac)'
created_by: xgd
created_at: '2026-07-23T10:11:05.951135+00:00'
updated_at: '2026-07-23T10:11:05.951135+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ac7ca849
  level: ac
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Level context

This is the `ac`-level check. Story level ran first (REPORT-831 / report-faa78d91,
PASS with 1 warning). Per the level cascade, the STORY-79 body is the working
reference here; intent history is consulted only where the story body is internally
ambiguous (it was not). The story-level warning concerns the CAP-66 *umbrella body*,
which is not an ac-level element — see "Notes for the Editor".

## Cumulative Intent Considered

Chronological ledger of intents that touched CAP-66 / STORY-79:

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (bundle-ab9e0cb6) | free_and_reconciled | 2026-07-17 | Guarantee 1 (boolean `--multi-viewport` parsing, commit 4f681c73) + Guarantee 2 (`--json` stdout hygiene, commit a4323720) | YES |
| BUNDLE-7 (bundle-31e474b9) | free_and_reconciled | 2026-07-22 | Guarantee 3 (store-selecting flags propagate into sub-commands; `aligned-crops --sandbox`, commit 09fa7cf5) | YES |

Both intents are `free_and_reconciled` → both fully counted. Cumulative intent =
three CLI-correctness guarantees (boolean flag parsing; `--json` output hygiene;
store-flag propagation), all live, none retired.

## Alignment Ledger

At ac level the ledger records, per AC, which story guarantee (and thus intent) it
is aligned to and the outcome.

| Element | Aligned to (guarantee / intent) | Outcome |
|---|---|---|
| AC-656 (acceptance_criterion-3e4b0eab) | G1 boolean flag parsing / BUNDLE-6 | aligned — covers both flag orderings, value-option retention, and the no-missing-slug error; 1:1 with story-body clause 1 |
| AC-657 (acceptance_criterion-9c235ff1) | G2 output hygiene / BUNDLE-6 | aligned — stdout is exactly one parseable JSON document (positive shape assertion); maps to story clause 2 "prints exactly one well-formed JSON document" |
| AC-658 (acceptance_criterion-7f078026) | G2 output hygiene / BUNDLE-6 | aligned — diagnostics routed to stderr in BOTH human and `--json` modes; maps to story clause 2 "routed to stderr for both human and JSON modes" |
| AC-659 (acceptance_criterion-76a08c5b) | G2 output hygiene / BUNDLE-6 | aligned — stdout restored after render phase, including when the computation throws; maps to story clause 2 "stdout is restored ... even when the command's computation fails" |
| AC-720 (acceptance_criterion-72db61ca) | G3 store-flag propagation / BUNDLE-7 | aligned — render/serve/crop from the sandbox store, `source`+`cwd` forwarded alongside `--sandbox`, fall-through to `sites/` when absent; 1:1 with story-body clause 3 |

### Property outcomes

- **Consistency**: PASS. Every AC body describes a criterion that follows directly
  from a STORY-79 body clause. No AC asserts behavior the story does not support.
- **Coverage**: PASS. STORY-79 (`story_kind=upgrade`, in-matrix) has ACs, and its
  three-guarantee behavioral surface is fully covered: G1→AC-656, G2→AC-657 +
  AC-658 + AC-659 (the story's three G2 sub-clauses decomposed 1:1), G3→AC-720.
  No story-body behavior is left unaddressed; no retired behavior is described.
- **Exclusivity**: PASS. Closest pair is AC-657 / AC-658. They share the negative
  "no diagnostics on stdout in `--json` mode", but each carries a distinct
  verifiable core: AC-657 asserts stdout IS a single parseable JSON document
  (positive shape, `--json` only); AC-658 asserts diagnostics land ON stderr AND
  that this holds in human-readable mode too (where no JSON document exists). This
  is the story body's own decomposition of G2, not a duplicated criterion.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | AC-720 (acceptance_criterion-72db61ca) | — | AC-720 has `status=pending` (created 2026-07-22 from BUNDLE-7) while the four BUNDLE-6 ACs are `active`. This reflects its recency in the lifecycle, not intent drift — its behavior (G3) is live cumulative intent and correctly covered. No ac-level action. | none |

## Notes for the Editor

- **Not re-counted here (owned by story level):** REPORT-831 (report-faa78d91,
  story level) raised warning #1 — the CAP-66 *capability umbrella body*
  enumerates only guarantees 1 and 2 and attributes the capability solely to
  bundle-ab9e0cb6, omitting guarantee 3 (BUNDLE-7). That is a `story-body-edit` on
  the capability umbrella, not an ac-level element, so it does not appear as an
  ac-level warning. The ac-level matrix is unaffected: the STORY-79 body DOES carry
  guarantee 3 and AC-720 covers it. Flagged here only so the editor addresses the
  umbrella-body edit under the story-level report, not twice.
- No intent-ledger silence or ambiguity encountered; no `needs_review` items.
