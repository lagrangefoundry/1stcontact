---
uid: story-3569e1a4
id: STORY-81
type: story
title: 'Responsive dials: length parameters vary per breakpoint and the nav collapse
  point is configurable'
created_by: xgd
created_at: '2026-07-19T03:20:16.873338+00:00'
updated_at: '2026-07-19T03:31:26.488568+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-ab9e0cb6
  capability_uid: capability-bd0b722e
  story_kind: feature
  story_points: 3
---

## Story
**As a** site-definition author reproducing or designing a responsive site, **I want** to declare a module's length parameters differently per viewport-width breakpoint and to choose the width at which the header navigation collapses, **so that** the published site adapts across screen sizes exactly as the reference does, using absolute values or named steps at each breakpoint.

## Description
Extends the absolute-or-overlay value model along the breakpoint axis. Any length-bearing dial may be given either a single scalar value (constant across all widths, unchanged behaviour) OR a per-breakpoint object `{ base, sm?, md?, lg?, xl? }`. Each per-breakpoint entry is itself an absolute px literal or a named step (the literal-or-overlay affordance from the value system). The framework applies "override and up" semantics: a viewport uses the nearest defined override at or below its width, falling back to `base`.

Per-breakpoint form is honoured across the enumerated spacing-bearing dials — spacing top/bottom, gap, logo size, content offset, content inset, panel padding — and across the `contentWidth` max-width cap, where an entry may also mean "no cap" (bleed) at a given width, and a per-breakpoint cap requires a base cap.

Also adds a `navCollapse` dial (sm / md / lg / xl / none, default md) on the header, selecting the width below which the nav collapses to a hamburger toggle; `none` never collapses. Because a media-query threshold cannot read a custom property, the collapse breakpoint is a named overlay (a mode), not an absolute px.

**In scope:** per-breakpoint length dials, per-breakpoint content-width cap, configurable nav collapse, schema acceptance of the per-breakpoint object shape.
**Out of scope:** per-breakpoint colour/radius; the responsive-diff tooling (separate story); the layer position model (pre-existing, REQ-15).

## Technical Context
Builds on CAP-67 (Absolute-or-Overlay Value System): each per-breakpoint entry resolves through the same literal-or-overlay seam, so `{ base: 24, md: 'lg' }` means 24px at base and the `lg` step at ≥768px. Shares one breakpoint vocabulary (BREAKPOINTS sm/md/lg/xl at 640/768/1024/1280px, override-and-up cascade) with the REQ-15 layer position model, lifted into a shared primitive so the two models cannot drift. A scalar dial value is byte-identical to prior behaviour — no per-breakpoint variation is introduced for scalar dials. The `navCollapse` default `md` reproduces the framework's former hardcoded 768px collapse.

## Dependencies
- Plan item 6 — CAP-67 / STORY-80 (Absolute-or-Overlay Value System): supplies the literal-or-overlay resolution each per-breakpoint entry reuses.

## Story Points
3