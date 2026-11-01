---
uid: report-9d308c71
id: REPORT-811
type: report
title: 'Capability-Intent Alignment: Framework Responsive Per-Breakpoint Dials (level=story)'
created_by: xgd
created_at: '2026-07-23T08:58:36.670350+00:00'
updated_at: '2026-07-23T08:58:36.670350+00:00'
completed_at: null
last_field_updated: created_at
result: fail
fields:
  report_kind: capability_validation
  subject_uid: capability-bd0b722e
  level: story
  violations: 0
  warnings: 0
  needs_review_count: 1
---

# Capability-Intent Alignment: Framework Responsive Per-Breakpoint Dials
# Level: story

**Result**: FAIL
**Violations**: 0
**Warnings**: 0
**Needs review**: 1

_Attempt 3 (previous_attempt_count=2). Re-assessed fresh against current state.
The single auto-fixable violation from REPORT-807 (report-a1c346dc) was resolved
in fix attempt 1 (commit `00a518c5`); the story body is now accurate. One genuine
operator-disposition `needs_review` remains and cannot be closed by the fix loop._

## Cumulative Intent Considered

Chronological ledger of intents that touched CAP-68 (capability-bd0b722e).
Both intents are `bundle` tickets; both fully reconciled.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (bundle-ab9e0cb6 = REQ-58+59+62+61) | free_and_reconciled | 2026-07-17 (merged 7a42e182) | Originating intent (intent_uid). gigabytealchemy re-import that landed responsive per-breakpoint **module dials** (`{base,sm,md,lg,xl}`) + header `navCollapse`. | YES |
| BUNDLE-7 (bundle-31e474b9 = REQ-63+79+82+83+84+2) | free_and_reconciled | 2026-07-22 (merged edeb1c2c) | updated_by. REQ-79/REQ-84 framework pivot (commit `1a2faeee`) **deleted** the semantic layout modules + their dials (every per-breakpoint length dial and `navCollapse`); REQ-82/83 re-homed per-viewport variation into the **L1 geometry-keyframe** substrate. | YES (retires + re-homes) |

**Cumulative intent (current):** the per-breakpoint-module-dial and `navCollapse`
delivery is RETIRED. Per-viewport length variation SURVIVES as a behaviour, but
its delivery moved to L1 geometry keyframes (`interpolate|snap` segments), which
the story body itself scopes out to the **L1 stories** — owned by CAP-70 (L1
Layout Substrate) and CAP-71 (Capture-to-L1 Fold). CAP-68 retains no distinct
behaviour of its own. The ledger records WHY CAP-68 is hollow but does NOT dictate
its capability-lifecycle disposition (deprecate vs. retain-as-pointer).

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-81 (story-3569e1a4, `upgrade`, status=**archived**, 0 ACs) | BUNDLE-6 (intent_uid), BUNDLE-7 (updated_by) | Body narrative aligned to intent: correctly records the pivot (dials/`navCollapse` retired, per-viewport re-homed to L1) AND now accurately states "no repointing AC has been created under CAP-68" and that the disposition is open. The prior false claim ("a single AC repoints the capability to L1 keyframes") is GONE — REPORT-807 violation #1 resolved. |
| CAP-68 (capability-bd0b722e, status=**active**) | BUNDLE-6, BUNDLE-7 | Hollow: `active` capability whose only story is archived with 0 ACs. No active matrix element expresses current intent. Capability body still narrates the retired dials + `navCollapse` in present tense (historical, not re-pointed). Disposition unresolved. |

**Code/consistency spot-checks (independently re-run this attempt — all TRUE):**
- `grep -rE 'navCollapse|perBreakpoint|breakpointDial' packages/ tools/` → **0 hits** (matches "no symbol remains").
- L1 keyframe schema present: `packages/site-schema/src/l1/schema.ts` → `l1KeyframeSchema` (L38), `l1SegmentSchema = z.enum(['interpolate','snap'])` (L49), geometry `keyframes`/`segments` track (L58–59). Matches "grounded in schema.ts".
- Capture→L1 fold present: `tools/generate/src/l1/fold.ts` → `foldToL1` (L112) emits per-viewport keyframes. Matches "grounded in fold.ts".
- No residual stale module-dial ACs (AC-666..AC-671, AC-673 all absent).

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | needs_review | coverage | CAP-68 (capability-bd0b722e) | — | CAP-68 is `active`, but its only story (STORY-81) is `archived` with 0 ACs, so no active matrix element expresses current intent. The surviving per-viewport behaviour is owned by CAP-70/CAP-71, not CAP-68 — the capability is hollow. Both governing intents (BUNDLE-6, BUNDLE-7) are `free_and_reconciled`; the ledger explains WHY CAP-68 is empty (REQ-79/84 pivot) but is silent on the capability-lifecycle disposition: (A) deprecate CAP-68 (fully absorbed into CAP-70/71) vs. (B) retain it `active` with a thin L1-repointing story+AC and a rewritten body. Genuinely ambiguous → do not guess. | Operator decision required: select (A) deprecate or (B) retain-as-L1-pointer. This is NOT auto-fixable by the fix loop. |
| 2 | info | consistency | STORY-81 (story-3569e1a4) | — | REPORT-807 violation #1 ("story body claims a single AC repoints the capability to L1 keyframes"; no such AC) is RESOLVED. Current body accurately states the disposition is open and no repointing AC exists. Body narrative + all code/AC-removal claims independently re-verified TRUE. | none |
| 3 | info | consistency | CAP-68 body | — | Capability body still describes the retired per-breakpoint dials + `navCollapse` in present tense. This is contingent on finding #1: under (A) the body stands as historical record; under (B) it must be rewritten to describe the L1 keyframe substrate. Not an independent violation — its resolution is determined by the #1 disposition. | Deferred to #1 outcome. |

## Notes for the Editor / Operator

**One blocker, unchanged in substance across three attempts: CAP-68's disposition
is an operator decision the intent ledger does not encode.** Everything auto-fixable
is already done (attempt 1 neutralised the STORY-81 body; attempt 2 recorded the
durable escalation COMMENT-350 on STORY-81). The fix loop cannot advance further —
a `needs_review` requiring a product taxonomy call is, by the check's own rules,
not something the editor may guess.

Two paths (as recorded on COMMENT-350):
- **(A) Deprecate CAP-68** — fully absorbed into CAP-70/CAP-71; no distinct
  behaviour remains; body stands as historical record. (Editor's standing
  recommendation, per CLAUDE.md "Simplicity Over Preservation / No Legacy Modes":
  a retain-as-pointer capability is pure indirection over behaviour CAP-70/71
  already own.)
- **(B) Retain CAP-68 active** — add a thin L1-repointing story + AC and rewrite
  the capability body to describe the L1 keyframe substrate.

Report lineage: REPORT-807 (report-a1c346dc, original find) → attempt-1 fix
(commit `00a518c5`, violation resolved) → REPORT-809/REPORT-810 + COMMENT-350
(attempt-2 escalation) → this report (attempt 3, re-affirming the pending
disposition). Deterministic verdict: FAIL on the single open `needs_review`.
