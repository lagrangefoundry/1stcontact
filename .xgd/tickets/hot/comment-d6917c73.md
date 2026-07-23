---
uid: comment-d6917c73
id: COMMENT-350
type: comment
title: Comment on story STORY-81
created_by: xgd
created_at: '2026-07-23T08:53:19.065925+00:00'
updated_at: '2026-07-23T08:53:19.065925+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: story-3569e1a4
  kind: note
---

**DISPOSITION PENDING — operator decision required** (recorded by fix_structural_validation, attempt 2, 2026-07-23).

CAP-68 (capability-bd0b722e) is **hollow**: this story is `archived` with 0 ACs, so no active matrix element expresses current intent, while the capability remains `active` and its body still describes the retired per-breakpoint module dials + `navCollapse` in present tense.

Cause (both intents `free_and_reconciled`): the REQ-79/REQ-84 framework pivot (BUNDLE-7, commit `1a2faeee`) deleted the semantic layout modules and all their per-breakpoint length dials + `navCollapse`. The surviving behaviour — per-viewport length variation — was re-homed to the L1 geometry-keyframe substrate (REQ-82/83), now owned by **CAP-70** (L1 Layout Substrate) and **CAP-71** (Capture-to-L1 Fold). CAP-68 has no distinct behaviour of its own remaining.

This is a `needs_review` disposition, NOT an auto-fixable violation (violations = 0). Two paths:
- **(A) Deprecate** — CAP-68 fully absorbed into CAP-70/CAP-71; no distinct behaviour remains; its body stands as historical record. *(Editor's standing recommendation, per CLAUDE.md "Simplicity Over Preservation / No Legacy Modes" — a retain-as-pointer capability is pure indirection over behaviour CAP-70/CAP-71 already own.)*
- **(B) Retain** — keep CAP-68 `active` with a thin L1-repointing story + AC, and rewrite the capability body to describe the L1 keyframe substrate.

The editor declines to guess the disposition (per fix-loop rules). See reports report-c1bbead2 (REPORT-809), report-9260fc31, and prior report-a1c346dc. Awaiting operator selection of (A) or (B).
