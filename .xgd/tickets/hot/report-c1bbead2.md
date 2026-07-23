---
uid: report-c1bbead2
id: REPORT-809
type: report
title: 'Capability-Intent Alignment: Framework Responsive Per-Breakpoint Dials (level=story)'
created_by: xgd
created_at: '2026-07-23T08:49:57.004762+00:00'
updated_at: '2026-07-23T08:49:57.004762+00:00'
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

**Attempt**: 2 (previous_attempt_count=1). The prior fix (REPORT-808 /
fix_structural_validation, commit 00a518c5) resolved the single consistency
violation from REPORT-807. The remaining blocker is a needs_review that is,
by construction, an **operator disposition decision** — not an auto-fixable
violation. State re-read fresh this attempt; the fix was verified applied.

## Cumulative Intent Considered

Chronological ledger of the intents that touched CAP-68 (capability-bd0b722e).
Both intents are `bundle` tickets; both fully reconciled.

| Intent ID | Status | When | Asked / changed | Counts? |
|---|---|---|---|---|
| BUNDLE-6 (bundle-ab9e0cb6 = REQ-58+59+62+61) | free_and_reconciled | 2026-07-17 (merged 7a42e182) | Originating intent (`intent_uid` of STORY-81). gigabytealchemy re-import that landed responsive per-breakpoint **module dials** (`{base,sm,md,lg,xl}`) on spacing-bearing layout modules + header `navCollapse`. | YES |
| BUNDLE-7 (bundle-31e474b9 = REQ-63+79+82+83+84+2) | free_and_reconciled | 2026-07-22 (merged edeb1c2c) | `updated_by` of STORY-81. REQ-79/REQ-84 framework pivot (Phase C, commit 1a2faeee) **deleted** the semantic layout modules + all their dials (every per-breakpoint length dial and `navCollapse`); REQ-82/83 re-homed per-viewport variation into the **L1 geometry-keyframe** substrate (`interpolate\|snap` segments). | YES (retires + re-homes) |

**Cumulative intent (current):** the per-breakpoint-module-dial and `navCollapse`
delivery is RETIRED. Per-viewport length variation SURVIVES as a behaviour, but
its delivery moved to L1 geometry keyframes, which the story body scopes to the
**L1 stories** — owned by CAP-70 (L1 Layout Substrate) and CAP-71 (Capture-to-L1
Fold), not CAP-68. CAP-68 has no distinct behaviour of its own remaining. The
ledger explains WHY CAP-68 is hollow but is SILENT on its disposition.

## Alignment Ledger

| Element | Intents aligned to | Outcome |
|---|---|---|
| STORY-81 (story-3569e1a4, `upgrade`, status=**archived**) | BUNDLE-6 (intent_uid), BUNDLE-7 (updated_by) | Body narrative aligned to intent: correctly records the pivot (dials/navCollapse retired, per-viewport re-homed to L1) AND is now disposition-neutral. The prior false claim that "a single AC repoints the capability to L1 keyframes" has been REMOVED (fix commit 00a518c5); the body now states plainly that no repointing AC has been created and the retire-vs-retain disposition is escalated (report-a1c346dc). Verified: 0 ACs under STORY-81 (active or archived). No stale-AC drift. |
| CAP-68 (capability-bd0b722e, status=`active`) | BUNDLE-6, BUNDLE-7 | Hollow. Capability is `active`, but its sole story is `archived` with zero ACs, so no active matrix element expresses current intent. The capability BODY still describes the retired per-breakpoint dials + `navCollapse` in present tense; whether that body must be rewritten (retain path) or is acceptable-as-history (deprecate path) is itself disposition-dependent. → folded into needs_review #1, not a standalone violation. |

**Code / consistency spot-checks (re-run this attempt — all TRUE):**
- `grep -E 'navCollapse|perBreakpoint|breakpointDial' packages/ tools/` → **0 hits** (matches "no symbol remains").
- `packages/site-schema/src/l1/schema.ts` → `l1KeyframeSchema` (L38), `l1SegmentSchema = z.enum(['interpolate','snap'])` (L49), geometry keyframe track (L58–59). L1 substrate present.
- `tools/generate/src/l1/fold.ts` → `foldToL1` emits per-viewport keyframes + per-segment `interpolate|snap` (L7, L73–84). Fold present.
- Old module-dial ACs (AC-666..AC-671, AC-673) → NOT FOUND. STORY-81 AC count → 0.

## Findings

| # | Severity | Property | Element | Resolution category | Issue | Suggested edit |
|---|---|---|---|---|---|---|
| 1 | needs_review | coverage / consistency | CAP-68 (capability-bd0b722e) | — | CAP-68 is `active` but hollow: its ONLY story (STORY-81) is `archived` with zero ACs, so no active matrix element expresses current intent; AND the capability body still describes the retired per-breakpoint module dials + `navCollapse` as scope (contradicting BUNDLE-7 = REQ-79/84, free_and_reconciled, which deleted them). The surviving per-viewport behaviour is owned by CAP-70/CAP-71. The intent ledger explains WHY CAP-68 is hollow but does NOT dictate its disposition. Both the capability-body rewrite AND any repointing story/AC are contingent on that decision. Ambiguous → do not guess. Carried forward from REPORT-807; STILL UNRESOLVED — no operator decision, and STORY-81 has no disposition comment. | Escalate to operator: decide CAP-68 disposition — **(A) deprecate** (fully absorbed into CAP-70/CAP-71; no distinct behaviour remains) vs. **(B) retain** active with a thin L1-repointing story+AC and a rewritten body. |
| 2 | info | consistency | STORY-81 (story-3569e1a4) | — | The prior consistency VIOLATION (REPORT-807 #2) — body falsely claimed "a single AC repoints the capability to L1 keyframes" — is RESOLVED. Fix commit 00a518c5 removed the claim; current body is disposition-neutral and accurate. Verified no repointing-AC assertion remains and 0 ACs exist. No longer a violation. | none |
| 3 | info | consistency | STORY-81 | — | Story narrative + all code / AC-removal claims re-verified TRUE this attempt (L1 keyframes in schema.ts, `foldToL1` in fold.ts, navCollapse/per-breakpoint symbols absent, old ACs gone). This is NOT a code bug: the surviving behaviour is present and correct under CAP-70/CAP-71. | none |

## Notes for the Editor

Single root gap, unchanged since REPORT-807: the REQ-79/84 framework pivot
hollowed CAP-68, and the reconciliation was left half-applied. The auto-fixable
half (the false-AC consistency claim) is now FIXED — violations = 0. The
remaining half is a genuine operator disposition (deprecate vs. retain-as-L1-
pointer) that the intent ledger does not resolve; the fixer correctly declined
to guess and marked `needs_more_work: false`. The stale CAP-68 body is deliberately
NOT raised as a separate violation because its correct resolution is itself
disposition-dependent: on the deprecate path the body is acceptable as historical
record (no edit needed); on the retain path it must be rewritten to describe the
L1 keyframe substrate. Raising it independently would force a guess.

**This FAIL is an escalation, not a fix-loop trigger.** violations = 0; there is
nothing for the fix workflow to repair. The one blocker is the CAP-68 disposition
decision, which needs the operator. The editor's standing recommendation (from
REPORT-808) is **(A) deprecate**, consistent with CLAUDE.md "Simplicity Over
Preservation / No Legacy Modes" — a retain-as-pointer capability would be pure
indirection over behaviour already fully owned by CAP-70/CAP-71.
