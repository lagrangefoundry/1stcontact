---
uid: capability-ae9d65d6
id: CAP-70
type: capability
title: 'Framework Substrate: L1 Layout, Values & Behavior Modules'
created_by: xgd
created_at: '2026-07-22T19:31:01.511990+00:00'
updated_at: '2026-08-08T00:44:22.339300+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  name: framework_substrate
  uat_coverage: fail
---

# Capability: Framework Substrate — L1 Layout, Values & Behavior Modules

Everything the framework itself owns after the REQ-79 / REQ-84 pivot: the typed L1
layout substrate that renders a site safe by construction, the absolute value system
re-homed onto its leaf axes, and the behavior-module contract that is the only seam
through which vetted non-layout code enters a site.

Two internal boundaries remain load-bearing and must not blur (DOC-23, DOC-24):
**layout is L1**; **behavior is a module**. They are held in one capability because
each is one facet of the single framework artifact an author configures.

## Scope

### L1 layout substrate + safety envelope
The low-level, CSS-faithful typed element tree — box / text / image / slot leaves
and stack / row / grid containers — where every value is a typed literal or closed
enum, never a freeform CSS/HTML/JS string. Its value is a safety envelope by
construction (security, robustness, cross-browser fidelity — not aesthetic rails),
enforced by two layers: an **envelope validator** admitting only in-range, in-shape
documents, and a **single safe renderer** that is the only path from tree to markup,
re-checking and neutralising every value at emit time. Includes per-viewport
geometry keyframes (`interpolate | snap`) and the round-trip identity gate
`capture(render(L1)) ≈ L1` on the authored axes.

### Absolute-or-overlay value system
The principle that **absolute values are the base and a named scale is an overlay of
constants**: a reproduction author declares a captured site's concrete `#hex` and
exact px directly. Delivery of that absolute base is the L1 leaf axes themselves —
the semantic layout modules and their ~20 colour/length/radius dials were deleted by
REQ-84 — with the named overlay parked in L2. Per-breakpoint variation of length
parameters is expressed through the L1 geometry keyframes.

### Behavior module contract & catalog
A module is no longer a bundle of aesthetic dials — it is a **behavior**: a vetted
behavioural core (framework code the AI never writes) exposing typed behavioural
config, named **L1 presentation slots**, and conformance obligations including
runtime isolation. Covers the contract, instance validation (the slot-as-L1 security
line), the reframed survivor modules (carousel, contact-form), and the
shipped-client-JS asset mechanism. See DOC-25, DOC-26.

### Reproduction treatments
The author-observable rendering of treatments that faithful reproduction forced onto
the framework — translucent frosted card veils/borders, footers whose copyright and
link/body colours depart from the surface default, and compact placeholder-labelled
/ inline contact forms — now delivered through L1 axes and the `contact-form`
behavior module rather than the deleted per-module dials.

## Out of scope

The fold and 3-probe acceptance gate (reproduction pipeline capability) and the `1c`
capture/diff axes (capture & diff fidelity capability).

## History

Consolidated 2026-08-05 by structural rebalance from `L1 Layout Substrate + Safety
Envelope` (survivor, CAP-70), `Framework Absolute-or-Overlay Value System` (CAP-67),
`Framework Responsive Per-Breakpoint Dials` (CAP-68), `Framework Reproduction Module
Treatments` (CAP-69), and `Behavior Module Contract & Catalog` (CAP-72). CAP-68 had
already been retired into CAP-70 by operator decision on 2026-07-23, and CAP-67
records that its absolute base is re-homed on L1 — the merge makes both explicit in
the matrix. Each source capability sat below the matrix minimum UAT threshold.