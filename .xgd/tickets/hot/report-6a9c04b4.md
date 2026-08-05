---
uid: report-6a9c04b4
id: REPORT-1296
type: report
title: 'Capability-Intent Alignment: reproduction-gate-3probe (level=uat)'
created_by: xgd
created_at: '2026-08-05T19:14:35.558740+00:00'
updated_at: '2026-08-05T19:14:35.558740+00:00'
completed_at: null
last_field_updated: created_at
result: pass
fields:
  report_kind: capability_validation
  subject_uid: capability-8108afab
  level: uat
  violations: 0
  warnings: 0
  needs_review_count: 0
---

# Capability-Intent Alignment: reproduction-gate-3probe
# Level: uat

**Result**: PASS
**Violations**: 0
**Warnings**: 0
**Needs review**: 0

## Summary

CAP-73 (`capability-8108afab`) was **absorbed into CAP-71** (`capability-2049c9ec`,
"L1 Reproduction Pipeline: Fold & Acceptance Gate") by the 2026-08-05 structural
rebalance. It carries `fields.merged_into: capability-2049c9ec` and its body documents
the absorption explicitly.

**Its story tree is empty → its AC layer is empty → its UAT layer is empty.** There are
zero UATs in scope for this check, so consistency, coverage, and exclusivity are
vacuously satisfied at the `uat` level.

An emptied, absorbed capability is not drift. The substantive alignment question is
therefore whether the UAT evidence CAP-73 used to carry **survived the move intact**.
It did — verified directly against the test files, not inferred from the reassignment.
All 11 ACs formerly under this capability have present, substantive UATs, now owned and
validated under CAP-71's own cycle.

Per the level cascade, the story and AC levels are my working reference here; both ran
earlier today (REPORT-1294 story=PASS, REPORT-1295 ac=PASS) and reached the same
structural conclusion. I did not take that on trust — ownership and evidence survival
were re-verified independently below.

## Verification performed

The stale-index defect named in the capability body makes the naive story query
misleading (I reproduced it again this run), so ownership was confirmed against
authoritative ticket reads rather than index listings:

| Check | Command | Result |
|---|---|---|
| Naive story listing | `list --type story --filter fields.capability_uid=capability-8108afab` | Returns STORY-86 at stale ts 2026-07-29 — **misleading** |
| Sole story's true owner | `xgd ticket get story-24098299` | `capability_uid: capability-2049c9ec` — **not** this capability |
| ACs pointing at this capability | `list --type acceptance_criterion --filter fields.capability_uid=capability-8108afab` | `[]` — zero |
| AC ownership | `list --type acceptance_criterion --filter fields.story_uid=story-24098299` | 11 ACs, reachable only via CAP-71 |

### UAT evidence survival (the substantive check at this level)

Every one of the 11 ACs formerly in this capability's tree resolves to a present UAT:

| AC | UAT file |
|---|---|
| AC-705, AC-706, AC-707, AC-708, AC-709, AC-710, AC-724 | `tests/reconciliation-3probe-gate.test.ts` |
| AC-734, AC-735, AC-736, AC-737 | `tests/reconciliation-3probe-gate-evaluator.test.ts` |

Zero ACs resolve to NONE. The tests are substantive, not structural/AST stubs:

- 1362 lines across the two suites (700 + 662)
- 210 `expect(...)` assertions (122 + 88)
- **Zero `vi.mock` / `jest.mock`** — no internal mocking, satisfying the evidence-validity
  rule and the thin-mock strategy

## Cumulative Intent Considered

