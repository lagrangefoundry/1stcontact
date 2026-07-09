---
uid: acceptance_criterion-ecb1101a
id: AC-487
type: acceptance_criterion
title: Raw CSS or HTML props anywhere in a layer are rejected with a path-pointed
  error
created_by: xgd
created_at: '2026-07-09T20:43:25.820507+00:00'
updated_at: '2026-07-09T20:43:25.820507+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-4f50c054
  kind: behavior
  regression_only: false
---

## Criterion
Layer structures accept only their declared structured fields. A raw `style`, `css`, or `html` prop smuggled onto a module instance, a layer, a position, or a layer child causes validation to fail with a path-pointed error identifying the offending location. There is no escape hatch by which an instance-supplied CSS/HTML string can reach the rendered page.

## Verification
Submit a site whose module instance (and separately, whose layer child) carries a raw `style`/`css` prop to `validateSite`. Validation reports the site invalid and the error identifies the path of the offending prop. A site using only the declared structured fields validates successfully.
