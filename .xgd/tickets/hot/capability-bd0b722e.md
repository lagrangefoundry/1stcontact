---
uid: capability-bd0b722e
id: CAP-68
type: capability
title: Framework Responsive Per-Breakpoint Dials
created_by: xgd
created_at: '2026-07-19T03:19:55.309934+00:00'
updated_at: '2026-07-23T09:34:53.451057+00:00'
completed_at: null
last_field_updated: uat_coverage
status: superseded
fields:
  name: framework_responsive_dials
  superseded_by_uid: capability-ae9d65d6
  uat_coverage: pass
---

# Framework Responsive Per-Breakpoint Dials — SUPERSEDED

**Status: superseded by CAP-70 (L1 Layout Substrate + Safety Envelope,
`capability-ae9d65d6`) on 2026-07-23.** The surviving behaviour also surfaces
through CAP-71 (Capture-to-L1 Reproduction Fold, `capability-2049c9ec`), which
folds the capture ladder into the L1 keyframes.

## Disposition (operator decision, 2026-07-23) — RETIRE, do not retain

This capability is **retired**, not retained as a pointer. The REQ-79 / REQ-84
framework pivot (BUNDLE-7, merged `edeb1c2c`, commit `1a2faeee`) deleted the
semantic layout modules (header, hero, footer, text-block, services-grid, layer)
and every dial they carried — including all per-breakpoint length dials and the
header `navCollapse` dial. That delivery mechanism no longer exists in code
(`navCollapse` / `perBreakpoint` / `breakpointDial`: 0 hits across `packages/`
and `tools/`).

The surviving concern — a module's per-viewport-width variation — was re-homed to
the **L1 layout substrate** as per-viewport geometry keyframes with
`interpolate | snap` segments (`l1KeyframeSchema` / `l1SegmentSchema` in
`packages/site-schema/src/l1/schema.ts`; `foldToL1` in
`tools/generate/src/l1/fold.ts`). That behaviour is owned by CAP-70 and CAP-71.
CAP-68 has no distinct behaviour of its own remaining.

No thin "L1-repointing" AC is retained under CAP-68: a hollow pointer would
duplicate ownership CAP-70/CAP-71 already hold, contradicting the project policy
"close capability gaps in L1, not with new modules" and "when replacing an
approach, delete the old one — no legacy containers." The container is therefore
superseded and carries no active stories (its sole story, STORY-81, is archived).

## Historical scope (what this capability delivered before the pivot)

Originating intent BUNDLE-6 (REQ-58/59/61/62) landed responsive per-breakpoint
**module dials** (`{ base, sm?, md?, lg?, xl? }`) on spacing-bearing layout
modules plus a header `navCollapse` dial, extending the absolute-or-overlay value
system (CAP-67 / [[framework_value_system]]). All of it was retired by BUNDLE-7
above.