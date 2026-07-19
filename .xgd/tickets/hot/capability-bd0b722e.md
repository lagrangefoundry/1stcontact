---
uid: capability-bd0b722e
id: CAP-68
type: capability
title: Framework Responsive Per-Breakpoint Dials
created_by: xgd
created_at: '2026-07-19T03:19:55.309934+00:00'
updated_at: '2026-07-19T03:19:55.309934+00:00'
completed_at: null
last_field_updated: created_at
status: active
fields:
  name: framework_responsive_dials
---

# Framework Responsive Per-Breakpoint Dials

A site-definition author can make a module's length parameter **vary across the
viewport width ladder**, and can choose **when a header's navigation collapses to
a hamburger**.

This extends the absolute-or-overlay value system ([[framework_value_system]] /
CAP-67) along a new axis: instead of a single value, a length dial may be a
per-breakpoint object `{ base, sm?, md?, lg?, xl? }`, each entry itself an absolute
px literal OR a named step/overlay. The framework applies "override and up"
semantics — a given width uses the nearest defined override at or below it, falling
back to `base` — the same breakpoint vocabulary the layer position model (REQ-15)
uses, so the two cannot drift.

Scope:
- **Per-breakpoint length dials** across every spacing-bearing dial the reproduction
  audit enumerated: spacing top/bottom, gap, logo size, content offset/inset, panel
  padding, and content-width cap.
- **content-width cap** as a per-breakpoint sibling: a cap can differ per width, a
  breakpoint can drop the cap (bleed / no cap), and a per-breakpoint cap requires a
  base cap.
- **Configurable nav collapse** — a `navCollapse` dial (sm/md/lg/xl/none, default
  md) chooses the width below which the header nav collapses to a hamburger toggle;
  `none` never collapses. Because a media-query threshold cannot read a custom
  property, the collapse breakpoint is a named overlay (a mode), not an absolute px.

A scalar (single-value) dial is unchanged: its value is constant across all widths.

Depends on: CAP-67 (Absolute-or-Overlay Value System) — each per-breakpoint entry
resolves through the same literal-or-overlay seam.
