---
uid: report-503fe1b7
id: REPORT-1311
type: report
title: 'Capability-Intent Alignment: gradient_fidelity (level=ac)'
created_by: xgd
created_at: '2026-08-05T20:10:39.454501+00:00'
updated_at: '2026-08-05T20:10:39.454501+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-36dd68c5
  level: ac
  violations: 0
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: gradient_fidelity
# Level: ac

**Result**: PASS
**Violations**: 0
**Warnings**: 1
**Needs review**: 0

## Summary

`capability-36dd68c5` (CAP-64) holds **zero live stories** and therefore **zero ACs**.
Its sole story STORY-76 (`story-82eb6908`) was reassigned to `capability-aa030c83`
(CAP-63, `1c_capture_diff_fidelity`) by the 2026-08-05 structural rebalance, and its five
ACs (AC-634…AC-638) moved with it. The ac-level element set for this capability is empty,
so consistency, coverage, and exclusivity are all vacuously satisfied at this level.

**No gradient intent is unexpressed.** REQ-59 (text-fill stop positions) and REQ-62
(panel/surface gradients) are both `free_and_reconciled` and both remain fully covered by
AC-634…AC-638 — all `status: active`, all `uat_coverage: pass` — under STORY-76/CAP-63.
Verified independently by reading each AC body, not by inheriting the story-level report.

The outstanding drift for this capability is the **un-retired husk** (still `status:
active`, body still asserting ownership, dangling rebalance-report citation) plus a
**ticket-index defect**. Both are capability/story-level concerns already recorded as four
violations in REPORT-1310 (`report-292d4308`, level=story, FAIL, same cycle, 2026-08-05
20:05 UTC) and are **not** re-counted here — re-raising them at ac level would double-count
the same drift and, worse, invite the wrong resolution shape (`ac-add` under a husk).

## Cumulative Intent Considered

| Intent ID | UID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|---|
| REQ-59 | `request-bc936f38` | free_and_reconciled | 2026-07-13 | `1c capture`: record gradient stop positions (text-fill gradients) | YES |
| REQ-62 | `request-90edd177` | free_and_reconciled | 2026-07-16 | Gradient panel fill: capture + render + diff a background gradient (not just text fills) | YES |
| BUNDLE-6 | `bundle-ab9e0cb6` | free_and_reconciled | merged `7a42e182` | Carrier bundle (REQ-58+59+62+61); recorded `intent_uid` on CAP-64 and STORY-76 | YES |
| Structural rebalance | — | 2026-08-05 | Reassigned STORY-76 to CAP-63; set `merged_into`; appended ABSORBED note | Operational (no intent ticket) |

No intent in the ledger is `abandoned` / `deprecated` / `wont_fix`. All gradient behavior
asked for by REQ-59 and REQ-62 is active intent and must remain expressed somewhere in the
matrix — and it is (under CAP-63).

## Alignment Ledger

Elements in ac-level scope for `capability-36dd68c5`: **none** (no stories → no ACs).
Recorded below is where the capability's intent now lives, so a future check can see what
was known at this point in time.

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-64 `capability-36dd68c5` | REQ-59, REQ-62 via BUNDLE-6 | **empty at ac level** — zero stories, zero ACs; nothing to validate |
| STORY-76 `story-82eb6908` | REQ-59, REQ-62 | **out of scope** — `capability_uid: capability-aa030c83` (authoritative file read); `story_kind: feature`, `status: completed`, `uat_coverage: pass` |
| AC-634 `acceptance_criterion-f338ed5b` | REQ-59 | aligned (under CAP-63) — stop-position drift beyond ±2pp surfaces as a gradient delta; within tolerance, none |
| AC-635 `acceptance_criterion-a555336c` | REQ-59 | aligned (under CAP-63) — stops with no explicit offset compared on colour only; absent offsets never fabricate a delta |
| AC-636 `acceptance_criterion-72a041dd` | REQ-62 | aligned (under CAP-63) — surface-gradient axis, distinct from text colour and solid surface-fill comparison |
| AC-637 `acceptance_criterion-377af866` | REQ-62 | aligned (under CAP-63) — authored gradient resolves to a panel surface fill, absolute-or-overlay stop colours, <2 stops → no fill |
| AC-638 `acceptance_criterion-a657c39c` | REQ-62 | aligned (under CAP-63) — gradient-typed content field accepts well-formed, rejects malformed with field-identifying error |