CAP-73 itself carries no `intent_uid` / `updated_by` field; its intent lineage is
reachable only through STORY-86 (`story-24098299`), the sole story it ever held.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-7 (`bundle-31e474b9`) — REQ-63 + REQ-79 + REQ-82 + REQ-83 + REQ-84 + 2 more | free_and_reconciled (`merged_at_commit edeb1c2c`) | 2026-07-22 | REQ-86 established the end-to-end 3-probe gate; originating intent for STORY-86 and its AC tree | YES — expressed under CAP-71 |
| BUNDLE-8 (`bundle-cceaba25`) — BUG-7 + REQ-89..92 + 5 more | free_and_reconciled (`merged_at_commit b1bd5b6b`) | 2026-07-29 | BUG-7 evaluator row/flow width; BUG-8 breakpoint keyframe/snap hold; BUG-9 recursive structure recovery | YES — expressed under CAP-71 |

No intent in the ledger is retired, abandoned, or draft. No intent's asked behaviour
became unexpressed by the absorption — it changed owner, not existence. The later
BUNDLE-8 refinements are visibly landed in the AC layer that moved (AC-734 row tiling,
AC-735 half-open breakpoint intervals, AC-736 backing-surface overlap, AC-737 fold-residual
channel), each with a UAT in the evaluator suite.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-73 UAT layer (empty) | BUNDLE-7, BUNDLE-8 (both via STORY-86, now departed) | aligned — vacuous by design; capability is a historical pointer with `merged_into` set |
| UATs for AC-705..AC-710, AC-724 | BUNDLE-7 (REQ-86) | aligned — present in `reconciliation-3probe-gate.test.ts`, owned by CAP-71 |
| UATs for AC-734..AC-737 | BUNDLE-8 (BUG-7/8/9) | aligned — present in `reconciliation-3probe-gate-evaluator.test.ts`, owned by CAP-71 |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | info | coverage | CAP-73 UAT layer | — | Zero UATs in scope, vacuously covered. Verified positively (not assumed): all 11 departed ACs have present, non-stub, internally-unmocked UATs under CAP-71. | none |
| 2 | info | consistency | CAP-73 (`capability-8108afab`) | — | Capability remains `status: active` with `uat_coverage: pass` while holding zero UATs — a vacuous pass a downstream reader could misread as evidence. Root cause is the known `reject_deprecation_if_capability_has_stories` / stale-index defect, already raised as a warning at story level (REPORT-1294 finding #1) and filed upstream in REPORT-1266. Not re-raised as a warning here to avoid triple-counting one tooling defect across three levels. | None project-side. Flip to `status: deprecated` once the index is rebuilt on main. |
| 3 | info | — | CAP-73 story index | — | Stale index reproduced again this run: the `capability_uid=capability-8108afab` story filter still returns STORY-86 at ts 2026-07-29, while the ticket itself reads `capability-2049c9ec` at ts 2026-08-05. Same root cause as #2; already a story-level warning (REPORT-1294 finding #2). | No project-side edit; treat filter-based story-tree reads on this branch worktree as unreliable. |

## Notes for the Editor

**This capability needs no matrix repair at the UAT level.** The empty UAT layer is the
intended end state of the absorption, and the evidence that formerly hung here is intact
under CAP-71.

**On the zero-warning count.** The two open issues on this capability (stuck `status:
active`, stale story index) are real and were reproduced this run, but they are a single
upstream xgd tooling defect already filed in REPORT-1266 and already carried as warnings
at the story level. Re-raising them at `ac` (which reported 0 warnings) and again at `uat`
would inflate counts without adding signal, so they are recorded here as `info` with
cross-references. They are bugs in the xgd system repo, not this project's tickets, and
will clear when the index is rebuilt on main.

**Carry to CAP-71's own alignment pass** (out of scope here, repeated from REPORT-1294 so
it is not lost when CAP-73 is finally deprecated and its reports stop being read):
STORY-86's body still refers to CAP-71 as an *external* dependency in three places
("Out of scope: the fold itself, including which residuals it emits (CAP-71)"; "Depends on
... the capture→L1 fold + retained oracle (CAP-71, plan item 2)"; "Dependencies — Plan
item 2 ... (CAP-71)"). Post-absorption STORY-86 lives *inside* CAP-71 alongside STORY-84
(the fold story), so these references are now self-referential. That is a story-body-edit
against CAP-71, not against this capability.
