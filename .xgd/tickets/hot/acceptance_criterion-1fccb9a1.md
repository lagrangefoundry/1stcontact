---
uid: acceptance_criterion-1fccb9a1
id: AC-782
type: acceptance_criterion
title: A page carrying an L1 body and behaviour instances bound to existing seams
  is accepted as one page
created_by: xgd
created_at: '2026-08-03T03:20:18.431888+00:00'
updated_at: '2026-08-03T03:20:18.431888+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-02f21b8a
  kind: behavior
  regression_only: false
---

## Criterion

A page whose body is an L1 document containing one or more named seams, and
which also carries behaviour instances where each instance names a seam present
in that document and no seam is named twice, validates successfully. The L1
document is still the single page body; the instances are mounted into it. A page
carrying an L1 body and no behaviour instances, and a page carrying behaviour
instances and no L1 body, both remain valid page shapes.

## Verification

Validate a site whose page carries both an L1 document with a seam and a
behaviour instance naming that seam; the validation reports success with no
errors. Repeat for the two single-half shapes and confirm both still validate.
