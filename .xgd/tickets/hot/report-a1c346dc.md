---
uid: report-a1c346dc
id: REPORT-807
type: report
title: 'Capability-Intent Alignment: Framework Responsive Per-Breakpoint Dials (level=story)'
created_by: xgd
created_at: '2026-07-23T08:36:33.109766+00:00'
updated_at: '2026-07-23T08:36:33.109766+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-bd0b722e
  level: story
  violations: 1
  warnings: 0
  needs_review_count: 1
---

# Capability-Intent Alignment: Framework Responsive Per-Breakpoint Dials
# Level: story

**Result**: FAIL
**Violations**: 1
**Warnings**: 0
**Needs review**: 1

## Cumulative Intent Considered

Chronological ledger of intents that touched CAP-68 (capability-bd0b722e).
Both intents are `bundle` tickets; both fully reconciled.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (bundle-ab9e0cb6 = REQ-58+59+62+61) | free_and_reconciled | 2026-07-17 (merged 7a42e182) | Originating intent. gigabytealchemy re-import that landed responsive per-breakpoint **module dials** (`{base,sm,md,lg,xl}`) + header `navCollapse`. | YES |
| BUNDLE-7 (bundle-31e474b9 = REQ-63+79+82+83+84+2) | free_and_reconciled | 2026-07-22 (merged edeb1c2c) | REQ-79/REQ-84 framework pivot (commit 1a2faeee) **deleted** the semantic layout modules + their dials (incl. every per-breakpoint length dial and `navCollapse`); REQ-82/83 re-homed per-viewport variation into the **L1 geometry-keyframe** substrate. | YES (retires + re-homes) |

**Cumulative intent (current):** the per-breakpoint-module-dial and `navCollapse`
delivery is RETIRED. Per-viewport length variation SURVIVES as a behaviour, but
its delivery moved to L1 geometry keyframes (`interpolate|snap` segments), which
the story body itself scopes to the **L1 stories** — owned by CAP-70 (L1 Layout
Substrate, STORY-83) and CAP-71 (Capture-to-L1 Fold, STORY-84), both active with
completed feature stories. CAP-68 has no distinct behaviour of its own remaining.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-81 (story-3569e1a4, `upgrade`, status=**archived**) | BUNDLE-6 (intent_uid), BUNDLE-7 (updated_by) | Body narrative aligned to intent (correctly records the pivot: dials/navCollapse retired, per-viewport re-homed to L1). BUT the story is archived with **zero ACs**, and its own body claims "a single AC repoints the capability to L1 keyframes" — an AC that does not exist. |

**Code/consistency spot-checks (all TRUE — support the narrative):**
- `grep navCollapse|perBreakpoint|breakpointDial` over `packages/` + `tools/` → 0 hits (matches "no symbol remains").
- L1 keyframe schema present: `packages/site-schema/src/l1/schema.ts` → `l1KeyframeSchema`, `l1SegmentSchema = z.enum(['interpolate','snap'])`, geometry track (matches "grounded in schema.ts").
- Capture→L1 fold present: `tools/generate/src/l1/fold.ts` → `foldToL1` emits per-viewport keyframes + per-segment `interpolate|snap` (matches "grounded in fold.ts").
- Old module-dial ACs AC-666 / AC-671 / AC-673 → all NOT FOUND (matches "are removed"). No residual stale-AC drift.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | needs_review | coverage | CAP-68 (capability-bd0b722e) | — | CAP-68 is `active`, but its ONLY story (STORY-81) is `archived` and it has zero ACs — no active matrix element expresses current intent. Every other upgrade story in the matrix is `updated` (not archived); STORY-81 is the sole `archived` story. The surviving per-viewport behaviour is owned by CAP-70/CAP-71, not CAP-68. The story body says the capability "survives" yet scopes all its behaviour out to L1, leaving CAP-68 hollow. The intent ledger explains WHY it is empty (REQ-79/84 pivot) but does NOT dictate the disposition: deprecate CAP-68 (fully absorbed into CAP-70/71) vs. retain it active with a thin L1-repointing story+AC. Ambiguous → do not guess. | Escalate to operator: decide CAP-68 disposition (deprecate vs. retain-as-L1-pointer). |
| 2 | violation | consistency | STORY-81 (story-3569e1a4) | story-body-edit / ac-add (contingent on #1) | Story body asserts "the module-dial ACs (AC-666..AC-671, AC-673)... are removed; **a single AC repoints the capability to L1 keyframes**." No such AC exists (0 ACs, active or archived). The story body describes a matrix element that was never realised. | If #1 → retain: create the L1-repointing AC (`ac-add`). If #1 → deprecate: remove the "single AC repoints" claim from the body (`story-body-edit`). |
| 3 | info | consistency | STORY-81 | — | Story body's narrative + all code/AC-removal claims verified TRUE (see Alignment Ledger). The reconciliation reasoning itself is sound; the gap is that it was left half-applied at the capability level. | none |

## Notes for the Editor

Root cause is single: the REQ-79/84 framework pivot hollowed CAP-68, and the
reconciliation (STORY-81) was left half-applied — the story documents the move
correctly but was archived without either (a) an active L1-repointing story/AC or
(b) deprecating the capability. Findings #1 and #2 are two faces of that one gap
and should be resolved together, #1 first (it decides #2's resolution category).
This is NOT a code bug: L1 keyframes + the fold are present and correct under
CAP-70/CAP-71; the drift is purely in CAP-68's matrix disposition.
