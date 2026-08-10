---
uid: acceptance_criterion-56334082
id: AC-873
type: acceptance_criterion
title: A newly created site states its document background and placeholder colour
  as hex literals in its own layout document, and declares no palette
created_by: xgd
created_at: '2026-08-06T03:42:59.130974+00:00'
updated_at: '2026-08-10T08:16:13.097888+00:00'
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

A newly created site states its starting colours as **hex literals in its own
layout document** — the document background and the inherited page text colour —
and the placeholder run takes the document's text colour rather than restating a
third value. Creation declares **no palette**: neither a site-level palette nor a
colour surface on the theme.

This is where a fresh site's colour comes from now. It formerly came from the
theme's closed colour palette, which no longer exists: the colour token group was
retired with the legacy palette, so the theme a created site carries is the
non-colour groups only (typography, spacing, radius, shadow, container,
breakpoints), and every one of those still arrives untouched.

A literal is always a valid colour, so a starting page needs no palette to be
complete — the palette is the *refinement* a site adopts once it has colours worth
grouping, derived from what the author actually painted rather than seeded ahead
of them. The scaffold accordingly invents no third colour: every colour value
anywhere in the seeded document is one of the two the document itself declares,
so the page remains the single place a fresh site's colour is stated.

## Verification

Create a site and read both artifacts it writes — the site metadata and the home
page — back off disk. Assert both page-level colours are hex literals, and that
the placeholder run's colour is the document's own text colour. Assert the site
metadata declares no palette at either level, and that the theme it does carry is
exactly the non-colour token groups. Collect every colour value in the seeded
document and assert each is one the document declares, so no colour enters from
outside the page.