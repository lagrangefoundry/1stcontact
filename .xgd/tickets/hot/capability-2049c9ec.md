---
uid: capability-2049c9ec
id: CAP-71
type: capability
title: Capture-to-L1 Reproduction Fold
created_by: xgd
created_at: '2026-07-22T19:41:21.754682+00:00'
updated_at: '2026-07-23T07:16:25.599105+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: capture-to-l1-fold
  uat_coverage: pass
---

# Capture-to-L1 Reproduction Fold

Folding a multi-viewport site capture into a single, renderable L1 reproduction
document plus an advisory structural-hint sidecar. This is the mechanical
front-half of the framework-pivot reproduction pipeline: capture → fold → (render
→ gate against the retained oracle).

Distinct from the L1 substrate capability (the typed tree + envelope + renderer)
and from the values-diff/size-aware capture-diff capabilities. This capability
owns the *fold* (ladder → one absolute-base L1 doc with geometry keyframes),
oracle retention, and the advisory structural hints read for direction (never
executed by the render path).