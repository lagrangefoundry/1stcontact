---
uid: comment-b8824cb4
id: COMMENT-357
type: comment
title: Comment on capability CAP-68
created_by: xgd
created_at: '2026-07-23T09:20:22.897006+00:00'
updated_at: '2026-07-23T09:20:22.897006+00:00'
completed_at: null
last_field_updated: created_at
status: null
fields:
  subject_uid: capability-bd0b722e
  kind: note
---

## Operator disposition — CAP-68 container: RETIRE (superseded)

**Decision (2026-07-23):** CAP-68 is **retired**, recorded as `status=superseded`
with `superseded_by_uid=capability-ae9d65d6` (CAP-70, L1 Layout Substrate).

This resolves the standing `needs_review` (report-0801bb53, finding #1): the
intent ledger — BUNDLE-6 (`bundle-ab9e0cb6`) and BUNDLE-7 (`bundle-31e474b9`) —
was silent on the disposition of the now-behaviourless CAP-68 container. The
operator records that decision here as intent.

**Rationale:**
- BUNDLE-7 (REQ-79/REQ-84 pivot, merged `edeb1c2c`, commit `1a2faeee`) **deleted**
  CAP-68's entire delivery — the semantic layout modules and every per-breakpoint
  length dial + `navCollapse` (0 hits in `packages/` + `tools/`).
- The surviving concern (per-viewport-width variation) was **re-homed to the L1
  layout substrate** as geometry keyframes with `interpolate|snap` segments —
  behaviour now owned by CAP-70 (`capability-ae9d65d6`) and CAP-71
  (`capability-2049c9ec`). CAP-68 has no distinct behaviour of its own remaining.
- **Retire, not retain:** no thin "L1-repointing" AC is created. A hollow pointer
  would duplicate ownership CAP-70/CAP-71 already hold, contradicting project
  policy ("close capability gaps in L1, not with new modules"; "when replacing an
  approach, delete the old one — no legacy containers").

**Resulting matrix state:** CAP-68 `superseded`; sole story STORY-81
(`story-3569e1a4`) archived with a body that records the retirement as decided
(no "open disposition" hedge); zero ACs. Consistent at this boundary.
