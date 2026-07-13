---
uid: story-bb049a62
id: STORY-73
type: story
title: Component-owned typography driven by theme subscales
created_by: xgd
created_at: '2026-07-13T20:48:20.572027+00:00'
updated_at: '2026-07-13T20:57:03.149951+00:00'
completed_at: null
last_field_updated: status
status: completed
fields:
  intent_uid: bundle-d9c2e655
  capability_uid: capability-0bd1623e
  story_kind: feature
  story_points: 3
---

## Story
**As a** site author reproducing a reference design, **I want** the type of component-owned sub-elements (badge labels, checklist items) to derive from named theme subscales that read in the same units the fidelity tools speak, **so that** I can fix a systemic type gap once at the theme (and see it reported as one theme finding, not a wall of per-element failures) while still overriding a single instance when a genuine one-off demands it.

## Description
Component-owned sub-elements — badge labels and checklist items in the services grid — previously carried type hard-coded in module CSS, so a systemic design-system mismatch (e.g. every badge 14/20 on the reference vs 12/13 in the reproduction) fired as N identical per-element deltas under exact-match diffing.

This capability introduces theme-level **subscales**: named type ramps (`badge`, `checklist`, extensible by adding a slot) each expressed in the render's px vocabulary — the six style axes `fontFamily`, `fontSizePx`, `fontWeight`, `color`, `letterSpacingPx`, `lineHeightPx`. The same vocabulary is used by the capture and by per-instance overrides, so a value captured from a reference drops straight into a subscale (or a per-instance style) with zero unit translation.

In scope:
- Theme subscales as a first-class part of the type system; setting a subscale changes every consuming instance's rendered type (systemic fix); defaults preserve the prior hard-coded services-grid values so existing sites are unchanged.
- The services-grid badge label and checklist item consume the theme subscale.
- A per-instance style escape hatch on a single card (badge label style / checklist item style) overrides the theme subscale for that card only.
- Capture reads a reference page's subscales from the page's own semantics (checklist from list-item semantics; badge from small, short-text, strongly-rounded pill runs), aggregating a cohort of ≥2 like members into one systemic ramp (the modal value per axis); a lone element yields no subscale.
- The fidelity value-diff compares subscales ramp-to-ramp and attributes a systemic gap to the theme as ONE finding, rolling up (suppressing) the per-element rows it explains, with an opt-out that restores them for debugging.

Out of scope: new modules (this generalizes existing modules via the theme layer + escape hatch); button-label typography (named in the intent as a future subscale slot but not implemented in this bundle); the exact-match tolerance policy itself ([[story-dadb8475]]) and the object-grouped report structure ([[story-74050e88]]) it composes with.

## Technical Context
- Subscales use the render's px vocabulary verbatim (`number | string` per axis), deliberately distinct from the existing `typography.scale` CSS-unit strings, so render → token → per-instance override → diff all speak the same units with zero conversion. Each field is optional; only set axes affect output; defaults fill `badge`/`checklist` so the subscale mechanism is always emitted.
- Capture requires a cohort of ≥2 members before emitting a subscale (a subscale is a *systemic* ramp, not a one-off), and excludes interactive pills (CTAs) from the badge cohort.
- The value-diff rollup deliberately overrides the REQ-48 systemic-aggregation convention ("headline, not a rollup — per-element rows stay") **only** for subscale-explained badge/checklist deltas, because exact-match diffing ([[story-dadb8475]]) would otherwise present a systemic theme gap as identical repeated per-element failures. The opt-out is the debugging escape hatch that keeps those rows.
- Phase-5 attribution consumes the object-card / per-element delta granularity from [[story-74050e88]] and the exact-match tolerance policy from [[story-dadb8475]] — hence the code-level dependency on both.
- The per-instance escape hatch reuses the styled-run override fields from the styled-text model ([[story text-markup, REQ-54]]); no new per-instance concept is introduced.

## Dependencies
Plan items 1 (Object-grouped fidelity report — [[story-74050e88]], STORY-67) and 2 (Exact-match tolerance policy — [[story-dadb8475]], STORY-68). Phase-5 subscale attribution rolls up the object-grouped, exact-match per-element rows those items produce.

## Story Points
3