**Consistency**: vacuous — no ACs in scope.
**Coverage**: no gap — REQ-59 covered by AC-634/AC-635; REQ-62 covered by AC-636/AC-637/AC-638.
**Exclusivity**: clean — a matrix-wide scan of all 106 ACs found exactly five whose title mentions "gradient", all five under `story-82eb6908`. No duplicate gradient criterion exists anywhere.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | warning | consistency | CAP-64 `capability-36dd68c5` (body) | story-body-edit | Capability body still reads in the present tense as owned behavior and closes with "Stories under this capability document the captured gradient shape, the gradient comparison axes and tolerances, and the gradient authoring value." Read at face value this implies an AC surface under CAP-64 that does not exist. It is an ac-level *echo* of REPORT-1310 finding #2, not an independent defect — and it must **not** be resolved by authoring ACs. | Resolve via the story-level finding: rewrite the body as a pure pointer to CAP-63. Do **not** apply `ac-add`. |
| 2 | info | coverage | AC-634…AC-638 | — | All five gradient ACs verified `status: active`, `uat_coverage: pass`, bodies substantive (criterion + verification), correctly parented to `story-82eb6908` under CAP-63. REQ-59 and REQ-62 lose no expression from the absorption. | none |
| 3 | info | consistency | Ticket index (XGD tooling) | code-issue (already filed) | The index returns a stale duplicate row for STORY-76 under `capability_uid=capability-36dd68c5` (`updated 2026-07-24`) alongside the true row under `capability-aa030c83` (`updated 2026-08-05`). Confirmed a *tooling* defect, not a data one: exactly one file exists on disk (`story-82eb6908.md`), and `xgd ticket get story-82eb6908` reports `capability-aa030c83`. Human-ID lookup is also broken — `xgd ticket get STORY-76`, `REPORT-898`, `REPORT-1310` all fail with "not found" while their UIDs resolve. Already recorded as REPORT-1310 finding #4. | none here — see REPORT-1310 |

## Notes for the Editor

**This PASS is not a statement that CAP-64 is healthy.** It is scoped to the ac level, whose
element set is empty. The capability husk remains unrepaired as of this run: `status: active`,
`merged_into: capability-aa030c83`, no `superseded_by_uid`, zero stories. Those four
violations live in REPORT-1310 (`report-292d4308`) and are the story-level cycle's to close.
Passing them through a second time at ac level would inflate the violation count for a single
underlying defect.

**The one thing an ac-level editor must not do** is treat the empty AC set as a coverage gap
and author replacement ACs under CAP-64. That would create the exact exclusivity violation
(duplicate gradient criteria in two capabilities) this level exists to prevent. The correct
action is retiring the husk.

**Methodology note — the index defect changes how this level must be queried.** A naive
ac-level run that trusts `xgd ticket list --type story --filter fields.capability_uid=
capability-36dd68c5` will see a phantom STORY-76 and validate five ACs that are no longer in
scope. Every claim in this report was therefore established by authoritative per-ticket reads
(`xgd ticket get <uid>`, and `--view --flags fields` sweeps cross-checked against the on-disk
file set) rather than index filters. Any re-run before the index is rebuilt should do the same.

**Attempt history.** `previous_attempt_count: 3`. The prior ac-level report REPORT-898
(`report-ef3cb592`, 2026-07-24) was FAIL; REPORT-844 (`report-7a858346`, 2026-07-23) was PASS.
The current empty-scope state is a consequence of the 2026-08-05 rebalance, not of an
unresolved earlier ac-level finding. No repeat fix attempt at this level is warranted —
further cycles on CAP-64 will keep re-detecting the same husk until the lifecycle transition
(and the six identical husks REPORT-1310 names) is completed.
