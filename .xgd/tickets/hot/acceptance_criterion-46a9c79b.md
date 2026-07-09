---
uid: acceptance_criterion-46a9c79b
id: AC-438
type: acceptance_criterion
title: Each chrome module exposes a conforming contract of variants, dials, and content
  schema
created_by: xgd
created_at: '2026-07-08T19:20:31.795075+00:00'
updated_at: '2026-07-09T21:56:42.047142+00:00'
completed_at: null
last_field_updated: body
status: pending
fields:
  story_uid: story-a224111f
  kind: behavior
  regression_only: false
---

## Criterion
Every chrome module in the catalog (header, hero, footer) exposes contract metadata that conforms to the module contract shape: a stable id, a numeric version, a finite non-empty list of layout variants, a set of dials each declaring a finite enumeration of permitted values, and a per-field content schema declaring each field's type and whether it is required. The dial surface carries structured, token-backed art-direction: header exposes `align`, `logoSize`, `logoFont`, `logoTreatment`, and spacing/surface dials; hero exposes `size`, `align`, `height`, `headingTreatment`, `scrim`, `contentAnchor`, `subheadColor`, `subheadSize`, and spacing/surface dials; footer exposes `layout` plus spacing/surface dials — every value drawn from a finite enumeration, with no raw CSS expressible in the site definition. Specifically the metadata reflects: header variants `top-nav` and `overlay`; hero variants `bg-color` and `bg-image`; footer variant `minimal`; and each module's declared dials and content fields (including the structured `logoGradient` / `headingGradient` gradient-treatment fields).

## Verification
Inspect the metadata for header, hero, and footer resolved from the catalog and assert each has an id, numeric version, non-empty variants list, dials whose values come from finite enumerations, and a content schema with typed/required-flagged fields matching the declared surface.
