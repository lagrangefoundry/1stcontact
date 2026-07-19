---
uid: acceptance_criterion-2336086b
id: AC-664
type: acceptance_criterion
title: A malformed length value fails site validation with a descriptive error
created_by: xgd
created_at: '2026-07-19T03:10:24.774254+00:00'
updated_at: '2026-07-19T03:10:24.774254+00:00'
completed_at: null
last_field_updated: created_at
status: pending
fields:
  story_uid: story-c490f1cf
  kind: behavior
  regression_only: false
---

## Criterion

When a site definition sets a length-typed dial to a malformed value (a typo, an
unknown unit, or otherwise not a recognisable length — neither an absolute/relative/
content length nor a known step token), site validation fails loudly and reports an
error that identifies the offending field and states the value must be a length (a
px value, a container token, a relative unit, or `fit-content`). The malformed value
never passes silently through to broken CSS.

## Verification

Validate a site definition containing a length dial set to a bad value (e.g.
`8ppx`), and confirm validation reports a failure naming the field and describing
the expected length forms.
