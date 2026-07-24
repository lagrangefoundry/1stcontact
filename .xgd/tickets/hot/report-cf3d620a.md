---
uid: report-cf3d620a
id: REPORT-908
type: report
title: 'Capability-Intent Alignment: 1c CLI Argument Parsing & Output Hygiene (level=ac)'
created_by: xgd
created_at: '2026-07-24T07:57:52.914302+00:00'
updated_at: '2026-07-24T07:57:52.914302+00:00'
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

Level cascade: story-level cycle passed first (REPORT-907, report-07aa6dd1 —
0 violations). Per level priority, the STORY-79 body is the working reference at
ac level; intent history consulted only to confirm the two bundles remain
reconciled. Both do.

## Cumulative Intent Considered

Chronological ledger of intents that touched this capability (single story tree;
both bundles verified `free_and_reconciled`, so both count; purely additive —
nothing retires or modifies earlier behavior):

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| bundle-ab9e0cb6 (BUNDLE-6, "REQ-58 pass-3") | free_and_reconciled | created 2026-07-17, merged 7a42e182 | G1: `--multi-viewport` boolean flag that does not consume the following positional (commit 4f681c73). G2: `--json` output hygiene — render/bootstrap diagnostics routed to stderr, stdout restored after run/failure (commit a4323720). | YES (story `intent_uid`) |
| bundle-31e474b9 (BUNDLE-7) | free_and_reconciled | created 2026-07-22, merged edeb1c2c | G3: store-selecting flags (`--sandbox` + source + cwd) propagate into the render/serve a sub-command drives; `aligned-crops --sandbox` renders/serves from the sandbox store (commit 09fa7cf5). | YES (story `updated_by`) |

Cumulative intent = guarantees G1 + G2 + G3.

## Alignment Ledger

Sole story: STORY-79 (story-e15a19ef, kind=upgrade, status=updated). Its five ACs
map cleanly onto the three cumulative-intent guarantees:

| Element (AC) | Status | Guarantee / intent aligned to | Outcome |
|---|---|---|---|
| AC-656 (acceptance_criterion-3e4b0eab) | active | G1 / bundle-ab9e0cb6 | aligned — boolean `--multi-viewport`; slug retained in either flag order; value options keep values; no missing-slug abort. Matches story G1 verbatim. |
| AC-657 (acceptance_criterion-9c235ff1) | active | G2 / bundle-ab9e0cb6 | aligned — stdout in `--json` mode is exactly one well-formed JSON document; no diagnostic interleaving. The stdout-outcome facet of G2. |
| AC-658 (acceptance_criterion-7f078026) | active | G2 / bundle-ab9e0cb6 | aligned — the named diagnostics (re-optimization notices, deprecation warnings, one-time "Missing pages directory") land on stderr, not stdout, in both human and `--json` modes. The stderr-routing facet of G2. |
| AC-659 (acceptance_criterion-76a08c5b) | active | G2 / bundle-ab9e0cb6 | aligned — the temporary stdout diversion is always undone after the render phase, on success or throw; error propagates; stdout usable afterward. The diversion-lifecycle facet of G2. |
| AC-720 (acceptance_criterion-72db61ca) | pending | G3 / bundle-31e474b9 | aligned — `aligned-crops --sandbox` forwards store-selection (sandbox + cwd + source, default `draft`) to render and serve; non-empty crop pairs from the sandbox reproduction; without `--sandbox`, falls through to `sites/` preserving `source`. Matches story G3 verbatim. |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | consistency | AC-656 / 657 / 658 / 659 / 720 | — | Each AC's criterion follows directly from a STORY-79 guarantee; specifics (diagnostic list, `source` default `draft`, cwd forwarding, both-modes routing, no-`--sandbox` fall-through, failure-path restoration) match the story body. No AC references retired or unsupported behavior. | none |
| 2 | info | coverage | STORY-79 | — | All three story guarantees are covered by >=1 AC (G1->AC-656; G2->AC-657+658+659; G3->AC-720). No behavior in the story body — including the no-`--sandbox` fall-through and the failure-path stdout restoration — is left un-ACed. STORY-79 is kind=upgrade, so ACs are expected and present. | none |
| 3 | info | exclusivity | AC-657 / AC-658 / AC-659 | — | The three G2 ACs are distinct facets, not duplicates: AC-657 = stdout outcome (single parseable JSON doc, json mode); AC-658 = stderr routing of named diagnostics (both modes); AC-659 = diversion lifecycle/restoration incl. failure path. Different observable behaviors and streams. | none |
| 4 | info | coverage | AC-720 | — | AC-720 is the only AC with status `pending` (others `active`), yet its content fully and correctly expresses G3, whose intent (bundle-31e474b9) is `free_and_reconciled`/merged and whose code exists (commit 09fa7cf5). G3 coverage is therefore present at the ac layer; the `pending` status is a lifecycle state, not matrix drift, and no matrix content edit resolves it. Noted for editor awareness only. | none |

## Notes for the Editor

- **No AC-level drift.** All five ACs are consistent with the story body, collectively cover the story's full behavioral surface, and are mutually exclusive. PASS.
- **AC-720 status carryover (info #4).** If the workflow expects every AC backing a reconciled+merged guarantee to be `active`, AC-720's `pending` status may warrant a lifecycle transition — but this is a status operation, not an alignment repair; there is nothing to edit in the AC's content.
- **Story-level warning is out of this level's governance.** The story-level report (report-07aa6dd1) recorded one warning: the CAP-66 capability prose body still describes only G1+G2 and cites only bundle-ab9e0cb6, omitting G3 / bundle-31e474b9. That element is the capability header, not an AC — it is already recorded at the story level and is not re-raised here. Repairing the capability body (add a G3 bullet + cite bundle-31e474b9) would clear it.
