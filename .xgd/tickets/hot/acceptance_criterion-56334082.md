---
uid: acceptance_criterion-56334082
id: AC-873
type: acceptance_criterion
title: A newly created site's document background and placeholder colour come from
  the site's own theme tokens, not from literals invented by the scaffold
created_by: xgd
created_at: '2026-08-06T03:42:59.130974+00:00'
updated_at: '2026-08-06T03:49:36.692216+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-86c7c21b
  kind: behavior
  regression_only: false
---

## Criterion
The document background colour of a newly created site's layout document equals
the background colour in that same site's theme, and the placeholder run's colour
equals the theme's text colour. The scaffold introduces no colour value that is
not already stated in the site's theme, so the theme remains the single place
colour is declared for a fresh site.

## Verification
Create a site and read both artifacts it writes — the site metadata (carrying the
theme) and the home page. Assert the layout document's background equals the
theme's background colour and the placeholder run's colour equals the theme's
text colour, comparing against the theme read from the created site rather than
against a hard-coded value.