---
uid: report-5cbad5d1
id: REPORT-1290
type: report
title: 'Capability-Intent Alignment: framework_value_system (level=story)'
created_by: xgd
created_at: '2026-08-05T18:50:02.738532+00:00'
updated_at: '2026-08-05T18:50:02.738532+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-6e088083
  level: story
  violations: 2
  warnings: 1
  needs_review_count: 0
---

# Capability-Intent Alignment: framework_value_system
# Level: story

**Result**: FAIL
**Violations**: 2
**Warnings**: 1
**Needs review**: 0

## Headline

`capability-6e088083` (CAP-67) was **absorbed into `capability-ae9d65d6` (CAP-70)**
by the 2026-08-05 structural rebalance (`report-bdaf6840`). Its only story,
STORY-80 (`story-c490f1cf`), now carries `capability_uid: capability-ae9d65d6`
(`last_field_updated: capability_uid`, `updated_at: 2026-08-05T17:24:18Z`).

**CAP-67's story tree is therefore empty, yet its `status` is still `active` and
its body still asserts, in the present tense, the full absolute-or-overlay value
system.** An active capability that holds zero stories expresses none of the
intent its own body claims. That is the drift this level exists to catch.

Note on a misleading query: `xgd ticket list --type story --filter
"fields.capability_uid=capability-6e088083"` **still returns STORY-80**, and so
does the same query for `capability-ae9d65d6`. The ticket record is authoritative
(→ CAP-70); the filter result is the stale-branch-index defect documented in
`report-bdaf6840`. Any downstream consumer reading the index sees STORY-80 under
both capabilities.

## Cumulative Intent Considered

