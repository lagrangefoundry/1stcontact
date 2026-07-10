---
uid: acceptance_criterion-1c466493
id: AC-567
type: acceptance_criterion
title: Per-element geometry, shape and a11y are captured for every rendered element
  and text-free fields
created_by: xgd
created_at: '2026-07-10T01:22:55.017876+00:00'
updated_at: '2026-07-10T01:22:55.017876+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-8f33f14c
  kind: behavior
  regression_only: false
---

## Criterion
The captured `capture.json` projection descends from the section level to **every rendered content run**, recording per element (in rendered/geometric/a11y terms, never a CSS mechanism): `box` (its `getBoundingClientRect()` rectangle in full-page document coords), shape (`borderRadiusPx`, `boxShadow`), an accessibility `a11yRole`, and an `arrangement` of `row` vs `stack` derived from geometry relative to the previous element in the section. Additionally, **text-free rendered elements** — form controls (`input`/`textarea`/`select`), `hr` dividers, and media `img` children (capture descends into layer/montage children) — are captured as a per-section `fields[]` list, each with its `box`, resolved `accessibleName`, and a `nameSource` of `placeholder` (name inside the box) vs `label`/`aria`/`alt`/`text` (name outside), so they can be paired on `a11yRole + document order` with an unmatched element failing safe as a presence delta.

## Verification
Capture a fixture page containing a heading, a paragraph, a contact-form with an unlabelled placeholder input and a `<label>`-associated input, an `<hr>`, and a montage/layer with `<img>` children. Assert each content run records a per-element `box`, `borderRadiusPx`, `boxShadow`, `a11yRole`, and an `arrangement` matching its geometric relationship to the prior element (an inline-right element reads `row`, a stacked-below one `stack`). Assert the inputs, divider, and img children appear in the section's `fields[]` with their `box` and `accessibleName`, that the placeholder input records `nameSource: "placeholder"` while the labelled input records `nameSource: "label"`, and that an element with no text join key is present as a field rather than dropped.
