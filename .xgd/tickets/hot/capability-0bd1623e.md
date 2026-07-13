---
uid: capability-0bd1623e
id: CAP-61
type: capability
title: Component-Owned Typography Subscales
created_by: xgd
created_at: '2026-07-13T20:47:51.882489+00:00'
updated_at: '2026-07-13T20:47:51.882489+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: component_owned_typography_subscales
---

# Component-Owned Typography Subscales

Component-owned sub-element typography (badge labels, checklist items, and
peer sub-elements whose type would otherwise be hard-coded in module CSS) is
driven by named **theme subscales** rather than per-instance or hard-coded
values. Each subscale is a small type ramp expressed in the render's own px
vocabulary (the same six style axes the fidelity capture and per-run overrides
use), so a systemic gap is fixed once at the theme and every instance follows.

Spans the full pipeline: theme tokens/schema, the consuming module, a
per-instance style escape hatch, capture reading a page's subscales from its
own semantics, and the fidelity value-diff attributing a systemic subscale gap
to the theme (one finding) instead of a wall of identical per-element failures.
