---
uid: acceptance_criterion-34b88d22
id: AC-870
type: acceptance_criterion
title: A freshly created site renders to HTML with no editing, painting the placeholder
  run as a centred, flowed element on the document background
created_by: xgd
created_at: '2026-08-06T03:42:32.246473+00:00'
updated_at: '2026-08-10T08:16:16.118430+00:00'
completed_at: null
last_field_updated: uat_coverage
status: active
fields:
  story_uid: story-86c7c21b
  kind: behavior
  regression_only: false
  uat_coverage: pass
---

## Criterion
Rendering a site immediately after creating it succeeds and emits at least one
output file. The emitted home document's body contains a text element carrying
the site's slug as its content (not merely the slug appearing in page metadata
such as the title), laid out by a root that flows and centres its children, and
painted on the document background colour the created page's own **layout
document** declares.

The provenance matters as much as the paint: the colour in the rendered bytes is
the colour seeded on disk, carried through the render unchanged. (Its former
source, the theme's colour palette, was retired with the legacy palette — see
AC-873 for where a fresh site's colour is stated now.)

## Verification
Create a site, then render it with no intervening edit. Assert the render
reports a non-empty file set, and that the emitted markup's body — not the whole
document — contains a text element whose content is the slug. Assert the emitted
styling places the root in a flowed, centre-aligned layout, and that it paints
the document background in the colour read back from the created page's layout
document rather than a value restated in the test.