---
uid: report-75d9b744
id: REPORT-808
type: report
title: Fix Framework Responsive Per-Breakpoint Dials (story) — attempt 1
created_by: xgd
created_at: '2026-07-23T08:44:31.585451+00:00'
updated_at: '2026-07-23T08:44:31.585451+00:00'
completed_at: null
last_field_updated: created_at
fields:
  report_kind: fix_structural_validation
  subject_uid: capability-bd0b722e
  level: story
  fixes_applied: 1
  progress_made: true
  needs_more_work: false
  violations_remaining: 0
  anchor_report_uid: report-9260fc31
---

# Fix Summary — Framework Responsive Per-Breakpoint Dials (story)

**Attempt**: 1
**Fixes applied this call**: 1
**Violations remaining**: 0
**Needs more work**: false (remaining item is needs_review — operator decision)

## Actions Taken — by Resolution Category

| # | Category | Element | Action |
|---|---|---|---|
| 1 | story-body-edit | STORY-81 (story-3569e1a4) | Removed the false consistency claim "a single AC repoints the capability to L1 keyframes" from Technical Context. Replaced with an accurate, disposition-NEUTRAL statement: the surviving per-viewport variation is owned by CAP-70 (L1 Layout Substrate) + CAP-71 (Capture-to-L1 Fold), not this capability; the retire-vs-retain disposition is flagged as open (report-a1c346dc); no repointing AC has been created under CAP-68. All other sections (Story, Description, In/Out of scope, Story Points) preserved verbatim. |

This resolves Finding #2 (consistency violation): the story body no longer
describes a matrix element that was never realised. The edit is deliberately
disposition-neutral — it does NOT prejudge Finding #1 (deprecate vs. retain),
which remains an operator decision.

## Code Edits (if any)

None this call. Per the report's own spot-checks and the Alignment Ledger, this
is not a code bug: L1 keyframes (`packages/site-schema/src/l1/schema.ts`) and the
capture→L1 fold (`tools/generate/src/l1/fold.ts`) are present and correct under
CAP-70/CAP-71. The drift was purely in CAP-68's matrix disposition.

## needs_review Items Forwarded

| Element | Assessor said | Operator decision needed |
|---|---|---|
| CAP-68 (capability-bd0b722e) | CAP-68 is `active` but its only story (STORY-81) is `archived` with zero ACs — no active matrix element expresses current intent. Behaviour fully re-homed to CAP-70/CAP-71. Intent ledger explains WHY it is hollow (REQ-79/84 pivot) but does NOT dictate disposition. "Ambiguous → do not guess." | Decide CAP-68 disposition: **(A) deprecate** CAP-68 (fully absorbed into CAP-70/71 — no distinct behaviour remains) vs. **(B) retain** active with a thin L1-repointing story+AC. On (A): no further AC needed; body already corrected this call. On (B): create one active story+AC repointing CAP-68 to the L1 keyframe substrate. Editor recommendation: **(A) deprecate**, consistent with CLAUDE.md "Simplicity Over Preservation / Ruthless Refactoring / No Legacy Modes" — a retain-as-pointer capability would be pure indirection over behaviour already owned by CAP-70/71. |

## Why needs_more_work=false

Finding #2 (the sole violation) is resolved. Finding #3 is info-only (no action).
Finding #1 is needs_review and cannot be resolved autonomously — it requires an
operator disposition decision. No violations remain for me to act on, so control
returns to the assessor with the needs_review forwarded above.
