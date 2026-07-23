---
uid: capability-6e088083
id: CAP-67
type: capability
title: Framework Absolute-or-Overlay Value System
created_by: xgd
created_at: '2026-07-19T03:08:58.653511+00:00'
updated_at: '2026-07-23T09:43:27.017175+00:00'
completed_at: null
last_field_updated: body
status: active
fields:
  name: framework_value_system
---

# Framework Absolute-or-Overlay Value System

The reproduction mandate is a design *principle*: **absolute values are the base;
a named scale is an overlay of constants** — a design convenience, but an
impediment to reproducing a captured site. Because a captured site's values are
concrete (a `#hex`, an exact px), a reproduction author must be able to declare
them exactly, while a from-scratch design author would keep a named vocabulary.

**Delivery of the absolute base is now the L1 layout substrate.** Following the
framework pivot (REQ-79), the semantic *layout* modules (header, hero, footer,
text-block, services-grid, layer) and their ~20 colour/length/radius dials were
deleted (REQ-84). The absolute base those dials delivered is **re-homed on L1 leaf
axes**: each L1 leaf (box / text / image) carries the concrete value directly as a
typed literal, guaranteed well-formed and in range by the envelope validator.

How each value TYPE carries the absolute base in L1:
- **Colour** — a hex-only literal (`#rgb` / `#rrggbb` / `#rrggbbaa`), used
  verbatim; non-hex strings (`rgb()`, keywords, `url()`) are rejected.
- **Length / geometry** — a finite numeric px literal, used verbatim, bounded by
  the envelope (font-size 1–400, geometry ±100k, length ±100k).
- **Radius / corner** — a finite numeric px literal (`borderRadiusPx`), within the
  envelope length bounds.

**The named-overlay half is the parked L2 design library.** The overlay side of
the principle — palette role, named spacing/size step, named corner shape — is the
**L2 design library parked by REQ-79 (#4, "possibly never needed")**. It is not
currently delivered anywhere: L1 carries only the absolute literal (REQ-79 #2, "one
value = one literal field — no theme-role indirection in L1"), never an
`absolute OR role` union. If ever built, the overlay is an authoring-layer
convenience layered above the L1 substrate, not part of the safe substrate itself.
