---
uid: capability-6e088083
id: CAP-67
type: capability
title: Framework Absolute-or-Overlay Value System
created_by: xgd
created_at: '2026-07-19T03:08:58.653511+00:00'
updated_at: '2026-07-19T03:08:58.653511+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: framework_value_system
---

# Framework Absolute-or-Overlay Value System

Every value-typed dial on a site-definition module accepts either an **absolute
literal** (the base) or a **named overlay** (a palette role, a spacing/size step,
or a corner shape — a design affordance layered on top).

This realises the operator's reproduction mandate: *absolute values are the base;
a palette / step scale is an overlay of constants — a design convenience, but an
impediment to reproducing a captured site.* Because a captured site's values are
concrete (a `#hex`, an exact px), a reproduction author must be able to declare
them exactly, while a from-scratch design author keeps the named vocabulary.

Spans three value TYPES:
- **Colour** — card accent, per-card check tick, footer text/link, submit fill.
- **Length** — spacing, gap, logo size, content offset/inset, panel padding,
  content width, across every spacing-bearing module.
- **Radius** — CTA shape, panel corner.

Genuine modes (alignment, layout, list marker, etc.) stay enums; multi-role
surface treatments (surface/panel/submit/scrim bg+text pairings) stay treatments.
