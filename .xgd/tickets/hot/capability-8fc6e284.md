---
uid: capability-8fc6e284
id: CAP-58
type: capability
title: Hero-Segment Object Positioning
created_by: xgd
created_at: '2026-07-13T20:22:22.167658+00:00'
updated_at: '2026-07-13T20:22:22.167658+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: hero_segment_object_positioning
---

# Capability: Hero-Segment Object Positioning

Free per-object placement of the named objects of the hero segment — the
overlay header wordmark and the hero eyebrow / heading / subhead / cta — using
the framework's shared band-coordinate model (the same model layer children
use). An author may lift any of these objects out of normal flow and place it at
an explicit band coordinate (x/y/w as band percentages, z, rotate), turning the
hero segment (with the overlaid wordmark) into a single art-direction canvas,
while objects without a position keep flowing exactly as before.

This capability governs *where hero-segment objects sit*. It is distinct from
the fidelity-tooling capabilities (CAP-56 value-diff reporting, CAP-57 capture
extraction) which measure a reproduction; this one is the framework rendering
surface that produces the placement being measured.
