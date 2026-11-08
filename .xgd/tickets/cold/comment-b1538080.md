---
uid: comment-b1538080
id: COMMENT-670
type: comment
title: Claude response for capability_validation report
created_by: xgd
created_at: '2026-08-05T20:43:04.793077+00:00'
updated_at: '2026-08-05T20:43:04.793077+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: report-6549691f
  kind: note
---

**REPORT-1315** (`report-6549691f`) — **FAIL**: 2 violations, 2 warnings, 0 needs_review. Schema verified (`report_kind`, `subject_uid`, `level=ac`, integer counts, top-level `result`). Read-only throughout; working tree clean apart from the auto-committed report.

## Why this level failed

The three prior ac-level cycles (REPORT-795 → 796 → 797 → 925) all passed against the **pre-consolidation** CAP-70, which held one story and seven ACs. Yesterday's rebalance merged CAP-67/68/69/72 in, so the surface is now 5 stories / 24 ACs — 17 of them never checked in this container. Both violations sit in that new material, and both are STORY-82's ACs:

- **AC-718** names the retired runtime type six times ("the contact-form **capability**", "**capability** config", and a Verification step that says "inspect the contact-form **capability meta**"). REQ-87 renamed it to *behavior module* with no back-compat alias, and sibling **AC-722** in this same capability asserts the opposite as its criterion. Code is fully renamed (`meta.ts:1,20` → `BehaviorMeta` / `kind: 'behavior'`; zero `Capability*` hits in `packages/framework/src`), so the AC's verification step points at a symbol family that no longer exists.
- **AC-719** grants an L1 leaf "(or a named overlay role)" — forbidden by REQ-79 principle #2, denied by sibling **AC-716**, and ruled out by the hex-only schema (`l1/schema.ts:19-24`, zero role/palette/token refs). Its own next sentence contradicts the parenthetical.

Both are REPORT-1314's story-level Findings 3 and 4 one level down, in the same story that missed the REQ-87 sweep.

## Two judgment calls worth your attention

**I did not re-raise REQ-93.** REPORT-1314 escalated the code/status question as needs_review at story level and it is still open; counting it again here would double-block one escalation. I recorded it as info with the downstream consequence spelled out — when you resolve it, this level needs an `ac-add` under STORY-83 and STORY-85 plus an `ac-edit` to AC-723.

**The fold decision gates the fix.** Findings 3 and 4 (warnings) are the *alternative* to the two violations, not a follow-up: AC-716/718/719 are all self-declared repointer ACs whose behaviour is already criteria elsewhere in this same capability now that the consolidation moved them in. Tellingly, they are the only three ACs in the whole project still `status: pending` (3 of 106). If REPORT-1314 Finding 6 is taken and STORY-80/82 fold away, both violations dissolve with their ACs and repairing the prose is wasted work — so decide the fold before editing.

Everything under STORY-83 and STORY-85 (21 ACs) verifies clean against story bodies and code, with no within-story duplicates remaining. One thing for the next check: AC-725/726/727/728 carry no `uat_coverage` field at all, unlike every other AC here.