REQ-58/61/62/63/79/82/85 are no longer individually indexed — they were folded
into their reconciliation bundles, which are the addressable intent records.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (`bundle-ab9e0cb6`) — REQ-58+59+62+61 | free_and_reconciled | 2026-07-17 (merged `7a42e18`) | Originating intent of STORY-80: absolute values as the base, named scale as an overlay | YES |
| REQ-83 (`request-56d62b72`) | free_and_reconciled | 2026-07-20 | Framework pivot B2: capture→L1 fold (keyframes + oracle) | YES |
| REQ-84 (`request-f243b6b9`) | free_and_reconciled | 2026-07-20 | Framework pivot C: deleted hero/footer/text-block/services-grid/layer and their ~20 colour/length/radius dials — retired the module-dial delivery of the absolute base | YES (retired) |
| BUNDLE-7 (`bundle-31e474b9`) — REQ-63+79+82+83+84+2 more | free_and_reconciled | 2026-07-22 (merged `edeb1c2`) | `updated_by` on STORY-80: the pivot itself (REQ-79 language triviality #2 "one value = one literal field"; REQ-82 envelope security; REQ-85 superseded-AC list) | YES |
| REQ-91 (`request-42385423`) | free_and_reconciled | 2026-07-23 | Extended L1 axes to captured pixel-movers; reaffirms "every axis is typed and numeric/enum/hex, no raw-CSS holes" | YES |
| **REQ-114 (`request-3cd338cd`)** | **ready_to_reconcile** | **2026-07-31** | **L1 palette colour model: widens `l1Color` from hex-only to `hex \| PaletteRef`; "Colour takes the same shape geometry already has — absolute base, overlay"; retires the closed 15-slot `paletteTokensSchema`** | **imminent** |

**Cumulative picture**: the absolute base is delivered by L1 leaf literals
(BUNDLE-6 → REQ-84 retired the module-dial delivery → BUNDLE-7 re-homed it on L1).
The overlay half was parked — **until REQ-114, which un-parks it.** REQ-114 is
`ready_to_reconcile` with `main_sha: null` (`working_sha e82cba5`), so it counts
as live intent but is **not yet enforced on this branch**: `l1Color` at
`packages/site-schema/src/l1/schema.ts:20-25` is still hex-only regex. Code and
matrix currently agree; the matrix's *absolute* phrasing is what REQ-114 breaks.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| CAP-67 (`capability-6e088083`) — the capability shell | BUNDLE-6, BUNDLE-7, REQ-84, REQ-91 | **gap**: `status: active`, zero stories attached, body still asserts full current-tense delivery — duplicates CAP-70 |
| CAP-67 story tree | — | **empty** (0 stories). STORY-80 reassigned to CAP-70 on 2026-08-05 |
| STORY-80 (`story-c490f1cf`) | BUNDLE-6, BUNDLE-7 | **out of scope for this capability** — now under `capability-ae9d65d6`; body content is correct for reconciled intent, but carries the same REQ-114-stale absolutes (see Notes) |
| CAP-70 (`capability-ae9d65d6`) — survivor | BUNDLE-6, BUNDLE-7, REQ-84, REQ-91 | holds the live expression of this intent (5 stories incl. STORY-80); its §"Absolute-or-overlay value system" duplicates CAP-67's body |

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | violation | coverage | CAP-67 (`capability-6e088083`) | story-body-edit | Capability is `status: active` with **zero stories** (STORY-80 reassigned to `capability-ae9d65d6`, 2026-08-05), yet its body asserts current-tense delivery of the absolute base across colour/length/radius. No intent in the ledger — BUNDLE-6, BUNDLE-7, REQ-84, REQ-91 — is expressed by any story under this capability, because it has none. | Reduce the body to a bare pointer stub ("Absorbed into `capability-ae9d65d6`; see that capability for the live description") and delete the duplicated substantive description. Setting `status: deprecated` is the correct terminal fix but is **blocked** — see Notes. |
| 2 | violation | exclusivity | CAP-67 + CAP-70 (`capability-ae9d65d6`) | story-body-edit (merge) | Two `active` capabilities describe the same intent-mandated behavior. CAP-67's "How each value TYPE carries the absolute base in L1" (hex-only colour, finite px length/geometry, `borderRadiusPx`) is duplicated by CAP-70's §"Absolute-or-overlay value system". Both cite the same intents (REQ-84 deletion of the ~20 module dials; REQ-79 #2 literal-field rule; REQ-79 #4 parked L2 overlay). | Keep CAP-70 as the single owner; strip the duplicated prose from CAP-67 per finding 1. Same remedy as #1. |
| 3 | warning | consistency | CAP-67 body (and, downstream, STORY-80 / AC-716 under CAP-70) | story-body-edit | Body states the overlay half "is **not currently delivered anywhere**" and that L1 carries "**never** an `absolute OR role` union". REQ-114 (`request-3cd338cd`, ready_to_reconcile, 2026-07-31) explicitly widens `l1Color` to `hex \| PaletteRef` and frames colour as "absolute base, overlay" — the exact union the body forecloses. Imminent, so per the status table it counts as live but is not yet enforced (`main_sha: null`; `schema.ts:20` still hex-only). | Soften the absolutes to state-of-main phrasing: "as of main, L1 carries only the literal; the palette overlay is specified by REQ-114 and pending reconciliation." Do **not** assert delivery yet. |
| 4 | info | — | CAP-67 / branch ticket index | — | `--filter fields.capability_uid=capability-6e088083` returns STORY-80 even though the ticket record says `capability-ae9d65d6`; the same query on CAP-70 also returns it. Known stale-branch-index defect, already documented in `report-bdaf6840`. | none (system defect, not matrix content) |

## Notes for the Editor

**The blocked deprecation — do not retry it on this branch.** `report-bdaf6840`
records that `reject_deprecation_if_capability_has_stories` calls
`attached_story_ids()`, which on a branch worktree resolves to the canonical main
store still holding the pre-merge `capability_uid`. It therefore reports phantom
attached stories and refuses the status change. `--branch` is blocked identically,
and `xgd ticket rebuild-index` refuses on branch worktrees by design. The rebalance
run set `merged_into: capability-ae9d65d6` and a body banner as the workaround.
**Findings 1 and 2 are still actionable without deprecation** — the body edit needs
no index write. Treat `status: active` as a carried-forward system blocker to be
cleared by a later run on main, not as work for this cycle.

**Cross-cutting REQ-114 pattern.** The "hex-only / never a role union" language is
not confined to CAP-67. It also appears verbatim in STORY-80's Description and
Technical Notes ("the substrate carries the literal, not an `absolute OR role`
union") and in AC-716's Criterion ("The named-overlay affordance … is an
authoring-layer convenience above L1, not part of the safe substrate"). Those two
now sit under `capability-ae9d65d6` and are **out of scope for this report** —
they should be picked up by CAP-70's own alignment cycle. Flagging here so the
pattern is not fixed in one place and missed in the other three.

**Second defect from the same report, affecting any re-run here.**
`xgd ticket list --type capability` returns 22 entries for 11 capabilities on this
worktree, so `assemble_capability_tree()` double-counts. Structural health numbers
computed on this branch are unreliable independent of this capability's state.

**What is genuinely healthy.** The intent chain itself is sound: BUNDLE-6
established the principle, REQ-84 retired the module-dial delivery, BUNDLE-7
re-homed the absolute base onto L1 leaf axes, and the code on this branch matches
(`l1Color` hex-only at `packages/site-schema/src/l1/schema.ts:20`; finite-number
guard at `:27`). No reconciled intent is orphaned and no retired behavior is still
claimed as live. The failure here is structural bookkeeping from the rebalance,
not a lost or misdescribed capability.
