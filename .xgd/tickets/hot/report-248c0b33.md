---
uid: report-248c0b33
id: REPORT-1281
type: report
title: 'Capability-Intent Alignment: capability-modules (level=story)'
created_by: xgd
created_at: '2026-08-05T18:11:34.389947+00:00'
updated_at: '2026-08-05T18:11:34.389947+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-ce902be4
  level: story
  violations: 0
  warnings: 3
  needs_review_count: 0
---

# Capability-Intent Alignment: capability-modules
# Level: story

**Result**: PASS
**Violations**: 0
**Warnings**: 3
**Needs review**: 0

## Headline

`capability-ce902be4` (CAP-72) holds **zero stories**. This is the intended
outcome of the structural rebalance run earlier in this same regression
(`report-bdaf6840`, 2026-08-05), which absorbed it into
**`capability-ae9d65d6`** (CAP-70, "Framework Substrate: L1 Layout, Values &
Behavior Modules"). The capability body documents the absorption and carries
`merged_into: capability-ae9d65d6`.

Story-level alignment therefore reduces to one question: **was the transfer
lossless?** It was. The capability's sole story moved intact, with its full
intent surface preserved, and no intent in the ledger was orphaned. There is
no story-level drift to repair.

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-79 | request-87b26bca | free_and_reconciled | 2026-07-19 | Framework pivot: L1 layout substrate + capability modules (safety envelope) — founds the module-as-behavior frame | YES |
| REQ-84 | request-f243b6b9 | free_and_reconciled | 2026-07-20 | Pivot C: strip layout modules to L1; retires the "module = bundle of aesthetic dials" model | YES (retired prior model) |
| REQ-85 | request-015e42ac | free_and_reconciled | 2026-07-20 | Pivot D: capability-module contract (config/slots/conformance) + reframe carousel & contact-form — **the founding intent for this capability** | YES |
| REQ-87 | request-84af044b | free_and_reconciled | 2026-07-21 | Mechanical rename `capability module` → **behavior module**; `kind: 'behavior'` discriminant; no back-compat alias | YES |
| BUNDLE-7 | bundle-31e474b9 | free_and_reconciled | 2026-07-22 | Reconciliation vehicle for REQ-63/79/82/83/84 + 2 more; is STORY-85's `intent_uid` | YES |
| REQ-96 | request-3a064234 | ready_to_reconcile | 2026-07-26 | Behavior modules layout-agnostic *by construction*: L1 `control` node for leaf elements; module ships **zero CSS** | imminent — see W3 |

Walking chronologically: REQ-79 → REQ-85 establish the behavior-module contract;
REQ-84 retires the pre-pivot layout-module/dials model; REQ-87 renames the type.
REQ-96 is the one live-but-unenforced addition. No intent in this ledger is
`abandoned` / `deprecated` / `wont_fix`.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| capability-ce902be4 (body) | REQ-79, REQ-84, REQ-85, REQ-87 | **aligned** — body accurately states the post-pivot behavior-module frame (vetted core + typed config + named L1 slots + conformance/isolation) and correctly records the REQ-87 rename rationale. Absorption banner is accurate. |
| *(story tree)* | — | **empty by design** — zero stories; ownership transferred to `capability-ae9d65d6` |
| STORY-85 / story-179b8c06 *(former member, now under CAP-70)* | bundle-31e474b9 (`intent_uid`), request-84af044b (`updated_by`) | **aligned, transferred intact** — body carries the full REQ-85 contract surface (config / slots / conformance), the REQ-87 `Behavior*` rename incl. the explicit "no back-compat alias" and the deliberate non-change of the `capabilities.js` filename, both survivor modules (carousel v2, contact-form v3), the shipped-client-JS asset, and the isolation dimension. Verified `capability_uid: capability-ae9d65d6`. |

**Coverage verification.** Every reconciled intent in the ledger (REQ-79, REQ-84,
REQ-85, REQ-87, BUNDLE-7) remains expressed in STORY-85 under the absorbing
capability. Nothing was dropped: the rebalance report states, and the ticket
confirms, that only `capability_uid` changed — no story content was modified.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | capability-ce902be4 | *(none — system defect)* | Capability is still `status: active` with `uat_coverage: pass` despite holding zero stories and carrying `merged_into: capability-ae9d65d6`. `uat_coverage: pass` is now vacuous. Deprecation was **blocked**, not skipped: `reject_deprecation_if_capability_has_stories` → `attached_story_ids()` reads the canonical main store, which still holds the pre-merge `capability_uid`, so it reports phantom attached stories (`report-bdaf6840`). | No matrix edit. Flip `status: deprecated` in a later run once the index resolves correctly — an xgd-repo fix, not a matrix repair. |
| 2 | warning | consistency | capability-ce902be4 (index) | *(none — system defect)* | The ticket index returns a **phantom** story for this capability: `--filter fields.capability_uid=capability-ce902be4` yields STORY-85 with `updated_at 2026-07-24`, while the actual ticket reads `capability-ae9d65d6` / `2026-08-05`. Same defect duplicates the capability list (22 entries for 11 capabilities) and breaks human-ID resolution outright — `xgd ticket get STORY-85`, `AC-698`, `REPORT-1266` all return "not found" while UID lookups succeed. | None here. Anyone re-running a capability health check on this branch must read through UIDs, not human IDs or filtered lists. |
| 3 | warning | coverage | *(scoped to capability-ae9d65d6)* | ac-add / story-body-edit — **on the absorbing capability, not this one** | REQ-96 (`request-3a064234`, ready_to_reconcile, 2026-07-26) asks that behavior modules be layout-agnostic by construction — an L1 `control` node so L1 wraps the module for leaf elements (`<input>`, `<textarea>`), with the module shipping **zero CSS**. Checked all 12 distinct stories in the store: none mentions `control`, `layout-agnostic`, or REQ-96. Not yet expressed anywhere. | Do **not** repair against capability-ce902be4. REQ-96 is `ready_to_reconcile` — live but not yet enforced — and its scope now sits under `capability-ae9d65d6`. Express it there when REQ-96 reconciles. |

No violations. No `needs_review`: the intent ledger is explicit at every point
where this capability's state could have looked ambiguous.

## Notes for the Editor

**Do not "fix" the empty story tree.** The natural-looking repair — re-attaching
STORY-85 to `capability-ce902be4` because the index says it belongs there — would
undo a verified rebalance and reintroduce the imbalance the rebalance corrected
(all 11 capabilities below the min of 20 UATs; 3 survivors now within [20, 200]).
The index entry is stale; the ticket file is authoritative and reads
`capability-ae9d65d6`.

**Both remaining anomalies are one xgd-repo defect, already flagged.** Warnings 1
and 2 share a single root cause — on a branch worktree the ticket index resolves
to the canonical main store, so it serves pre-merge `capability_uid` values.
`xgd ticket rebuild-index` refuses on branch worktrees by design, so this cannot
be cleared from here. `report-bdaf6840` already raised both this and the
`.xgd/uat_index.json` all-zero-counts defect against
`/Users/martin/lagrangefoundry/xgd`. Nothing in the capability matrix can repair
either, and no matrix edit should be attempted in response to them.

**The rename is settled — don't re-open it.** STORY-85 records two deliberate
non-changes that read like incomplete renames and should not be "completed": the
emitted asset filename stays `capabilities.js` (a plural bundle-output name, not
a type or discriminant — renaming it breaks the page reference), and the
English-word uses of "capability" in the capture layer (driver capability
negotiation) and site schema ("schema-only capability") are correct English, not
the renamed type.

**Cross-reference drift to watch at the next AC-level pass (not a finding here).**
STORY-85's "Out of scope" section still routes by the pre-rebalance topology —
"the L1 substrate itself (STORY-83 / CAP-70)", "the capture→L1 fold (STORY-84 /
CAP-71)". Now that STORY-85 itself lives in CAP-70, the first exclusion reads as
self-referential. This is an element of `capability-ae9d65d6`, outside this
check's subject, and is cosmetic rather than intent drift — but it will recur
across the absorbed stories and is worth a single sweep.
