---
uid: acceptance_criterion-13fbeb46
id: AC-579
type: acceptance_criterion
title: Image and control objects carry their own kind-appropriate parameter tables
created_by: xgd
created_at: '2026-07-13T19:51:29.342482+00:00'
updated_at: '2026-07-13T19:51:29.342482+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-74050e88
  kind: behavior
  regression_only: false
---

## Criterion
Non-text objects render a parameter table appropriate to their kind rather than
the text typography table. An image object's card carries its object-fit,
intrinsic aspect, and box (plus name); a control object's card carries its
accessible name, name source, and box; a divider carries its box. Mismatches on
these kind-specific parameters are flagged inline the same way text parameters
are (e.g. an object-fit change from cover to fill is flagged; an accessible name
that moves from inside a placeholder to a label above is flagged on the
name-source row).

## Verification
Compare a pair containing an image whose object-fit differs and a control whose
name source differs. Assert the image card includes object-fit, aspect, and box
rows with the object-fit row flagged mismatched, and the control card includes a
name-source row flagged mismatched, rather than either object being rendered
with the text typography table.
