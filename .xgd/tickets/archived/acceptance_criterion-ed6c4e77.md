---
uid: acceptance_criterion-ed6c4e77
id: AC-660
type: acceptance_criterion
title: 'A colour dial set to a #hex literal renders that exact colour'
created_by: xgd
created_at: '2026-07-19T03:09:45.845945+00:00'
updated_at: '2026-07-19T03:17:35.900342+00:00'
completed_at: null
last_field_updated: status
status: active
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
---

## Criterion

When a site definition sets a colour-typed dial — a services-grid card accent, a
per-card checklist-tick colour, a footer text or link colour, or a contact-form
submit fill — to an absolute `#hex` literal (e.g. `#90a1b9`), the published site
renders that element in exactly that colour, byte-for-byte, without snapping to any
restricted palette set.

## Verification

Author a site whose module sets each colour dial to a distinct `#hex` value, build
it, and confirm the rendered output carries those exact colour values on the
corresponding elements (the accent bar, the tick, the footer link, the submit fill).